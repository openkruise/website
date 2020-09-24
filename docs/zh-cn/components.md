---
title: 组件
---
# OpenKruise 组件

当你在一个 K8s 集群中安装了 Kruise，其实是创建了一些 Kruise 的 CRD 和相关组件。

![OpenKruise components](/img/docs/components.png)

## CRDs

以下的 CRD 会安装到你的集群中：

```shell
$ kubectl get crd | grep kruise.io
broadcastjobs.apps.kruise.io                  2020-06-15T12:00:05Z
clonesets.apps.kruise.io                      2020-06-15T12:00:05Z
sidecarsets.apps.kruise.io                    2020-06-15T12:00:05Z
statefulsets.apps.kruise.io                   2020-06-15T12:00:05Z
uniteddeployments.apps.kruise.io              2020-06-15T12:00:05Z
```

## Kruise-manager

Kruise-manager 是一个运行 controller 和 webhook 中心组件，它通过 Deployment 部署在 `kruise-system` 命名空间中。

```shell
$ kubectl get deploy -n kruise-system
NAME                        READY   UP-TO-DATE   AVAILABLE   AGE
kruise-controller-manager   2/2     2            2           11m

$ kubectl get pod -n kruise-system
NAME                                         READY   STATUS    RESTARTS   AGE
kruise-controller-manager-78b98899c6-f8t67   1/1     Running   0          11m
kruise-controller-manager-78b98899c6-tjlxl   1/1     Running   0          11m
```

<!-- It can be deployed as multiple replicas with Deployment, but only one of them could become leader and start working, others will keep retrying to acquire the lock. -->

逻辑上来说，如 cloneset-controller/sidecarset-controller 这些的 controller 都是独立运行的。不过为了减少复杂度，它们都被打包在一个独立的二进制文件、并运行在 `kruise-controller-manager-xxx` 这个 Pod 中。

除了 controller 之外，`kruise-controller-manager-xxx` 中还包含了针对 Kruise CRD 以及 Pod 资源的 admission webhook。Kruise-manager 会创建一些 webhook configurations 来配置哪些资源需要感知处理、以及提供一个 Service 来给 kube-apiserver 调用。

```shell
$ kubectl get svc -n kruise-system
NAME                                TYPE        CLUSTER-IP       EXTERNAL-IP   PORT(S)   AGE
kruise-webhook-server-service       ClusterIP   10.109.43.220    <none>        443/TCP   12m
```

上述的 `kruise-webhook-server-service` 非常重要，是提供给 kube-apiserver 调用的。

## Kruise-daemon

这是一个**即将开放**的 daemon 组件，由 DaemonSet 来部署到每个 Node 上，目前主要用于管理 NodeImage 资源来预拉取镜像和上报状态。
