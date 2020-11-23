---
title: CloneSet
---
# CloneSet

This controller provides advanced features to efficiently manage stateless applications that
do not have instance order requirement during scaling and rollout. Analogously,
CloneSet can be recognized as an enhanced version of upstream `Deployment` workload, but it does many more.

As name suggests, CloneSet is a [**Set** -suffix controller](../blog/blog1.html) which
manages Pods directly. A sample CloneSet yaml looks like following:

```yaml
apiVersion: apps.kruise.io/v1alpha1
kind: CloneSet
metadata:
  labels:
    app: sample
  name: sample
spec:
  replicas: 5
  selector:
    matchLabels:
      app: sample
  template:
    metadata:
      labels:
        app: sample
    spec:
      containers:
      - name: nginx
        image: nginx:alpine
```

## Scale features

### Support PVCs

CloneSet allows user to define PVC templates `volumeClaimTemplates` in `CloneSetSpec`, which can support PVCs per Pod.
This cannot be done with `Deployment`. If not specified, CloneSet will only create Pods without PVCs.

A few reminders:

- Each PVC created by CloneSet has an owner reference. So when a CloneSet has been deleted, its PVCs will be cascading deleted.
- Each Pod and PVC created by CloneSet has a "apps.kruise.io/cloneset-instance-id" label key. They use the same string as label value which is composed of a unique  **instance-id** as suffix of the CloneSet name.
- When a Pod has been deleted by CloneSet controller, all PVCs related to it will be deleted together.
- When a Pod has been deleted manually, all PVCs related to the Pod are preserved, and CloneSet controller will create a new Pod with the same **instance-id** and reuse the PVCs.
- When a Pod is updated using **recreate** policy, all PVCs related to it will be deleted together.
- When a Pod is updated using **in-place** policy, all PVCs related to it are preserved.

The following shows a sample CloneSet yaml file which contains PVC templates.

```yaml
apiVersion: apps.kruise.io/v1alpha1
kind: CloneSet
metadata:
  labels:
    app: sample
  name: sample-data
spec:
  replicas: 5
  selector:
    matchLabels:
      app: sample
  template:
    metadata:
      labels:
        app: sample
    spec:
      containers:
      - name: nginx
        image: nginx:alpine
        volumeMounts:
        - name: data-vol
          mountPath: /usr/share/nginx/html
  volumeClaimTemplates:
    - metadata:
        name: data-vol
      spec:
        accessModes: [ "ReadWriteOnce" ]
        resources:
          requests:
            storage: 20Gi
```

### Selective Pod deletion

When a CloneSet is scaled down, sometimes user has preference to deleting specific Pods.
This cannot be done using `StatefulSet` or `Deployment`, because `StatefulSet` always delete Pod
in order and `Deployment`/`ReplicaSet` only delete Pod by its own sorted sequence.

CloneSet allows user to specify to-be-deleted Pod names when scaling down `replicas`. Take the following
sample as an example,

```yaml
apiVersion: apps.kruise.io/v1alpha1
kind: CloneSet
spec:
  # ...
  replicas: 4
  scaleStrategy:
    podsToDelete:
    - sample-9m4hp
```

when controller receives above update request, it ensures the number of replicas to be 4. If some Pods needs to be
deleted, the Pods listed in `podsToDelete` will be deleted first.
Controller will clear `podsToDelete` automatically once the listed Pods are deleted. Note that:

- If one just adds a Pod name to `podsToDelete` and do not modify `replicas`, controller will delete this Pod, and create a new Pod.
- Without specifying `podsToDelete`, controller will scale down by deleting Pods in the order: not-ready < ready, unscheduled < scheduled, and pending < running.

## Update features

### In-place update

CloneSet provides three update policies just like `AdvancedStatefulSet`, defaults to `ReCreate`.

- `ReCreate`: controller will delete old Pods and PVCs and create new ones.
- `InPlaceIfPossible`: controller will try to in-place update Pod instead of recreating them if possible. Currently, only `spec.template.metadata.*` and `spec.template.spec.containers[x].image` field can be in-place updated.
- `InPlaceOnly`: controller will in-place update Pod instead of recreating them. With `InPlaceOnly` policy, user cannot modify any fields in `spec.template` other than `spec.template.spec.containers[x].image`.

When a Pod being in-place update, controller will firstly update Pod status to make it become not-ready using readinessGate,
and then update images in Pod spec to trigger Kubelet recreate the container on Node.
However, sometimes Kubelet recreate containers so fast that other controllers such as endpoints-controller in kcm
have not noticed the Pod has turned to not-ready. This may lead to requests damaged.

So we bring **graceful period** into in-place update. CloneSet has supported `gracePeriodSeconds`, which is a period
duration between controller update pod status and update pod images.
So that endpoints-controller could have enough time to remove this Pod from endpoints.

```yaml
apiVersion: apps.kruise.io/v1alpha1
kind: CloneSet
spec:
  # ...
  updateStrategy:
    type: InPlaceIfPossible
    inPlaceUpdateStrategy:
      gracePeriodSeconds: 10
```

### Template and revision

