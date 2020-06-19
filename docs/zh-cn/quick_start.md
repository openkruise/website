# 安装 OpenKruise

## 安装前检查

Kruise 需要 Kube-apiserver 启用一些功能如 `MutatingAdmissionWebhook` 和 `ValidatingAdmissionWebhook`。

如果你的 Kubernetes 版本低于 v1.12，在安装前要先在本地执行如下的脚本来校验是否满足：

> 注意，这个脚本需要对本地 /tmp 目录有读写权限，并且先配置好本地 kubectl 能够连接目标集群。

```shell
$ sh -c "$(curl -fsSL https://raw.githubusercontent.com/openkruise/kruise/master/scripts/check_for_installation.sh)"
Successfully check for installation, you can install kruise now.
```

## 通过 helm charts 安装

目前最新的 Kruise 稳定版本是 `v0.5.0`。我们建议你采用 helm v3 来安装 Kruise，helm 是一个简单的命令行工具可以从[这里](https://github.com/helm/helm/releases)获取。

```shell
$ helm install kruise https://github.com/openkruise/kruise/releases/download/v0.5.0/kruise-chart.tgz
NAME: kruise
LAST DEPLOYED: Mon Jun 15 20:00:00 2020
NAMESPACE: default
STATUS: deployed
REVISION: 1
TEST SUITE: None
```

### 可选: chart 安装参数

注意直接安装 chart 会使用默认的 template values，你也可以根据你的集群情况指定一些特殊配置，比如修改 resources 限制或者只启用某些特定的控制器能力。

下表展示了 chart 所有可配置的参数和它们的默认值：

| 参数                               | 描述                                                        | 默认值                             |
|-------------------------------------------|--------------------------------------------------------------------|-------------------------------------|
| `log.level`                               | kruise-manager 输出的日志级别                                        | `4`                                 |
| `manager.resources.limits.cpu`            | kruise-manager 容器的 CPU limit 配置                                | `100m`                              |
| `manager.resources.limits.memory`         | kruise-manager 容器的 Memory limit 配置                             | `256Mi`                             |
| `manager.resources.requests.cpu`          | kruise-manager 容器的 CPU request 配置                              | `100m`                              |
| `manager.resources.requests.memory`       | kruise-manager 容器的 Memory request 配置                           | `256Mi`                             |
| `manager.metrics.addr`                    | Metrics server 绑定地址                                             | `localhost`                         |
| `manager.metrics.port`                    | Metrics server 绑定端口                                             | `8080`                              |
| `manager.custom_resource_enable`          | 只启用特定的 CRD 资源                                                | `""`(空表示所有都启用)       |
| `spec.nodeAffinity`                       | kruise-manager pod 的 nodeAffinity 配置                             | `{}`                                |
| `spec.nodeSelector`                       | kruise-manager pod 的 nodeSelector 配置                             | `{}`                                |
| `spec.tolerations`                        | kruise-manager pod 的 tolerations 配置                              | `[]`

这些参数可以通过 `--set key=value[,key=value]` 参数在 `helm install` 命令中生效。

### 可选: 启用特定 CRD 功能

如果你只需要使用某些 Kruise 中的控制器并关闭其他的控制器，你可以做以下两个方式或同时做：

1. 只安装你需要使用的 CRD。
2. 在 kruise-manager 容器中设置 `CUSTOM_RESOURCE_ENABLE` 环境变量，指定你需要启用的 CRD 名字。在 helm chart 安装的时候可以使用以下参数：

```shell
$ helm install kruise https://github.com/openkruise/kruise/releases/download/v0.5.0/kruise-chart.tgz --set manager.custom_resource_enable="CloneSet\,SidecarSet"
```

比如，`CUSTOM_RESOURCE_ENABLE=CloneSet,SidecarSet` 表示只启用 CloneSet 和 SidecarSet 的 controller/ webhook，其他资源的 controllers/webhooks 都会关闭。

## 卸载

注意：卸载会导致所有 Kruise 下的资源都会删除掉，包括 webhook configurations, services, namespace, CRDs, CR instances 以及所有 Kruise workload 下的 Pod。 请务必谨慎操作！

卸载使用 helm chart 安装的 Kruise：

```shell
$ helm uninstall kruise
release "kruise" uninstalled
```
