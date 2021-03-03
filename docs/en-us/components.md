---
title: Components
---
# OpenKruise components

When you install Kruise into a K8s cluster, it means you have created Kruise CRDs and some components.

![OpenKruise components](/img/docs/components.png)

## CRDs

These CRDs will be configured during Kruise installation.

```bash
$ kubectl get crd | grep kruise.io
advancedcronjobs.apps.kruise.io                  2021-03-02T04:03:57Z
broadcastjobs.apps.kruise.io                     2021-03-02T04:03:57Z
clonesets.apps.kruise.io                         2021-03-02T04:03:57Z
daemonsets.apps.kruise.io                        2021-03-02T04:03:57Z
imagepulljobs.apps.kruise.io                     2021-03-02T04:03:57Z
nodeimages.apps.kruise.io                        2021-03-02T04:03:57Z
sidecarsets.apps.kruise.io                       2021-03-02T04:03:57Z
statefulsets.apps.kruise.io                      2021-03-02T04:03:57Z
uniteddeployments.apps.kruise.io                 2021-03-02T04:03:57Z
```

## Kruise-manager

Kruise-manager is a control plane component that runs controllers and webhooks, it is deployed by a Deployment in `kruise-system` namespace.

```bash
$ kubectl get deploy -n kruise-system
NAME                        READY   UP-TO-DATE   AVAILABLE   AGE
kruise-controller-manager   2/2     2            2           4h6m

$ kubectl get pod -n kruise-system -l control-plane=controller-manager
NAME                                         READY   STATUS    RESTARTS   AGE
kruise-controller-manager-68dc6d87cc-k9vg8   1/1     Running   0          4h6m
kruise-controller-manager-68dc6d87cc-w7x82   1/1     Running   0          4h6m
```

<!-- It can be deployed as multiple replicas with Deployment, but only one of them could become leader and start working, others will keep retrying to acquire the lock. -->

Logically, each controller like cloneset-controller or sidecarset-controller is a separate process, but to reduce complexity, they are all compiled into a single binary and run in the `kruise-controller-manager-xxx` single Pod.

Besides controllers, this Pod also contains the admission webhooks for Kruise CRDs and Pod. It creates webhook configurations to configure which resources should be handled, and provides a Service for kube-apiserver calling.

```bash
$ kubectl get svc -n kruise-system
NAME                     TYPE        CLUSTER-IP     EXTERNAL-IP   PORT(S)   AGE
kruise-webhook-service   ClusterIP   172.24.9.234   <none>        443/TCP   4h9m
```

The `kruise-webhook-service` is much important for kube-apiserver calling.

## Kruise-daemon

This is a new daemon component released since Kruise v0.8.0 version.

It is deployed by DaemonSet, runs on every node and manages things like image pre-download, container restarting.

```bash
$ kubectl get pod -n kruise-system -l control-plane=daemon
NAME                  READY   STATUS    RESTARTS   AGE
kruise-daemon-6hw6d   1/1     Running   0          4h7m
kruise-daemon-d7xr4   1/1     Running   0          4h7m
kruise-daemon-dqp8z   1/1     Running   0          4h7m
kruise-daemon-dv96r   1/1     Running   0          4h7m
kruise-daemon-q7594   1/1     Running   0          4h7m
kruise-daemon-vnsbw   1/1     Running   0          4h7m
```
