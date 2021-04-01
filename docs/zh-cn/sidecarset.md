---
title: SidecarSet
---
# SidecarSet

这个控制器支持通过 admission webhook 来自动为集群中创建的符合条件的 Pod 注入 sidecar 容器。
这个注入过程和 [istio](https://istio.io/docs/setup/kubernetes/additional-setup/sidecar-injection/)
的自动注入方式很类似。
除了在 Pod 创建时候注入外，SidecarSet 还提供了为运行时 Pod 原地升级其中已经注入的 sidecar 容器镜像的能力。

简单来说，SidecarSet 将 sidecar 容器的定义和生命周期与业务容器解耦。
它主要用于管理无状态的 sidecar 容器，比如监控、日志等 agent。

## 范例
### 创建 SidecarSet
如下的 sidecarset.yaml 定义了一个 SidecarSet，其中包括了一个名为 sidecar1 的 sidecar 容器：
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
  updateStrategy:
    type: RollingUpdate
    maxUnavailable: 1
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
```bash
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
创建这个 Pod，你会发现其中被注入了 sidecar1 容器：
```bash
$ kubectl get pod
NAME       READY   STATUS    RESTARTS   AGE
test-pod   2/2     Running   0          118s
```
此时，SidecarSet status 被更新为：
```bash
$ kubectl get sidecarset test-sidecarset -o yaml | grep -A4 status
status:
  matchedPods: 1
  observedGeneration: 1
  readyPods: 1
  updatedPods: 1
```
### 更新sidecar container Image
更新sidecarSet中sidecar container的image=centos:7
```bash
$ kubectl edit sidecarsets test-sidecarset

# sidecarset.yaml
apiVersion: apps.kruise.io/v1alpha1
kind: SidecarSet
metadata:
  name: test-sidecarset
spec:
  containers:
    - name: sidecar1
      image: centos:7
```
此时，发现pod中的sidecar容器已经被更新为了centos:7，并且pod以及其它的容器没有重启。
```bash
$ kubectl get pods |grep test-pod
test-pod                            2/2     Running   1          7m34s

$ kubectl get pods test-pod -o yaml |grep 'image: centos'
    image: centos:7

$ kubectl describe pods test-pod
Events:
  Type    Reason     Age                 From               Message
  ----    ------     ----                ----               -------
  Normal  Killing    5m47s               kubelet            Container sidecar1 definition changed, will be restarted
  Normal  Pulling    5m17s               kubelet            Pulling image "centos:7"
  Normal  Created    5m5s (x2 over 12m)  kubelet            Created container sidecar1
  Normal  Started    5m5s (x2 over 12m)  kubelet            Started container sidecar1
  Normal  Pulled     5m5s                kubelet            Successfully pulled image "centos:7"
```

## SidecarSet功能说明
一个简单的 SidecarSet yaml 文件如下：
```yaml
apiVersion: apps.kruise.io/v1alpha1
kind: SidecarSet
metadata:
  name: sidecarset
spec:
  selector:
    matchLabels:
      app: sample
  containers:
  - name: nginx
    image: nginx:alpine
  initContainers:
  - name: init-container
    image: busybox:latest
    command: [ "/bin/sh", "-c", "sleep 5 && echo 'init container success'" ]
  updateStrategy:
    type: RollingUpdate
  namespace: ns-1
```
- spec.selector 通过label的方式选择需要注入、更新的pod，支持matchLabels、MatchExpressions两种方式，详情请参考：https://kubernetes.io/docs/concepts/overview/working-with-objects/labels/
- spec.containers 定义需要注入、更新的pod.spec.containers容器，支持完整的k8s container字段，详情请参考：https://kubernetes.io/docs/concepts/containers/
- spec.initContainers 定义需要注入的pod.spec.initContainers容器，支持完整的k8s initContainer字段，详情请参考：https://kubernetes.io/docs/concepts/workloads/pods/init-containers/
    - 注入initContainers容器默认基于container name升级排序
    - initContainers只支持注入，不支持pod原地升级
- spec.updateStrategy sidecarSet更新策略，type表明升级方式：
    - NotUpdate 不更新，此模式下只会包含注入能力
    - RollingUpdate 注入+滚动更新，包含了丰富的滚动更新策略，后面会详细介绍
- spec.namespace sidecarset默认在k8s整个集群范围内生效，即对所有的命名空间生效（除了kube-system, kube-public），当设置该字段时，只对该namespace的pod生效

### sidecar container注入
sidecar 的注入只会发生在 Pod 创建阶段，并且只有 Pod spec 会被更新，不会影响 Pod 所属的 workload template 模板。
spec.containers除了默认的k8s container字段，还扩展了如下一些字段，来方便注入：
```yaml
apiVersion: apps.kruise.io/v1alpha1
kind: SidecarSet
metadata:
  name: sidecarset
spec:
  selector:
    matchLabels:
      app: sample
  containers:
    # default K8s Container fields
  - name: nginx
    image: nginx:alpine
    volumeMounts:
    - mountPath: /nginx/conf
      name: nginx.conf
    # extended sidecar container fields
    podInjectPolicy: BeforeAppContainer
    shareVolumePolicy:
      type: disabled | enabled
    transferEnv:
    - sourceContainerName: main
      envName: PROXY_IP    
  volumes:
  - Name: nginx.conf
    hostPath: /data/nginx/conf
```
- podInjectPolicy 定义container注入到pod.spec.containers中的位置
    - BeforeAppContainer(默认) 注入到pod原containers的前面
    - AfterAppContainer 注入到pod原containers的后面
- 数据卷共享
    - 共享指定卷：通过 spec.volumes 来定义 sidecar 自身需要的 volume，详情请参考：https://kubernetes.io/docs/concepts/storage/volumes/
    - 共享所有卷：通过 spec.containers[i].shareVolumePolicy.type = enabled | disabled 来控制是否挂载pod应用容器的卷，常用于日志收集等 sidecar，配置为 enabled 后会把应用容器中所有挂载点注入 sidecar 同一路经下(sidecar中本身就有声明的数据卷和挂载点除外）
- 环境变量共享
    - 可以通过 spec.containers[i].transferEnv 来从别的容器获取环境变量，会把名为 sourceContainerName 容器中名为 envName 的环境变量拷贝到本容器

### sidecar更新策略
SidecarSet不仅支持sidecar容器的原地升级，而且提供了非常丰富的升级、灰度策略。
#### 分批发布
Partition 的语义是 **保留旧版本 Pod 的数量或百分比**，默认为 `0`。这里的 `partition` 不表示任何 `order` 序号。

如果在发布过程中设置了 `partition`:

- 如果是数字，控制器会将 `(replicas - partition)` 数量的 Pod 更新到最新版本。
- 如果是百分比，控制器会将 `(replicas * (100% - partition))` 数量的 Pod 更新到最新版本。

```yaml
apiVersion: apps.kruise.io/v1alpha1
kind: SidecarSet
metadata:
  name: sidecarset
spec:
  # ...
  updateStrategy:
    type: RollingUpdate
    partition: 90
```
假设该SidecarSet关联的pod数量是100个，则本次升级只会升级10个，保留90个。

#### 最大不可用数量
MaxUnavailable 是发布过程中保证的，同一时间下最大不可用的 Pod 数量，默认值为 1。用户可以将其设置为绝对值或百分比（百分比会被控制器按照selected pod做基数来计算出一个背后的绝对值）。
```yaml
apiVersion: apps.kruise.io/v1alpha1
kind: SidecarSet
metadata:
  name: sidecarset
spec:
  # ...
  updateStrategy:
    type: RollingUpdate
    maxUnavailable: 20%
```
注意，maxUnavailable 和 partition 两个值是没有必然关联。举例：
- 当 {matched pod}=100,partition=50,maxUnavailable=10，控制器会发布 50 个 Pod 到新版本，但是发布窗口为 10，即同一时间只会发布 10 个 Pod，每发布好一个 Pod 才会再找一个发布，直到 50 个发布完成。
- 当 {matched pod}=100,partition=80,maxUnavailable=30，控制器会发布 20 个 Pod 到新版本，因为满足 maxUnavailable 数量，所以这 20 个 Pod 会同时发布。

#### 发布暂停
用户可以通过设置 paused 为 true 暂停发布，此时对于新创建的、扩容的pod依旧会实现注入能力，已经更新的pod会保持更新后的版本不动，还没有更新的pod会暂停更新。
```yaml
apiVersion: apps.kruise.io/v1alpha1
kind: SidecarSet
metadata:
  name: sidecarset
spec:
  # ...
  updateStrategy:
    type: RollingUpdate
    paused: true
```

#### 金丝雀发布
对于有金丝雀发布需求的业务，可以通过strategy.selector来实现。方式：对于需要率先金丝雀灰度的pod打上固定的labels[canary.release] = true，再通过strategy.selector.matchLabels来选中该pod
```yaml
apiVersion: apps.kruise.io/v1alpha1
kind: SidecarSet
metadata:
  name: sidecarset
spec:
  # ...
  updateStrategy:
    type: RollingUpdate
    selector:
      matchLabels:
      - canary.release: true
```

### 发布顺序控制
- 默认对升级的pod排序，保证多次升级的顺序一致
- 默认选择优先顺序是（越小优先级越高）： unscheduled < scheduled, pending < unknown < running, not-ready < ready, newer pods < older pods
- scatter打散排序

#### scatter打散顺序
打散策略允许用户定义将符合某些标签的 Pod 打散到整个发布过程中。比如，一个 SidecarSet所管理的pod为10，如果下面有 3 个 Pod 带有 foo=bar 标签，且用户在打散策略中设置了这个标签，那么这 3 个 Pod 会被放在第 1、6、10 个位置发布。

```yaml
apiVersion: apps.kruise.io/v1alpha1
kind: SidecarSet
metadata:
  name: sidecarset
spec:
  # ...
  updateStrategy:
    type: RollingUpdate
    scatterStrategy:
    - key: foo
      value: bar
```
**注意：如果使用 scatter 策略，建议只设置一对 key-value 做打散，会比较好理解。**

### SidecarSet状态说明
通过sidecarset原地升级sidecar容器时，可以通过SidecarSet.Status来观察升级的过程
```yaml
# kubectl describe sidecarsets sidecarset-example
Name:         sidecarset-example
Kind:         SidecarSet
Status:
  Matched Pods:         10  # 该sidecarset注入、管理的pod数量
  Updated Pods:         5   # 5个pod已经更新到最新的SidecarSet中的容器版本
  Ready Pods:           8   # Matched Pods中pod.status.condition.Ready = true的数量
  Updated Ready Pods:   3   # Updated Pods && Ready Pods数量
```
