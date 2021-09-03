---
title: WorkloadSpread
---
# WorkloadSpread

**FEATURE STATE:** Kruise v0.10.0

WorkloadSpread can distribute Pods of workload to different types of Node according to some rules, which empowers single workload the abilities for
multi-domain deployment and elastic deployment.

Some common rules include:
- Horizontal spread (for example, average spread in dimensions such as host, az, etc.)
- Spread according to the specified ratio (for example, deploy Pod to several specified az according to the proportion)
- Different subset management with priority, such as
  - deploy Pods to ecs first, and deploy to eci when its resources are insufficient.
  - deploy a fixed number of Pods to ecs first, and the rest Pods are deployed to eci.

The feature of WorkloadSpread is similar with UnitedDeployment in OpenKruise community. Each WorkloadSpread defines multi-domain
called `subset`. Each domain should at least provide the capacity to run the replicas number of pods called `maxReplicas`.
WorkloadSpread injects the domain configuration into the Pod by Webhook, and it also controls the order of scale in and scale out.

Currently, supported workload: `CloneSet`、`Deployment`、`ReplicaSet`.

## WorkloadSpread Demo

```yaml
apiVersion: apps.kruise.io/v1alpha1
kind: WorkloadSpread
metadata:
  name: workloadspread-demo
spec:
  targetRef:
    apiVersion: apps/v1 | apps.kruise.io/v1alpha1
    kind: Deployment | CloneSet
    name: workload-xxx
  subsets:
    - name: subset-a
      requiredNodeSelectorTerm:
        matchExpressions:
          - key: topology.kubernetes.io/zone
            operator: In
            values:
              - zone-a
    preferredNodeSelectorTerms:
      - weight: 1
        preference:
        matchExpressions:
          - key: another-node-label-key
            operator: In
            values:
              - another-node-label-value
      maxReplicas: 3
      tolertions: []
      patch:
        metadata:
          labels:
            xxx-specific-label: xxx
    - name: subset-b
      requiredNodeSelectorTerm:
        matchExpressions:
          - key: topology.kubernetes.io/zone
            operator: In
            values:
              - zone-b
  scheduleStrategy:
    type: Adaptive | Fixed
    adaptive:
      rescheduleCriticalSeconds: 30
```

`targetRef`: specify the target workload. Can not be mutated，and one workload can only correspond to one WorkloadSpread.

## spec.subsets

`subsets` consists of multiple domain called `subset`, and each topology has different configuration.

### subset sub-fields

- `name`: the name of `subset`, it is distinct in a WorkloadSpread, which represents a topology.

- `maxReplicas`：the capacity of `subset`, and must be Integer and >= 0. There is no replicas limit while the `maxReplicas` is nil.
> Don't support percentage type in current version.

- `requiredNodeSelectorTerm`: match zone hardly。

- `preferredNodeSelectorTerms`: match zone softly。

**Caution**：`requiredNodeSelectorTerm` corresponds the `requiredDuringSchedulingIgnoredDuringExecution` of nodeAffinity.
`preferredNodeSelectorTerms` corresponds the `preferredDuringSchedulingIgnoredDuringExecution` of nodeAffinity.

- `tolerations`: the tolerations of Pod in `subset`.
```yaml
tolerations:
- key: "key1"
  operator: "Equal"
  value: "value1"
  effect: "NoSchedule"
```

- `patch`: customize the Pod configuration of `subset`, such as Annotations, Labels, Env. 

Example:

```yaml
# patch pod with a topology label:
patch:
  metadata:
    labels:
      topology.application.deploy/zone: "zone-a"
```

```yaml
# patch pod container resources:
patch:
  spec:
    containers:
    - name: main
      resources:
        limit:
          cpu: "2"
          memory: 800Mi
```

```yaml
# patch pod container env with a zone name:
patch:
  spec:
    containers:
    - name: main
      env:
      - name: K8S_AZ_NAME
        value: zone-a
```

## Schedule strategy

WorkloadSpread provides two kind strategies, the default strategy is `Fixed`.

### Fixed: 

Workload is strictly spread according to the definition of the subset. 
  
### Adaptive

**Reschedule**: Kruise will check the Pods of `subset` were scheduled failed. If it exceeds the defined duration, the failed Pods will be rescheduled to other `subset`.

