# Install OpenKruise

## Check before installation

Kruise requires Kube-apiserver to enable features such as `MutatingAdmissionWebhook` and `ValidatingAdmissionWebhook`.

**If your Kubernetes version is lower than 1.12**, you should check your cluster qualification before installation by running one of the following commands locally.

> The script assumes a read/write permission to /tmp and the local Kubectl is configured to access the target cluster.

```shell
$ sh -c "$(curl -fsSL https://raw.githubusercontent.com/openkruise/kruise/master/scripts/check_for_installation.sh)"
Successfully check for installation, you can install kruise now.
```

## Install with helm charts

The latest stable version of Kruise is `v0.5.0`. It is recommended that you should install Kruise with helm v3, which is a simple command-line tool and you can get it from [here](https://github.com/helm/helm/releases).

```shell
$ helm install kruise https://github.com/openkruise/kruise/releases/download/v0.5.0/kruise-chart.tgz
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

| Parameter                                 | Description                                                        | Default                             |
|-------------------------------------------|--------------------------------------------------------------------|-------------------------------------|
| `log.level`                               | Log level that kruise-manager printed                              | `4`                                 |
| `manager.resources.limits.cpu`            | CPU resource limit of kruise-manager container                     | `100m`                              |
| `manager.resources.limits.memory`         | Memory resource limit of kruise-manager container                  | `256Mi`                             |
| `manager.resources.requests.cpu`          | CPU resource request of kruise-manager container                   | `100m`                              |
| `manager.resources.requests.memory`       | Memory resource request of kruise-manager container                | `256Mi`                             |
| `manager.metrics.addr`                    | Addr of metrics served                                             | `localhost`                         |
| `manager.metrics.port`                    | Port of metrics served                                             | `8080`                              |
| `manager.custom_resource_enable`          | Custom resources enabled by kruise-manager                         | `""`(empty means all enabled)       |
| `spec.nodeAffinity`                       | Node affinity policy for kruise-manager pod                        | `{}`                                |
| `spec.nodeSelector`                       | Node labels for kruise-manager pod                                 | `{}`                                |
| `spec.tolerations`                        | Tolerations for kruise-manager pod                                 | `[]`

Specify each parameter using the `--set key=value[,key=value]` argument to `helm install`.

### Optional: Enable specific controllers

If you only need some of the Kruise controllers and want to disable others, you can use either one of the two options or both:

1. Only install the CRDs you need.
2. Set env `CUSTOM_RESOURCE_ENABLE` in kruise-manager container for the resource names that you want to enable. This option can be applied by using helm chart:

```shell
$ helm install kruise https://github.com/openkruise/kruise/releases/download/v0.5.0/kruise-chart.tgz --set manager.custom_resource_enable="CloneSet\,SidecarSet"
```

For example, `CUSTOM_RESOURCE_ENABLE=CloneSet,SidecarSet` means only CloneSet and SidecarSet controllers/webhooks are enabled, all other controllers/webhooks are disabled.

## Uninstall

Note that this will lead to all resources created by Kruise, including webhook configurations, services, namespace, CRDs, CR instances and Pods managed by Kruise controller, to be deleted! Please do this ONLY when you fully understand the consequence.

To uninstall kruise if it is installed with helm charts:

```shell
$ helm uninstall kruise
release "kruise" uninstalled
```
