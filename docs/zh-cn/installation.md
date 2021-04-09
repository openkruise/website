---
title: 安装
---
# 安装 OpenKruise

OpenKruise 要求 Kubernetes 版本高于 1.13+，注意在 1.13 和 1.14 版本中必须先在 kube-apiserver 中打开 `CustomResourceWebhookConversion` feature-gate。

## 通过 helm charts 安装

建议采用 helm v3.1+ 来安装 Kruise，helm 是一个简单的命令行工具可以从 [这里](https://github.com/helm/helm/releases) 获取。

```bash
# Kubernetes 1.13 或 1.14 版本
helm install kruise https://github.com/openkruise/kruise/releases/download/v0.8.1/kruise-chart.tgz --disable-openapi-validation

# Kubernetes 1.15 和更新的版本
helm install kruise https://github.com/openkruise/kruise/releases/download/v0.8.1/kruise-chart.tgz
```

## 通过 helm charts 升级

如果你在使用旧版本的 Kruise，建议为了安全性和更丰富的功能，升级到最新版本：

```bash
# Kubernetes 1.13 and 1.14
helm upgrade kruise https://github.com/openkruise/kruise/releases/download/v0.8.1/kruise-chart.tgz --disable-openapi-validation

# Kubernetes 1.15 and newer versions
helm upgrade kruise https://github.com/openkruise/kruise/releases/download/v0.8.1/kruise-chart.tgz
```

注意：

1. 在升级之前，**必须** 先阅读 [Change Log](https://github.com/openkruise/kruise/blob/master/CHANGELOG.md) ，确保你已经了解新版本的不兼容变化。
2. 如果你要重置之前旧版本上用的参数或者配置一些新参数，建议在 `helm upgrade` 命令里加上 `--reset-values`。

## 可选项

注意直接安装 chart 会使用默认的 template values，你也可以根据你的集群情况指定一些特殊配置，比如修改 resources 限制或者配置 feature-gates。

### 可选: chart 安装参数

下表展示了 chart 所有可配置的参数和它们的默认值：

| Parameter                                 | Description                                                  | Default                       |
| ----------------------------------------- | ------------------------------------------------------------ | ----------------------------- |
| `featureGates`                            | Feature gates for Kruise, empty string means all enabled     | ``                            |
| `manager.log.level`                       | Log level that kruise-manager printed                        | `4`                           |
| `manager.replicas`                        | Replicas of kruise-controller-manager deployment             | `2`                           |
| `manager.image.repository`                | Repository for kruise-manager image                          | `openkruise/kruise-manager`   |
| `manager.image.tag`                       | Tag for kruise-manager image                                 | `v0.8.1`                      |
| `manager.resources.limits.cpu`            | CPU resource limit of kruise-manager container               | `100m`                        |
| `manager.resources.limits.memory`         | Memory resource limit of kruise-manager container            | `256Mi`                       |
| `manager.resources.requests.cpu`          | CPU resource request of kruise-manager container             | `100m`                        |
| `manager.resources.requests.memory`       | Memory resource request of kruise-manager container          | `256Mi`                       |
| `manager.metrics.port`                    | Port of metrics served                                       | `8080`                        |
| `manager.webhook.port`                    | Port of webhook served                                       | `9443`                        |
| `manager.nodeAffinity`                    | Node affinity policy for kruise-manager pod                  | `{}`                          |
| `manager.nodeSelector`                    | Node labels for kruise-manager pod                           | `{}`                          |
| `manager.tolerations`                     | Tolerations for kruise-manager pod                           | `[]`                          |
| `daemon.log.level`                        | Log level that kruise-daemon printed                         | `4`                           |
| `daemon.port`                             | Port of metrics and healthz that kruise-daemon served        | `10221`                       |
| `daemon.resources.limits.cpu`             | CPU resource limit of kruise-daemon container                | `50m`                         |
| `daemon.resources.limits.memory`          | Memory resource limit of kruise-daemon container             | `64Mi`                        |
| `daemon.resources.requests.cpu`           | CPU resource request of kruise-daemon container              | `0`                           |
| `daemon.resources.requests.memory`        | Memory resource request of kruise-daemon container           | `0`                           |
| `daemon.affinity`                         | Affinity policy for kruise-daemon pod                        | `{}`                          |
| `daemon.socketLocation`                   | Location of the container manager control socket             | `/var/run`                    |
| `webhookConfiguration.failurePolicy.pods` | The failurePolicy for pods in mutating webhook configuration | `Ignore`                      |
| `webhookConfiguration.timeoutSeconds`     | The timeoutSeconds for all webhook configuration             | `30`                          |
| `crds.managed`                            | Kruise will not install CRDs with chart if this is false     | `true`                        |

这些参数可以通过 `--set key=value[,key=value]` 参数在 `helm install` 或 `helm upgrade` 命令中生效。

### 可选: feature-gate

Feature-gate 控制了 Kruise 中一些有影响性的功能：

| Name                   | Description                                                  | Default | Side effect (if closed)              |
| ---------------------- | ------------------------------------------------------------ | ------- | --------------------------------------
| `PodWebhook`           | Whether to open a webhook for Pod **create**                 | `true`  | SidecarSet disabled                  |
| `KruiseDaemon`         | Whether to deploy `kruise-daemon` DaemonSet                  | `true`  | Image pulling disabled               |

如果你要配置 feature-gate，只要在安装或升级时配置参数：

```bash
# one
$ helm install kruise https://... --set featureGates="PodWebhook=false"

# or more
$ helm install kruise https://... --set featureGates="PodWebhook=false\,KruiseDaemon=false"
```

### 可选: 中国本地镜像

如果你在中国、并且很难从官方 DockerHub 上拉镜像，那么你可以使用托管在阿里云上的镜像仓库：

```bash
$ helm install kruise https://... --set  manager.image.repository=openkruise-registry.cn-hangzhou.cr.aliyuncs.com/openkruise/kruise-manager
```

## 卸载

注意：卸载会导致所有 Kruise 下的资源都会删除掉，包括 webhook configurations, services, namespace, CRDs, CR instances 以及所有 Kruise workload 下的 Pod。 请务必谨慎操作！

卸载使用 helm chart 安装的 Kruise：

```bash
$ helm uninstall kruise
release "kruise" uninstalled
```