## Required

### Pod Webhook
WorkloadSpread uses `webhook` to inject fault domain rules.

If the `PodWebhook` feature-gate is set to false, WorkloadSpread will also be disabled.

### deletion-cost feature
`CloneSet` has supported deletion-cost feature in the latest versions.

The other native workload need kubernetes version >= 1.21. (In 1.21, users need to enable PodDeletionCost feature-gate, and since 1.22 it will be enabled by default)

## Scale order:

The workload managed by WorkloadSpread will scale according to the defined order in `spec.subsets`.

**The order of `subset` in `spec.subsets` can be changed**, which can adjust the scale order of workload.

### Scale out

- The Pods are scheduled in the subset order defined in the `spec.subsets`. It will be scheduled in the next `subset` while the replica number reaches the maxReplicas of `subset` 
  
### Scale in

- When the replica number of the `subset` is greater than the `maxReplicas`, the extra Pods will be removed in a high priority.
- According to the `subset` order in the `spec.subsets`, the Pods of the `subset` at the back are deleted before the Pods at the front.

```yaml
#             subset-a   subset-b  subset-c
# maxReplicas    10          10        nil
# pods number    10          10        10
# deletion order: c -> b -> a

#             subset-a   subset-b  subset-c
# maxReplicas    10          10        nil
# pods number    20          20        20
# deletion order: b -> a -> c
```

## feature-gates
WorkloadSpread feature is turned off by default, if you want to turn it on set feature-gates *WorkloadSpread*.

```bash
$ helm install kruise https://... --set featureGates="WorkloadSpread=true"
```

## Example

### Elastic deployment

`zone-a`(ACK) holds 100 Pods, `zone-b`(ECI) as an elastic zone holds additional Pods.

1. Create a WorkloadSpread instance.
```yaml
apiVersion: apps.kruise.io/v1alpha1
kind: WorkloadSpread
metadta:
  name: ws-demo
  namespace: deploy
spec:
  targetRef: # workload in the same namespace
    apiVersion: apps.kruise.io/v1alpha1
    kind: CloneSet
    name: workload-xxx
  subsets:
  - name: ACK # zone ACK
    requiredNodeSelectorTerm:
      matchExpressions:
      - key: topology.kubernetes.io/zone
        operator: In
        values:
        - ack
    maxReplicas: 100
    patch: # inject label.
      metadata:
        labels:
          deploy/zone: ack
  - name: ECI # zone ECI
    requiredNodeSelectorTerm:
      matchExpressions:
      - key: topology.kubernetes.io/zone
        operator: In
        values:
        - eci
    patch:
      metadata:
        labels:
          deploy/zone: eci
```
2. Creat a corresponding workload, the number of replicas ca be adjusted freely.

#### Effect

- When the number of `replicas` <= 100, the Pods are scheduled in `ACK` zone.
- When the number of `replicas` > 100, the 100 Pods are in `ACK` zone, the extra Pods are scheduled in `ECI` zone.
- The Pods in `ECI` elastic zone are removed first when scaling in.

### Multi-domain deployment

Deploy 100 Pods to two `zone`(zone-a, zone-b) separately.

1. Create a WorkloadSpread instance.
```yaml
apiVersion: apps.kruise.io/v1alpha1
kind: WorkloadSpread
metadta:
  name: ws-demo
  namespace: deploy
spec:
  targetRef:
    apiVersion: apps.kruise.io/v1alpha1
    kind: CloneSet
    name: workload-xxx
  subsets:
  - name: subset-a
    requiredNodeSelectorTerm:
      matchExpressions:
      - key: topology.kubernetes.io/zone
        operator: In
        values:
        - zone-a
    maxReplicas: 100
    patch:
      metadata:
        labels:
          deploy/zone: zone-a
  - name: subset-b
    requiredNodeSelectorTerm:
      matchExpressions:
      - key: topology.kubernetes.io/zone
        operator: In
        values:
        - zone-b
    maxReplicas: 100
    patch:
      metadata:
        labels:
          deploy/zone: zone-b
```

2. Creat a corresponding workload with a 200 replicas, or perform a rolling update on an existing workload.

3. If the spread of zone needs to be changed, first adjust the `maxReplicas` of `subset`, and then change the `replicas` of workload.
