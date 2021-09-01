---
title: WorkloadSpread
---
# WorkloadSpread

WorkloadSpread can be used to constrain the spread of stateless workload, which empower single workload the abilities for
multi-domain deploy and elastic deploy.

The feature of WorkloadSpread is similar with UnitedDeployment in Kruise community. Each WorkloadSpread defines multi-domain
called `subset`. Each domain should at least provide the capacity to run the replicas number of pods called `maxReplicas`.
WorkloadSpread injects the domain config into the Pod by Webhook, and it also controls the order of scale in and scale out.

Currently, supported workload: `CloneSet`、`Deployment`、`ReplicaSet`.

API definition：https://github.com/openkruise/kruise/blob/819125ddbd4fb4ffb5f3b1ecf03490349a8f6727/apis/apps/v1alpha1/workloadspread_types.go

## WorkloadSpread Spec

```yaml
// WorkloadSpreadSpec defines the desired state of WorkloadSpread.
type WorkloadSpreadSpec struct {
	// TargetReference is the target workload that WorkloadSpread want to control.
	TargetReference *TargetReference `json:"targetRef"`

	// Subsets describes the pods distribution details between each of subsets.
	Subsets []WorkloadSpreadSubset `json:"subsets"`

	// ScheduleStrategy indicates the strategy the WorkloadSpread used to preform the schedule between each of subsets.
	// +optional
	ScheduleStrategy WorkloadSpreadScheduleStrategy `json:"scheduleStrategy,omitempty"`
}
```
**Caution**：`targetRef`can not be mutated，and one workload can only correspond to one WorkloadSpread.

### Subset

```yaml
// WorkloadSpreadSubset defines the details of a subset.
type WorkloadSpreadSubset struct {
	// Name should be unique between all of the subsets under one WorkloadSpread.
	Name string `json:"name"`

	// Indicates the node required selector to form the subset.
	// +optional
	RequiredNodeSelectorTerm *corev1.NodeSelectorTerm `json:"requiredNodeSelectorTerm,omitempty"`

	// Indicates the node preferred selector to form the subset.
	// +optional
	PreferredNodeSelectorTerms []corev1.PreferredSchedulingTerm `json:"preferredNodeSelectorTerms,omitempty"`

	// Indicates the tolerations the pods under this subset have.
	// +optional
	Tolerations []corev1.Toleration `json:"tolerations,omitempty"`

	// MaxReplicas indicates the desired max replicas of this subset.
	// +optional
	MaxReplicas *intstr.IntOrString `json:"maxReplicas,omitempty"`

	// Patch indicates patching podTemplate to the Pod.
	// +optional
	Patch runtime.RawExtension `json:"patch,omitempty"`
}
```

`MaxReplicas`: the format of percentage is not supported in current version; It can be nil, which means there is no replicas limits in this subset.

`Patch`: the customized config of Pod in subset, such as Annotations、Labels、Env.

```yaml
# patch metadata:
patch:
  metadata:
    labels:
      xxx-specific-label: xxx
```

```yaml
# patch container resources:
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
# patch container environments:
patch:
  spec:
    containers:
    - name: main
      env:
      - name: K8S_CONTAINER_NAME
        value: main
```

## SimulateSchedule & Reschedule

WorkloadSpread provides two kind strategies, the default strategy is 'Fixed'.

### Fixed: 

Workload is strictly spread according to the definition of the subset. 
  
### Adaptive

```yaml
// AdaptiveWorkloadSpreadStrategy is used to communicate parameters when Type is AdaptiveWorkloadSpreadScheduleStrategyType.
type AdaptiveWorkloadSpreadStrategy struct {
	// DisableSimulationSchedule indicates whether to disable the feature of simulation schedule.
	// Default is false.
	// Webhook can take a simple general predicates to check whether Pod can be scheduled into this subset,
	// but it just considers the Node resource and cannot replace scheduler to do richer predicates practically.
	// +optional
	DisableSimulationSchedule bool `json:"disableSimulationSchedule,omitempty"`

	// RescheduleCriticalSeconds indicates how long controller will reschedule a schedule failed Pod to the subset that has
	// redundant capacity after the subset where the Pod lives. If a Pod was scheduled failed and still in a unschedulabe status
	// over RescheduleCriticalSeconds duration, the controller will reschedule it to a suitable subset.
	// +optional
	RescheduleCriticalSeconds *int32 `json:"rescheduleCriticalSeconds,omitempty"`
}
```

**SimulateSchedule**: Kruise will simply filter the Node resources of the `subset`. If the resources are insufficient, it will be scheduled to the next Subset.

**Reschedule** Kruise will check the Pods of `subset` were scheduled failed. If it exceeds the defined duration, the failed Pods will be rescheduled to other `subset`.

## Required

### Pod Webhook
WorkloadSpread uses `webhook` to inject fault domain rules and cares about delete and eviction event of Pod.

If the `PodWebhook` feature-gate is set to false, WorkloadSpread will also be disabled.

### deletion-cost feature
CloneSet has supported deletion-cost feature in the latest versions.

The other native workload need kubernetes version >= 1.21. (In 1.21, users need to enable PodDeletionCost feature-gate, and since 1.22 it will be enabled by default)

## Scale order:

### Scale out
- The Pods are scheduled in the subset order defined in the `spec.subsets`. It will be scheduled in the next `subset` while the replica number reaches the maxReplicas of `subset` 
  
### Scale in

- When the replica number of the `subset` is greater than the `maxReplicas`, the extra Pods will be removed in a high priority.
- According to the `subset` order in the `spec.subsets`, the Pods of the `subset` at the back are deleted before the Pods at the front `subset`.

## Example

### Elastic deploy

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

### Multi-domain deploy

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
          deploy/zone: zonb-a
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
