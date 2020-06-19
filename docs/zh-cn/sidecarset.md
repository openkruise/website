# SidecarSet

这个控制器支持通过 admission webhook 来自动为集群中创建的符合条件的 Pod 注入 sidecar 容器。
这个注入过程和 [istio](https://istio.io/docs/setup/kubernetes/additional-setup/sidecar-injection/)
的自动注入方式很类似。
除了在 Pod 创建时候注入外，SidecarSet 还提供了为运行时 Pod 原地升级其中已经注入的 sidecar 容器镜像的能力。

简单来说，SidecarSet 将 sidecar 容器的定义和生命周期与业务容器解耦。
它主要用于管理无状态的 sidecar 容器，比如监控、日志等 agent。

SidecarSet spec 定义如下：

```go
type SidecarSetSpec struct {
    // selector is a label query over pods that should be injected
    Selector *metav1.LabelSelector `json:"selector,omitempty"`

    // containers specifies the list of containers to be injected into the pod
    Containers []SidecarContainer `json:"containers,omitempty"`

    // List of volumes that can be mounted by sidecar containers
    Volumes []corev1.Volume `json:"volumes,omitempty"`

    // Paused indicates that the sidecarset is paused and will not be processed by the sidecarset controller.
    Paused bool `json:"paused,omitempty"`

    // The sidecarset strategy to use to replace existing pods with new ones.
    Strategy SidecarSetUpdateStrategy `json:"strategy,omitempty"`
}

type SidecarContainer struct {
    corev1.Container
}
```

注意，sidecar 的注入只会发生在 Pod 创建阶段，并且只有 Pod spec 会被更新，不会影响 Pod 所属的 workload template 模板。

## 范例

### 创建 SidecarSet

如下的 `sidecarset.yaml` 定义了一个 SidecarSet，其中包括了一个名为 `sidecar1` 的 sidecar 容器：

```yaml
# sidecarset.yaml
apiVersion: apps.kruise.io/v1alpha1
kind: SidecarSet
metadata:
  name: test-sidecarset
spec:
  selector:
    matchLabels:
      app: nginx
  strategy:
    rollingUpdate:
      maxUnavailable: 2
  containers:
  - name: sidecar1
    image: centos:6.7
    command: ["sleep", "999d"] # do nothing at all
    volumeMounts:
    - name: log-volume
      mountPath: /var/log
  volumes: # this field will be merged into pod.spec.volumes
  - name: log-volume
    emptyDir: {}
```

创建这个 YAML:

```shell
kubectl apply -f sidecarset.yaml
```

### 创建 Pod

定义一个匹配 SidecarSet selector 的 Pod：

```yaml
apiVersion: v1
kind: Pod
metadata:
  labels:
    app: nginx # matches the SidecarSet's selector
  name: test-pod
spec:
  containers:
  - name: app
    image: nginx:1.15.1
```

创建这个 Pod，你会发现其中被注入了 `sidecar1` 容器：

```shell
$ kubectl get pod
NAME       READY   STATUS    RESTARTS   AGE
test-pod   2/2     Running   0          118s
```

此时，SidecarSet status 被更新为：

```shell
$ kubectl get sidecarset test-sidecarset -o yaml | grep -A4 status
status:
  matchedPods: 1
  observedGeneration: 1
  readyPods: 1
  updatedPods: 1
```

### 更新 SidecarSet

使用 `kubectl edit sidecarset test-sidecarset` 来将 SidecarSet 中的 image 从 `centos:6.7` 更新为 `centos:6.8`，你会发现已经注入 Pod 中的 sidecar 镜像被原地升级。

如果用户更新了 `spec.containers` 中除 image 之外的字段，那么 SidecarSet 是做到无法原地升级的，只能等到 Pod 下一次被删除、重建的时候重新注入（比如用 Deployment/CloneSet 做重建升级）。
这种行为被 SidecarSet 称为 **懒升级** 模式。
