---
title: Components
---
# OpenKruise components

When you install Kruise into a K8s cluster, it means you have created Kruise CRDs and some components.

![OpenKruise components](/img/docs/components.png)

## CRDs

These CRDs will be configured during Kruise installation.

```shell
$ kubectl get crd | grep kruise.io
broadcastjobs.apps.kruise.io                  2020-06-15T12:00:05Z
clonesets.apps.kruise.io                      2020-06-15T12:00:05Z
sidecarsets.apps.kruise.io                    2020-06-15T12:00:05Z
statefulsets.apps.kruise.io                   2020-06-15T12:00:05Z
uniteddeployments.apps.kruise.io              2020-06-15T12:00:05Z
```

## Kruise-manager

Kruise-manager is a control plane component that runs controllers and webhooks, it is deployed by a Deployment in `kruise-system` namespace.

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

Logically, each controller like cloneset-controller or sidecarset-controller is a separate process, but to reduce complexity, they are all compiled into a single binary and run in the `kruise-controller-manager-xxx` single Pod.

Besides controllers, this Pod also contains the admission webhooks for Kruise CRDs and Pod. It creates webhook configurations to configure which resources should be handled, and provides a Service for kube-apiserver calling.

```shell
$ kubectl get svc -n kruise-system
NAME                                TYPE        CLUSTER-IP       EXTERNAL-IP   PORT(S)   AGE
kruise-webhook-server-service       ClusterIP   10.109.43.220    <none>        443/TCP   12m
```

The `kruise-webhook-server-service` is much important for kube-apiserver calling.

## Kruise-daemon

This is a **coming** daemon component deployed by DaemonSet, it runs on every node and managing NodeImage resources to pre-pull images.
