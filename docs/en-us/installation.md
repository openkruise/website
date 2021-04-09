---
title: Installation
---
# Install OpenKruise

OpenKruise requires Kubernetes version >= `1.13+` because of CRD conversion.

Note that for Kubernetes 1.13 and 1.14, users must enable `CustomResourceWebhookConversion` feature-gate in kube-apiserver before install or upgrade Kruise.

## Install with helm charts

It is recommended that you should install Kruise with helm v3.1+, which is a simple command-line tool and you can get it from [here](https://github.com/helm/helm/releases).

```bash
# Kubernetes 1.13 and 1.14
helm install kruise https://github.com/openkruise/kruise/releases/download/v0.8.1/kruise-chart.tgz --disable-openapi-validation

# Kubernetes 1.15 and newer versions
helm install kruise https://github.com/openkruise/kruise/releases/download/v0.8.1/kruise-chart.tgz
```

## Upgrade with helm charts

If you are using Kruise with an old version, it is recommended that you should upgrade to the latest version for safety and more features:

```bash
# Kubernetes 1.13 and 1.14
helm upgrade kruise https://github.com/openkruise/kruise/releases/download/v0.8.1/kruise-chart.tgz --disable-openapi-validation

# Kubernetes 1.15 and newer versions
helm upgrade kruise https://github.com/openkruise/kruise/releases/download/v0.8.1/kruise-chart.tgz
```

Note that:

1. Before upgrade, you **must** firstly read the [Change Log](https://github.com/openkruise/kruise/blob/master/CHANGELOG.md)
   to make sure that you have understand the breaking changes in the new version.
2. If you want to drop the chart parameters you configured for the old release or set some new parameters,
   it is recommended to add `--reset-values` flag in `helm upgrade` command.

## Options

Note that installing this chart directly means it will use the default template values for Kruise.

You may have to set your specific configurations if it is deployed into a production cluster, or you want to configure feature-gates.

### Optional: chart parameters

The following table lists the configurable parameters of the chart and their default values.

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

Specify each parameter using the `--set key=value[,key=value]` argument to `helm install` or `helm upgrade`.

### Optional: feature-gate

Feature-gate controls some influential features in Kruise:

| Name                   | Description                                                  | Default | Side effect (if closed)              |
| ---------------------- | ------------------------------------------------------------ | ------- | --------------------------------------
| `PodWebhook`           | Whether to open a webhook for Pod **create**                 | `true`  | SidecarSet disabled                  |
| `KruiseDaemon`         | Whether to deploy `kruise-daemon` DaemonSet                  | `true`  | Image pulling disabled               |

If you want to configure the feature-gate, just set the parameter when install or upgrade:

```bash
# one
$ helm install kruise https://... --set featureGates="PodWebhook=false"

# or more
$ helm install kruise https://... --set featureGates="PodWebhook=false\,KruiseDaemon=false"
```

### Optional: the local image for China

If you are in China and have problem to pull image from official DockerHub, you can use the registry hosted on Alibaba Cloud:

```bash
$ helm install kruise https://... --set  manager.image.repository=openkruise-registry.cn-hangzhou.cr.aliyuncs.com/openkruise/kruise-manager
```

## Uninstall

Note that this will lead to all resources created by Kruise, including webhook configurations, services, namespace, CRDs, CR instances and Pods managed by Kruise controller, to be deleted!

Please do this ONLY when you fully understand the consequence.

To uninstall kruise if it is installed with helm charts:

```bash
$ helm uninstall kruise
release "kruise" uninstalled
```
