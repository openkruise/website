# CloneSet

CloneSet 控制器提供了高效管理无状态应用的能力，它可以对标原生的 `Deployment`，但 `CloneSet` 提供了很多增强功能。

按照 Kruise 的[命名规范](../blog/blog1.html)，CloneSet 是一个直接管理 Pod 的 **Set** 类型 workload。
一个简单的 CloneSet yaml 文件如下：

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

## 扩缩容功能

### 支持 PVC 模板

CloneSet 允许用户配置 PVC 模板 `volumeClaimTemplates`，用来给每个 Pod 生成独享的 PVC，这是 `Deployment` 所不支持的。
如果用户没有指定这个模板，CloneSet 会创建不带 PVC 的 Pod。

一些注意点：

- 每个被自动创建的 PVC 会有一个 ownerReference 指向 CloneSet，因此 CloneSet 被删除时，它创建的所有 Pod 和 PVC 都会被删除。
- 每个被 CloneSet 创建的 Pod 和 PVC，都会带一个 `apps.kruise.io/cloneset-instance-id: xxx` 的 label。关联的 Pod 和 PVC 会有相同的 **instance-id**，且它们的名字后缀都是这个 **instance-id**。
- 如果一个 Pod 被 CloneSet controller 缩容删除时，这个 Pod 关联的 PVC 都会被一起删掉。
- 如果一个 Pod 被外部直接调用删除或驱逐时，这个 Pod 关联的 PVC 还都存在；并且 CloneSet controller 发现数量不足重新扩容时，新扩出来的 Pod 会复用原 Pod 的 **instance-id** 并关联原来的 PVC。
- 当 Pod 被**重建升级**时，关联的 PVC 会跟随 Pod 一起被删除、新建。
- 当 Pod 被**原地升级**时，关联的 PVC 会持续使用。

以下是一个带有 PVC 模板的例子：

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

### 指定 Pod 缩容

当一个 CloneSet 被缩容时，有时候用户需要指定一些 Pod 来删除。这对于 `StatefulSet` 或者 `Deployment` 来说是无法实现的，因为 `StatefulSet` 要根据序号来删除 Pod，而 `Deployment`/`ReplicaSet` 目前只能根据控制器里定义的排序来删除。

CloneSet 允许用户在缩小 `replicas` 数量的同时，指定想要删除的 Pod 名字。参考下面这个例子：

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

当控制器收到上面这个 CloneSet 更新之后，会确保 replicas 数量为 4。如果 `podsToDelete` 列表里写了一些 Pod 名字，控制器会优先删除这些 Pod。
对于已经被删除的 Pod，控制器会自动从 `podsToDelete` 列表中清理掉。

注意：

- 如果你只把 Pod 名字加到 `podsToDelete`，但没有修改 `replicas` 数量，那么控制器会先把指定的 Pod 删掉，然后再扩一个新的 Pod。
- 如果不指定 `podsToDelete`，控制器会按照默认顺序来选择 Pod 删除：not-ready < ready, unscheduled < scheduled, and pending < running。

## 升级功能

### 原地升级

CloneSet 提供了和 `Advanced StatefulSet` 相同的 3 个升级方式，默认为 `ReCreate`：

- `ReCreate`: 控制器会删除旧 Pod 和它的 PVC，然后用新版本重新创建出来。
- `InPlaceIfPossible`: 控制器会优先尝试原地升级 Pod，如果不行再采用重建升级。目前，只有修改 `spec.template.metadata.*` 和 `spec.template.spec.containers[x].image` 这些字段才可以走原地升级。
- `InPlaceOnly`: 控制器只允许采用原地升级。因此，用户只能修改上一条中的限制字段，如果尝试修改其他字段会被 Kruise 拒绝。

当一个 Pod 被原地升级时，控制器会先利用 readinessGates 把 Pod status 中修改为 not-ready 状态，然后再更新 Pod spec 中的 image 字段来触发 Kubelet 重建对应的容器。
不过这样可能存在的一个风险：有时候 Kubelet 重建容器太快，还没等到其他控制器如 endpoints-controller 感知到 Pod not-ready，可能会导致流量受损。

因此我们又在原地升级中提供了 **graceful period** 选项，作为优雅原地升级的策略。用户如果配置了 `gracePeriodSeconds` 这个字段，控制器在原地升级的过程中会先把 Pod status 改为 not-ready，然后等一段时间（`gracePeriodSeconds`），最后再去修改 Pod spec 中的镜像版本。
这样，就为 endpoints-controller 这些控制器留出了充足的时间来将 Pod 从 endpoints 端点列表中去除。

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

### Template 和 revision

`spec.template` 中定义了当前 CloneSet 中最新的 Pod 模板。
控制器会为每次更新过的 `spec.template` 计算一个 revision hash 值，比如针对开头的 CloneSet 例子，
控制器会为 template 计算出 revision hash 为 `sample-744d4796cc` 并上报到 CloneSet status 中。

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

这里是对 CloneSet status 中的字段说明：

