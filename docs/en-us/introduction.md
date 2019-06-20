# Kruise

Kruise is the core of OpenKruise project. It is a set of controllers which extend and complement 
[Kubernetes core controllers](https://kubernetes.io/docs/concepts/overview/what-is-kubernetes/)
on application workload management.

Today, Kruise offers three application workload controllers:

* [Advanced StatefulSet](https://github.com/openkruise/kruise/tree/master/docs/astatefulset/README.md): An enhanced version of default [StatefulSet](https://kubernetes.io/docs/concepts/workloads/controllers/statefulset/) with extra functionalities such as `inplace-update`, parallel upgrade.

* [BroadcastJob](https://github.com/openkruise/kruise/tree/master/docs/broadcastJob/README.md): A job that runs pods to completion across all the nodes in the cluster.

* [SidecarSet](https://github.com/openkruise/kruise/tree/master/docs/sidecarSet/README.md): A controller that injects sidecar container into the pod spec based on selectors.

Please see github [documents](https://github.com/openkruise/kruise/tree/master/docs/README.md) for more technical information.
