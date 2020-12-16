---
title: 快速开始
---
# 安装 OpenKruise

OpenKruise 要求 Kubernetes 版本高于 1.13+，注意在 1.13 和 1.14 版本中必须先在 kube-apiserver 中打开 `CustomResourceWebhookConversion` feature-gate。

## 通过 helm charts 安装

建议采用 helm v3.1+ 来安装 Kruise，helm 是一个简单的命令行工具可以从[这里](https://github.com/helm/helm/releases)获取。

```bash
# Kubernetes 1.13 或 1.14 版本
helm install kruise https://github.com/openkruise/kruise/releases/download/v0.7.0/kruise-chart.tgz --disable-openapi-validation
# Kubernetes 1.15 和更新的版本
helm install kruise https://github.com/openkruise/kruise/releases/download/v0.7.0/kruise-chart.tgz
```

执行结果如下：

```shell
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

| Parameter                                 | Description                                                  | Default                       |
| ----------------------------------------- | ------------------------------------------------------------ | ----------------------------- |
| `log.level`                               | Log level that kruise-manager printed                        | `4`                           |
| `revisionHistoryLimit`                    | Limit of revision history                                    | `3`                           |
| `manager.replicas`                        | Replicas of kruise-controller-manager deployment             | `2`                           |
| `manager.image.repository`                | Repository for kruise-manager image                          | openkruise/kruise-manager     |
| `manager.image.tag`                       | Tag for kruise-manager image                                 | v0.7.0                        |
| `manager.resources.limits.cpu`            | CPU resource limit of kruise-manager container               | `100m`                        |
| `manager.resources.limits.memory`         | Memory resource limit of kruise-manager container            | `256Mi`                       |
| `manager.resources.requests.cpu`          | CPU resource request of kruise-manager container             | `100m`                        |
| `manager.resources.requests.memory`       | Memory resource request of kruise-manager container          | `256Mi`                       |
| `manager.metrics.addr`                    | Addr of metrics served                                       | `localhost`                   |
| `manager.metrics.port`                    | Port of metrics served                                       | `8080`                        |
| `manager.webhook.port`                    | Port of webhook served                                       | `9443`                        |
| `manager.custom_resource_enable`          | Custom resources enabled by kruise-manager                   | `""(empty means all enabled)` |
| `spec.nodeAffinity`                       | Node affinity policy for kruise-manager pod                  | `{}`                          |
| `spec.nodeSelector`                       | Node labels for kruise-manager pod                           | `{}`                          |
| `spec.tolerations`                        | Tolerations for kruise-manager pod                           | `[]`                          |
| `webhookConfiguration.failurePolicy.pods` | The failurePolicy for pods in mutating webhook configuration | `Ignore`                      |

这些参数可以通过 `--set key=value[,key=value]` 参数在 `helm install` 命令中生效。

### 可选: 启用特定 CRD 功能

如果你只需要使用某些 Kruise 中的控制器并关闭其他的控制器，你可以做以下两个方式或同时做：

1. 只安装你需要使用的 CRD。
2. 在 kruise-manager 容器中设置 `CUSTOM_RESOURCE_ENABLE` 环境变量，指定你需要启用的 CRD 名字。在 helm chart 安装的时候可以使用以下参数：

```shell
$ helm install kruise https://github.com/openkruise/kruise/releases/download/v0.7.0/kruise-chart.tgz --set manager.custom_resource_enable="CloneSet\,SidecarSet"
...
```

比如，`CUSTOM_RESOURCE_ENABLE=CloneSet,SidecarSet` 表示只启用 CloneSet 和 SidecarSet 的 controller/ webhook，其他资源的 controllers/webhooks 都会关闭。

## 卸载

注意：卸载会导致所有 Kruise 下的资源都会删除掉，包括 webhook configurations, services, namespace, CRDs, CR instances 以及所有 Kruise workload 下的 Pod。 请务必谨慎操作！

卸载使用 helm chart 安装的 Kruise：

```shell
$ helm uninstall kruise
release "kruise" uninstalled
```