- `status.replicas`: Pod 总数
- `status.readyReplicas`: **ready** Pod 数量
- `status.availableReplicas`: **ready and available** Pod 数量 (满足 `minReadySeconds`)
- `status.updateRevision`: 最新版本的 revision hash 值
- `status.updatedReplicas`: 最新版本的 Pod 数量
- `status.updatedReadyReplicas`: 最新版本的 **ready** Pod 数量

### Partition 分批灰度

Partition 的语义是 **保留旧版本 Pod 的数量**，默认为 `0`。
如果在发布过程中设置了 `partition`，则控制器只会将 `(replicas - partition)` 数量的 Pod 更新到最新版本。和 `StatefulSet` 不同的是，这里的 `partition` 不表示任何 `order` 序号。

比如，我们将 CloneSet 例子的 image 更新为 `nginx:mainline` 并且设置 `partition=3`。过了一会，查到的 CloneSet 如下：

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

注意 `status.updateRevision` 已经更新为 `sample-56dfb978d4` 新的值。
由于我们设置了 `partition=3`，控制器只升级了 2 个 Pod。

```bash
$ kubectl get pod -L controller-revision-hash
NAME           READY   STATUS    RESTARTS   AGE     CONTROLLER-REVISION-HASH
sample-chvnr   1/1     Running   0          6m46s   sample-d4d4fb5bd
sample-j6c4s   1/1     Running   0          6m46s   sample-d4d4fb5bd
sample-ns85c   1/1     Running   0          6m46s   sample-d4d4fb5bd
sample-jnjdp   1/1     Running   0          10s     sample-56dfb978d4
sample-qqglp   1/1     Running   0          18s     sample-56dfb978d4
```

### MaxUnavailable 最大不可用数量

MaxUnavailable 是本次发布过程中，限制最多不可用的 Pod 数量。
它可以设置为一个**绝对值**或者**百分比**，如果不填 Kruise 会设置为默认值 `20%`。

```yaml
apiVersion: apps.kruise.io/v1alpha1
kind: CloneSet
spec:
  # ...
  updateStrategy:
    maxUnavailable: 20%
```

### MaxSurge 最大弹性数量

MaxSurge 是本次发布过程中，最多能扩出来超过 `replicas` 的 Pod 数量。
它可以设置为一个**绝对值**或者**百分比**，如果不填 Kruise 会设置为默认值 `0`。

如果发布的时候设置了 maxSurge，控制器会先多扩出来 `maxSurge` 数量的 Pod（此时 Pod 总数为 `(replicas+maxSurge)`)，然后再开始发布存量的 Pod。
然后，当新版本 Pod 数量已经满足 `partition` 要求之后，控制器会再把多余的 `maxSurge` 数量的 Pod 删除掉，保证最终的 Pod 数量符合 `replicas`。

要说明的是，maxSurge 不允许配合 `InPlaceOnly` 更新模式使用。
另外，如果是与 `InPlaceIfPossible` 策略配合使用，控制器会先扩出来 `maxSurge` 数量的 Pod，再对存量 Pod 做原地升级。

```yaml
apiVersion: apps.kruise.io/v1alpha1
kind: CloneSet
spec:
  # ...
  updateStrategy:
    maxSurge: 3
```

### 升级顺序

当控制器选择 Pod 做升级时，默认是有一套根据 Pod phase/conditions 的排序逻辑：
**unscheduled < scheduled, pending < unknown < running, not-ready < ready**。
在此之外，CloneSet 也提供了增强的 `priority`(优先级) 和 `scatter`(打散) 策略来允许用户自定义发布顺序。

#### 优先级策略

这个策略定义了控制器计算 Pod 发布优先级的规则，所有需要更新的 Pod 都会通过这个优先级规则计算后排序。
目前 `priority` 可以通过 weight(权重) 和 order(序号) 两种方式来指定。

- `weight`: Pod 优先级是由所有 weights 列表中的 term 来计算 match selector 得出。如下：

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

- `order`: Pod 优先级是由 orderKey 的 value 决定，这里要求对应的 value 的结尾能解析为 int 值。比如 value "5" 的优先级是 5，value "sts-10" 的优先级是 10。

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

#### 打散策略

这个策略定义了如何将一类 Pod 打散到整个发布过程中。
比如，针对一个 `replica=10` 的 CloneSet，我们在 3 个 Pod 中添加了 `foo=bar` 标签、并设置对应的 scatter 策略，那么在发布的时候这 3 个 Pod 会排在第 1、6、10 个发布。

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

注意：

- 尽管 `priority` 和 `scatter` 策略可以一起设置，但我们强烈推荐同时只用其中一个。
- 如果使用了 `scatter` 策略，我们强烈建议只配置一个 term （key-value）。否则，实际的打散发布顺序可能会不太好理解。

最后要说明的是，使用上述发布顺序策略都要求对特定一些 Pod 打标，这是在 CloneSet 中没有提供的。

### 发布暂停

用户可以通过设置 paused 为 true 暂停发布，不过控制器还是会做 replicas 数量管理：

```yaml
apiVersion: apps.kruise.io/v1alpha1
kind: CloneSet
spec:
  # ...
  updateStrategy:
    paused: true
```

### PreUpdate and PostUpdate

`PreUpdate` 和 `PostUpdate` 允许用户设置 Pod 升级前后的钩子来做一些额外的事情。这个功能后续即将开放。
