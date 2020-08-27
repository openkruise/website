---
title: What is OpenKruise
---
# What is OpenKruise

Welcome to OpenKruise!

OpenKruise is a full set of standard extensions for Kubernetes. It works well with original Kubernetes and provides more powerful and efficient features for managing applications Pods, sidecar containers, and even images on Node.

## Key features

- **In-place update**

    In-place update is a way to update container images without deleting and creating Pod. It is quite faster than re-create update used by original Deployment/StatefulSet and less side-effect on other containers.

- **Sidecar management**

    Define sidecar containers in one CR and OpenKruise will inject them into all Pods matched. It's just like istio, but you can manage your own sidecars.

- **Multiple fault domains deployment**

    Define a global workload over multiple fault domains, and OpenKruise will spread a sub workload for each domain. You can manage replicas, template and update strategies for workloads in different fault domains.

- **...**

## CRDs

- **CloneSet**

    CloneSet is a workload that mainly focuses on managing stateless applications. It provides full features for more efficient, deterministic and controlled deployment, such as inplace update, specified pod deletion, configurable priority/scatter update, preUpdate/postUpdate hooks.

- **Advanced StatefulSet**

    An enhanced version of default StatefulSet with extra functionalities such as inplace-update, pause and MaxUnavailable.

- **SidecarSet**

    A controller that injects sidecar containers into the Pod spec based on selectors and also is able to upgrade the sidecar containers.

- **UnitedDeployment**

    This controller manages application pods spread in multiple fault domains by using multiple workloads.

- **BroadcastJob**

    A job that runs Pods to completion across all the nodes in the cluster.

- **Advanced DaemonSet**

    An enhanced version of default DaemonSet with extra functionalities such as partition, node selector, pause and surging.