`spec.template` defines the latest pod template in the CloneSet.
Controller will calculate a revision hash for each version of `spec.template` when it has been initialized or modified.
For example, when we create a sample CloneSet, controller will calculate the revision hash `sample-744d4796cc` and
present the hash in CloneSet Status.

```yaml
apiVersion: apps.kruise.io/v1alpha1
kind: CloneSet
metadata:
  generation: 1
  # ...
spec:
  replicas: 5
  # ...
status:
  observedGeneration: 1
  readyReplicas: 5
  replicas: 5
  updateRevision: sample-d4d4fb5bd
  updatedReadyReplicas: 5
  updatedReplicas: 5
  # ...
```

Here are the explanations for the counters presented in CloneSet status:

- `status.replicas`: Number of pods
- `status.readyReplicas`: Number of **ready** pods
- `status.availableReplicas`: Number of **ready and available** pods (satisfied with `minReadySeconds`)
- `status.updateRevision`: Latest revision hash of this CloneSet
- `status.updatedReplicas`: Number of pods with the latest revision
- `status.updatedReadyReplicas`: Number of **ready** pods with the latest revision

### Partition

Partition is the **desired number of Pods in old revisions**, defaults to `0`.
When `partition` is set during update, `(replicas - partition)` number of pods will be updated with the new version. This field does **NOT** imply any update order.

For example, when we update sample CloneSet's container image to `nginx:mainline` and set `partition=3`, after a while, the sample CloneSet yaml looks like the following:

```yaml
apiVersion: apps.kruise.io/v1alpha1
kind: CloneSet
metadata:
  # ...
  generation: 2
spec:
  replicas: 5
  template:
    metadata:
      labels:
        app: sample
    spec:
      containers:
      - image: nginx:mainline
        imagePullPolicy: Always
        name: nginx
  updateStrategy:
    partition: 3
  # ...
status:
  observedGeneration: 2
  readyReplicas: 5
  replicas: 5
  updateRevision: sample-56dfb978d4
  updatedReadyReplicas: 2
  updatedReplicas: 2
```

Note that `status.updateRevision` has been updated to `sample-56dfb978d4`, a new hash.
Since we set `partition=3`, controller only updates two Pods to the latest revision.

```bash
$ kubectl get pod -L controller-revision-hash
NAME           READY   STATUS    RESTARTS   AGE     CONTROLLER-REVISION-HASH
sample-chvnr   1/1     Running   0          6m46s   sample-d4d4fb5bd
sample-j6c4s   1/1     Running   0          6m46s   sample-d4d4fb5bd
sample-ns85c   1/1     Running   0          6m46s   sample-d4d4fb5bd
sample-jnjdp   1/1     Running   0          10s     sample-56dfb978d4
sample-qqglp   1/1     Running   0          18s     sample-56dfb978d4
```

### MaxUnavailable

MaxUnavailable is the maximum number of Pods that can be unavailable during the update.
Value can be an absolute number (e.g., 5) or a percentage of desired number of Pods (e.g., 10%).
Default value is 20%.

```yaml
apiVersion: apps.kruise.io/v1alpha1
kind: CloneSet
spec:
  # ...
  updateStrategy:
    maxUnavailable: 20%
```

### MaxSurge

MaxSurge is the maximum number of pods that can be scheduled above the desired replicas during the update.
Value can be an absolute number (ex: 5) or a percentage of desired pods (ex: 10%).
Defaults to 0.

If maxSurge is set somewhere, cloneset-controller will create `maxSurge` number of Pods above the `replicas`,
when it finds multiple active revisions of Pods which means the CloneSet is in the update stage.
After all Pods except `partition` number have been updated to the latest revision, `maxSurge` number Pods will be deleted,
and the number of Pods will be equal to the `replica` number.

What's more, maxSurge is forbidden to use with `InPlaceOnly` policy.
When maxSurge is used with `InPlaceIfPossible`, controller will create additional Pods with latest revision first,
and then update the rest Pods with old revisions,

```yaml
apiVersion: apps.kruise.io/v1alpha1
kind: CloneSet
spec:
  # ...
  updateStrategy:
    maxSurge: 3
```

### Update sequence

When controller chooses Pods to update, it has default sort logic based on Pod phase and conditions:
**unscheduled < scheduled, pending < unknown < running, not-ready < ready**.
In addition, CloneSet also supports advanced `priority` and `scatter` strategies to allow users to specify the update order.

#### `priority` strategy

This strategy defines rules for calculating the priority of updating pods.
All update candidates will be applied with the priority terms.
`priority` can be calculated either by weight or by order.

- `weight`: Priority is determined by the sum of weights for terms that match selector. For example,

```yaml
apiVersion: apps.kruise.io/v1alpha1
kind: CloneSet
spec:
  # ...
  updateStrategy:
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
kind: CloneSet
spec:
  # ...
  updateStrategy:
    priorityStrategy:
      orderPriority:
        - orderedKey: some-label-key
```

#### `scatter` strategy

This strategy defines rules to make certain Pods be scattered during update.
For example, if a CloneSet has `replica=10`, and we add `foo=bar` label in 3 Pods and specify the following scatter rule. These 3 Pods will
be the 1st, 6th and 10th updated Pods.

