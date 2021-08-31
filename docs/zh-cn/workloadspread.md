---
title: WorkloadSpread
---
# WorkloadSpread

WorkloadSpread可以用来约束无状态Workload的区域分布，赋予单一workload的多域部署和弹性部署的能力。

WorkloadSpread与Kruise社区的UnitedDeployment功能相似，每一个WorkloadSpread定义多个区域（定义为`subset`），
`subset`对应一个`maxReplicas`数量。WorkloadSpread利用Webhook注入`subset`定义的域信息，且控制Pod的扩缩容顺序。

目前支持的Workload类型：`CloneSet`、`Deployment`、`ReplicaSet`。

API定义：https://github.com/openkruise/kruise/blob/819125ddbd4fb4ffb5f3b1ecf03490349a8f6727/apis/apps/v1alpha1/workloadspread_types.go

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
**注意**：`targetRef`不可以变更，且一个Workload只能对应一个WorkloadSpread。

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

`MaxReplicas`：当前版本暂不支持百分比；若设置为空，代表不限制subset的副本数。

`Patch`: 自定义`subset`的Pod配置，可以是Annotations、Labels、Env等。

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

## 模拟调度和Reschedule

WorkloadSpread提供了两种调度策略，默认为`Fixed`:

### Fixed: 

Workload严格按照`subset`定义分布。
  
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
  
**模拟调度**： Kruise会对`subset`的Node资源做简单过滤，若资源不足会调度到下一个`subset`。
  
**Reschedule**：Kruise检查`subset`调度失败的Pod，若超过用户定义的时间就调度到其他`subset`。

## 环境要求

### Pod Webhook
WorkloadSpread利用`webhook`向Pod注入域规则并且关心Pod的驱逐和删除事件。

如果`PodWebhook` feature-gate被设置为`false`，WorkloadSpread也将不可用。

### deletion-cost feature
CloneSet已经支持该特性。

其他native workload需kubernetes version >= 1.21。1.21版本需要开启 `PodDeletionCost` feature-gate。自1.22起默认开启。

## 扩缩容顺序：
### 扩容
- 按照`spec.subsets`中`subset`定义的顺序调度Pod，当前`subset`的Pod数量达到`maxReplicas`时再调度到下一个`subset`。
  
### 缩容
- 当`subset`的副本数大于定义的maxReplicas时，优先缩容多余的Pod。
- 按照`spec.subsets`中`subset`定义的顺序，后面的`subset`的Pod先于前面的被删除。

## 例子

### 弹性部署

zone-a（ack）固定100个Pod，zone-b（eci）做弹性区域

1. 创建WorkloadSpread实例
```yaml
apiVersion: apps.kruise.io/v1alpha1
kind: WorkloadSpread
metadta:
  name: ws-demo
  namespace: deploy
spec:
  targetRef: # 相同namespace下的workload
    apiVersion: apps.kruise.io/v1alpha1
    kind: CloneSet
    name: workload-xxx
  subsets:
  - name: ack # zone ack，最多100个副本。
    requiredNodeSelectorTerm:
      matchExpressions:
      - key: topology.kubernetes.io/zone
        operator: In
        values:
        - ack
    maxReplicas: 100
    patch: # 注入label
      metadata:
        labels:
          deploy/zone: ack
  - name: eci # 弹性区域eci，副本数量不限。
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
2. 创建workload，副本数可以自由调整。

#### 部署效果
- 当replicas <= 100 时，Pod被调度到ack上。
- 当replicas > 100 时，100个在ack，多余的Pod在弹性域eci。
- 缩容时优先从弹性域eci上缩容。

### 多域部署

分别部署100个副本的Pod到两个机房（zone-a, zone-b）

1. 创建WorkloadSpread实例
```yaml
apiVersion: apps.kruise.io/v1alpha1
kind: WorkloadSpread
metadta:
  name: ws-demo
  namespace: deploy
spec:
  targetRef: # 相同namespace下的workload
    apiVersion: apps.kruise.io/v1alpha1
    kind: CloneSet
    name: workload-xxx
  subsets:
  - name: subset-a # 区域A，100个副本。
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
  - name: subset-b # 区域B，100个副本。
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

2. 创建200副本的workload，或者对已有的workload执行滚动更新。

3. 如zone副本分布需要变动，先调整对应`subset`的`maxReplicas`，再调整workload副本数。
