---
title: Advanced StatefulSet
---
# Advanced StatefulSet

This controller enhances the rolling update workflow of default [StatefulSet](https://kubernetes.io/docs/concepts/workloads/controllers/statefulset/)
controller from aspects, such as adding maxUnavailable and introducing in-place update strategy.

Note that Advanced StatefulSet extends the same CRD schema of default StatefulSet with newly added fields.
The CRD kind name is still `StatefulSet`.
This is done on purpose so that user can easily migrate workload to the Advanced StatefulSet from the
default StatefulSet. For example, one may simply replace the value of `apiVersion` in the StatefulSet yaml
file from `apps/v1` to `apps.kruise.io/v1alpha1` after installing Kruise manager.

```yaml
-  apiVersion: apps/v1
+  apiVersion: apps.kruise.io/v1alpha1
   kind: StatefulSet
   metadata:
     name: sample
   spec:
     #...
```

## `MaxUnavailable` Rolling Update Strategy

Advanced StatefulSet adds a `maxUnavailable` capability in the `RollingUpdateStatefulSetStrategy` to allow parallel Pod
updates with the guarantee that the number of unavailable pods during the update cannot exceed this value.
It is only allowed to use when the podManagementPolicy is `Parallel`.

This feature achieves similar update efficiency like Deployment for cases where the order of
update is not critical to the workload. Without this feature, the native `StatefulSet` controller can only
update Pods one by one even if the podManagementPolicy is `Parallel`.

```yaml
apiVersion: apps.kruise.io/v1alpha1
kind: StatefulSet
spec:
  # ...
  podManagementPolicy: Parallel
  updateStrategy:
    type: RollingUpdate
    rollingUpdate:
      maxUnavailable: 20%
```

For example, assuming an Advanced StatefulSet has five Pods named P0 to P4, and the appplication can
tolerate losing three replicas temporally. If we want to update the StatefulSet Pod spec from v1 to
v2, we can perform the following steps using the `MaxUnavailable` feature for fast update.

1. Set `MaxUnavailable` to 3 to allow three unavailable Pods maximally.
2. Optionally, Set `Partition` to 4 in case canary update is needed. Partition means all Pods with an ordinal that is
   greater than or equal to the partition will be updated. In this case P4 will be updated even though `MaxUnavailable`
   is 3.
3. After P4 finish update, change `Partition` to 0. The controller will update P1,P2 and P3 concurrently.
   Note that with default StatefulSet, the Pods will be updated sequentially in the order of P3, P2, P1.
4. Once one of P1, P2 and P3 finishes update, P0 will be updated immediately.

## `In-Place` Pod Update Strategy

Advanced StatefulSet adds a `podUpdatePolicy` field in `spec.updateStrategy.rollingUpdate`
which controls recreate or in-place update for Pods.

- `ReCreate` controller will delete old Pods and create new ones. This is the same behavior as default StatefulSet.
- `InPlaceIfPossible` controller will try to in-place update Pod instead of recreating them if possible. Currently, only `spec.template.metadata.*` and `spec.template.spec.containers[x].image` field can be in-place updated.
- `InPlaceOnly` controller will in-place update Pod instead of recreating them. With `InPlaceOnly` policy, user cannot modify any fields in `spec.template` other than `spec.template.spec.containers[x].image`.

When a Pod being in-place update, controller will firstly update Pod status to make it become not-ready using readinessGate,
and then update images in Pod spec to trigger Kubelet recreate the container on Node.
However, sometimes Kubelet recreate containers so fast that other controllers such as endpoints-controller in kcm
have not noticed the Pod has turned to not-ready. This may lead to requests damaged.

So we bring **graceful period** into in-place update. Advanced StatefulSet has supported `gracePeriodSeconds`, which is a period
duration between controller update pod status and update pod images.
So that endpoints-controller could have enough time to remove this Pod from endpoints.

```yaml
apiVersion: apps.kruise.io/v1alpha1
kind: StatefulSet
spec:
  # ...
  podManagementPolicy: Parallel
  updateStrategy:
    type: RollingUpdate
    rollingUpdate:
      podUpdatePolicy: InPlaceIfPossible
      inPlaceUpdateStrategy:
        gracePeriodSeconds: 10
```

**More importantly**, a readiness-gate named `InPlaceUpdateReady` must be  added into `template.spec.readinessGates`
when using `InPlaceIfPossible` or `InPlaceOnly`. The condition `InPlaceUpdateReady` in podStatus will be updated to False before in-place
update and updated to True after the update is finished. This ensures that pod remain at NotReady state while the in-place
update is happening.

An example for StatefulSet using in-place update:

```yaml
apiVersion: apps.kruise.io/v1alpha1
kind: StatefulSet
metadata:
  name: sample
spec:
  replicas: 3
  serviceName: fake-service
  selector:
    matchLabels:
      app: sample
  template:
    metadata:
      labels:
        app: sample
    spec:
      readinessGates:
         # A new condition that ensures the pod remains at NotReady state while the in-place update is happening
      - conditionType: InPlaceUpdateReady
      containers:
      - name: main
        image: nginx:alpine
  podManagementPolicy: Parallel # allow parallel updates, works together with maxUnavailable
  updateStrategy:
    type: RollingUpdate
    rollingUpdate:
      # Do in-place update if possible, currently only image update is supported for in-place update
      podUpdatePolicy: InPlaceIfPossible
      # Allow parallel updates with max number of unavailable instances equals to 2
      maxUnavailable: 2
```

## Update sequence

Advanced StatefulSet adds a `unorderedUpdate` field in `spec.updateStrategy.rollingUpdate`, which contains strategies for non-ordered update.
If `unorderedUpdate` is not nil, pods will be updated with non-ordered sequence. Noted that UnorderedUpdate can only be allowed to work with Parallel podManagementPolicy.

Currently `unorderedUpdate` only contains one field: `priorityStrategy`.

### `priority` strategy

This strategy defines rules for calculating the priority of updating pods.
All update candidates will be applied with the priority terms.
`priority` can be calculated either by weight or by order.

- `weight`: Priority is determined by the sum of weights for terms that match selector. For example,

```yaml
apiVersion: apps.kruise.io/v1alpha1
kind: StatefulSet
spec:
  # ...
  updateStrategy:
    rollingUpdate:
      unorderedUpdate:
        priorityStrategy:
          weightPriority:
          - weight: 50
            matchSelector:
              matchLabels:
                test-key: foo
          - weight: 30
            matchSelector:
              matchLabels:
                test-key: bar
```

- `order`: Priority will be determined by the value of the orderKey. The update candidates are sorted based on the "int" part of the value string. For example, 5 in string "5" and 10 in string "sts-10".

```yaml
apiVersion: apps.kruise.io/v1alpha1
kind: StatefulSet
spec:
  # ...
  updateStrategy:
    rollingUpdate:
      unorderedUpdate:
        priorityStrategy:
          orderPriority:
            - orderedKey: some-label-key
```

## Paused update

`paused` indicates that Pods updating is paused, controller will not update Pods but just maintain the number of replicas.

```yaml
apiVersion: apps.kruise.io/v1alpha1
kind: StatefulSet
spec:
  # ...
  updateStrategy:
    rollingUpdate:
      paused: true
```
