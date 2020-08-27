# Install OpenKruise

OpenKruise requires Kubernetes version >= `v1.12`.

## Install with helm charts

The latest stable version of Kruise is `v0.6.0`. It is recommended that you should install Kruise with helm v3.1+, which is a simple command-line tool and you can get it from [here](https://github.com/helm/helm/releases).

```bash
# Kubernetes 1.14 and older versions
helm install kruise https://github.com/openkruise/kruise/releases/download/v0.6.0/kruise-chart.tgz --disable-openapi-validation
# Kubernetes 1.15 and newer versions
helm install kruise https://github.com/openkruise/kruise/releases/download/v0.6.0/kruise-chart.tgz
```

you will see follow:

```shell
NAME: kruise
LAST DEPLOYED: Mon Jun 15 20:00:05 2020
NAMESPACE: default
STATUS: deployed
REVISION: 1
TEST SUITE: None
```

Note that installing this chart directly means it will use the default template values for kruise-manager. You may have to set your specific configurations when it is deployed into a production cluster or you want to enable specific controllers.

### Optional: configure chart parameters

Note that installing this chart directly means it will use the default template values for kruise-manager. You may have to set your specific configurations when it is deployed into a production cluster or you want to enable specific controllers.

The following table lists the configurable parameters of the chart and their default values.

| Parameter                                 | Description                                                  | Default                       |
| ----------------------------------------- | ------------------------------------------------------------ | ----------------------------- |
| `log.level`                               | Log level that kruise-manager printed                        | `4`                           |
| `revisionHistoryLimit`                    | Limit of revision history                                    | `3`                           |
| `manager.replicas`                        | Replicas of kruise-controller-manager deployment             | `2`                           |
| `manager.image.repository`                | Repository for kruise-manager image                          | openkruise/kruise-manager     |
| `manager.image.tag`                       | Tag for kruise-manager image                                 | v0.6.0                        |
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

Specify each parameter using the `--set key=value[,key=value]` argument to `helm install`.

### Optional: Enable specific controllers

If you only need some of the Kruise controllers and want to disable others, you can use either one of the two options or both:

1. Only install the CRDs you need.
2. Set env `CUSTOM_RESOURCE_ENABLE` in kruise-manager container for the resource names that you want to enable. This option can be applied by using helm chart:

```shell
$ helm install kruise https://github.com/openkruise/kruise/releases/download/v0.6.0/kruise-chart.tgz --set manager.custom_resource_enable="CloneSet\,SidecarSet"
...
```

For example, `CUSTOM_RESOURCE_ENABLE=CloneSet,SidecarSet` means only CloneSet and SidecarSet controllers/webhooks are enabled, all other controllers/webhooks are disabled.

## Uninstall

Note that this will lead to all resources created by Kruise, including webhook configurations, services, namespace, CRDs, CR instances and Pods managed by Kruise controller, to be deleted! Please do this ONLY when you fully understand the consequence.

To uninstall kruise if it is installed with helm charts:

```shell
$ helm uninstall kruise
release "kruise" uninstalled
```