```yaml
apiVersion: apps.kruise.io/v1alpha1
kind: CloneSet
spec:
  # ...
  updateStrategy:
    scatterStrategy:
    - key: foo
      value: bar
```

Note that:

- Although `priority` strategy and `scatter` strategy can be applied together, we strongly suggest to just use one of them to avoid confusion.
- If `scatter` strategy is used, we suggest to just use one term. Otherwise, the update order can be hard to understand.

Last but not the least, the above advanced update strategies require independent Pod labeling mechanisms, which are not provided by CloneSet.

### Paused update

`paused` indicates that Pods updating is paused, controller will not update Pods but just maintain the number of replicas.

```yaml
apiVersion: apps.kruise.io/v1alpha1
kind: CloneSet
spec:
  # ...
  updateStrategy:
    paused: true
```

### Lifecycle hook

Since v0.6.1, kruise has supported lifecycle hook for CloneSet.

Each Pod managed by CloneSet has a clear state defined in `lifecycle.apps.kruise.io/state` label:

- Normal
- PreparingUpdate
- Updating
- Updated
- PreparingDelete

Lifecycle hook allows users to do something (for example remove pod from service endpoints) during Pod deleting and before/after in-place update.

```golang
type LifecycleStateType string

// Lifecycle contains the hooks for Pod lifecycle.
type Lifecycle struct {
    // PreDelete is the hook before Pod to be deleted.
    PreDelete *LifecycleHook `json:"preDelete,omitempty"`
    // InPlaceUpdate is the hook before Pod to update and after Pod has been updated.
    InPlaceUpdate *LifecycleHook `json:"inPlaceUpdate,omitempty"`
}

type LifecycleHook struct {
    LabelsHandler     map[string]string `json:"labelsHandler,omitempty"`
    FinalizersHandler []string          `json:"finalizersHandler,omitempty"`
}
```

Examples:

```yaml
apiVersion: apps.kruise.io/v1alpha1
kind: CloneSet
spec:

  # define with finalizer
  lifecycle:
    preDelete:
      finalizersHandler:
      - example.io/unready-blocker
    inPlaceUpdate:
      finalizersHandler:
      - example.io/unready-blocker

  # or define with label
  lifecycle:
    inPlaceUpdate:
      labelsHandler:
        example.io/block-unready: "true"
```

#### State circulation

![Lifecycle circulation](/img/docs/cloneset-lifecycle.png)

- When CloneSet delete a Pod (including scale in and recreate update):
  - Delete it directly if no lifecycle hook definition or Pod not matched preDelete hook
  - Otherwise, CloneSet will firstly update Pod to `PreparingDelete` state and wait for user controller to remove the label/finalizer and Pod not matched preDelete hook
  - Note that Pods in `PreparingDelete` state will not be updated
- When CloneSet update a Pod in-place:
  - If lifecycle hook defined and Pod matched inPlaceUpdate hook, CloneSet will update Pod to `PreparingUpdate` state
  - After user controller remove the label/finalizer (thus Pod not matched inPlaceUpdate hook), CloneSet will update it to `Updating` state and start updating
  - After in-place update completed, CloneSet will update Pod to `Updated` state if lifecycle hook defined and Pod not matched inPlaceUpdate hook
  - When user controller add label/finalizer into Pod and it matched inPlaceUpdate hook, CloneSet will finally update it to `Normal` state

Besides, although our design supports to change a Pod from `PreparingDelete` back to `Normal` (through cancel specified delete), but it is not recommended. Because Pods in `PreparingDelete` state will not be updated by CloneSet, it might be updating immediately if comes back to `Normal`. This case is hard for user controller to handle.

#### Another way for specified delete

As we introduced above, CloneSet has `spec.scaleStrategy.podsToDelete` field and allow users to specify some Pods when reduce replicas.

But if user just want to delete a Pod and let CloneSet create a new one, we provides another Pod label for specified delete: `apps.kruise.io/specified-delete: true`.
Pods with this label, CloneSet will update it to `PreparingDelete` state, and delete it after hook has been satisfied.

#### Example for user controller logic

Same as yaml example above, we can fisrtly define：

- `example.io/unready-blocker` finalizer as hook
- `example.io/initialing` annotation as identity for initializing

Add these fields into CloneSet template:

```yaml
apiVersion: apps.kruise.io/v1alpha1
kind: CloneSet
spec:
  template:
    metadata:
      annotations:
        example.io/initialing: "true"
      finalizer:
      - example.io/unready-blocker
  # ...
  lifecycle:
    preDelete:
      finalizersHandler:
      - example.io/unready-blocker
    inPlaceUpdate:
      finalizersHandler:
      - example.io/unready-blocker
```

User controller logic:

- For Pod in `Normal` state, if there is `example.io/initialing: true` in annotation and ready condition in Pod status is True, then add it to endpoints and remove the annotation
- For Pod in `PreparingDelete` and `PreparingUpdate` states, delete it from endpoints and remove `example.io/unready-blocker` finalizer
- For Pod in `Updated` state, add it to endpoints and add `example.io/unready-blocker` finalizer
