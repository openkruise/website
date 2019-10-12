---
title: Kruise Controller Classification Guidance
keywords: Kubernetes, controller, Pod, StatefulSet
description: This blog describes how Kruise classifies different controllers. This can help
Kruise users to identify the best workload for their applications.
---

# Kruise Controller Classification Guidance

Kubernetes does not provide a clear guidance about which controller is the best fit for
different applications. Sometimes, this does not bother users if they understand
both the application and workload well. For example, users typically know when to choose
`Job/CronJob` or `DaemonSet` since their concepts are straightforward - the former is designed
for temporal batch style applications and the latter is suitable for long running Pods
which are needed in every node. On the other hand, the usage boundary between `Deployment` and
`StatefulSet` is vague. An application managed by a `Deployment` conceptually can be
managed by a `StatefulSet` as well, the opposite may also apply as long as the Pod
`OrderReady` capability is not mandatory. Further mores, as more and more customized
controllers/operators become available in Kubernetes community, finding suitable controller
can be a nonnegligible user problem especially when some controllers have functional overlaps.

Kruise does not aim to resolve the problem, but it attempts to establish a
classification mechanism for existing workload controllers so that user can more easily
understand the use cases of them. The first and most intuitive criterion for classification
is the controller name.

### Controller Name Convention
An easily understandable controller name can certainly improve adoption. After consulting
with many internal/external Kubernetes users, we decide to use the following naming
conventions in Kruise. Note that these conventions can be applied to upstream
controllers as well.

* **Set** -suffix names: This type of controller manages Pods directly. Examples
include `Advanced StatefulSet`, `ReplicaSet` and `SidecarSet`. It supports
various depolyment/rollout strategies in Pod level;

* **Deployment** -suffix names: This type of controller does not manage Pods
directly. Instead, it manages one or many **Set** -suffix workload instances which are
created on behalf of one application. The controller can provide capabilities
to orchestrate the deployment/rollout of multiple instances. For example, `Deployment`
manages `ReplicaSet` and provides rollout capability which is not available in `ReplicaSet`.
`UnitedDeployment` (planned in [M3 release]((https://github.com/openkruise/kruise/projects)))
manages multiple `StatefulSet` created in respect of multiple domains
(i.e., fault domains) within one cluster;

* **Job** -suffix names: This type of controller manages batch style applications with
different depolyment/rollout strategies. For example, `BroadcastJob` distributes a
one-time Pod to every node in the cluster.

**Set**, **Deployment** and **Job** are widely adopted terms in Kubernetes community,
Kruise closely follows them with certain extensions.

Can we further distinguish controllers with the same suffix? Normally the string prior to
suffix should be self-explainable, but in many cases it is hard to find a right term to
describe what the controller does. Check to see how `StatefulSet` is originated in
this [thread](https://github.com/kubernetes/kubernetes/issues/27430). It takes four
months for community to decide to use the name `StatefulSet` to replace the original
name `PetSet`. Some people still think it is a hard-to-understand name when looking
at its API documentation. This example showcases that sometimes a well thought out name
may not be helpful to distinguish controllers. Again, Kruise does not plan to resolve
this problem. As an incremental effort, Kruise considers the following criterion to help classify
**Set** -suffix controllers.


### Fixed Pod Name
One unique property of `StatefulSet` is that it maintains consistent identities for
Pod network and storage. Essentially, this is done by fixing Pod names.
Pod name can identity both network and storage since it is part of DNS record and
can be used to name Pod volume claim. Why is this property needed given that all Pods in
`StatefulSet` are created from the same Pod template?
A well known use case is to manage distributed coordination server application such as
etcd or Zookeeper. This type of application requires the cluster member
(i.e., the Pod) to access the same data (saved in the Pod volume) whenever a member is
reconstructed upon failure, in order to function correctly. To differentiate the concept
of `State` in Kubernetes controllers from the same term used in other computer science areas,
I'd rather associate `State` with Pod name. That being said, controllers
like `ReplicaSet` and `DaemonSet` are `Stateless` since they don't require to reuse the
old name when Pod is recreated.

Supporting `Stateful` does imply inflexibility for controller. `StatefulSet` relies on ordinal
numbers to implement fixing Pod names. The workload rollout and scaling
has to be done in a strict order. As a consequence, some useful enhancements to `StatefulSet`
become impossible. For example,
* Selective Pod upgrade and Pod deletion (when scale in). These features can be helpful
when Pods spread across different regions or fault domains.
* The ability of taking control over existing Pods with arbitrary names. There are
cases where Pod creation is done by one controller but Pod lifecycle management
is done by another controller.

We found that many containerized applications do not require the `Stateful` property
of fixing Pod names and `StatefulSet` is hard to be extended for those
applications in some cases. To fill the gap, Kruise is going to release a new controller
called `CloneSet` to manage the `Stateless` applications. In a nutshell, `CloneSet`
provides PVC support and enriched rollout strategies and management capabilities.
The following table roughly compares Advanced StatefulSet and CloneSet. More
details will be available when `CloneSet` is released (planned in
[M4 release](https://github.com/openkruise/kruise/projects)).

| Features   |     Advanced StatefulSet      |  CloneSet |
|----------|:-------------:|:------:|
| PVC | Yes | Yes |
| Pod name | Ordered | Random |
| Inplace upgrade | Yes | Yes |
| Max unavailable | Yes | Yes |
| Selective deletion | No | Yes |
| Selective upgrade | No | Yes |
| Seize existing Pod | No | Yes |

Certainly, Kruise will continue to improve `Advanced StatefulSet`. Had `CloneSet`
been ready, a clear recommendation to Kruise users would be if your
applications require fixed Pod names, go with `Advanced StatefulSet`. Otherwise,
`CloneSet` is the primary choice of **Set** -suffix controllers (if `DaemonSet` is not
applicable).

### Summary
Kruise aims to come up with intuitive names for new controllers. This post
provides additional guidance for Kruise users to pick the right controller for their
applications. Hope it helps!
