---
title: UnitedDeploymemt - Supporting Multi-domain Workload Management
keywords: Kubernetes, controller
description: 
---

# UnitedDeploymemt - Supporting Multi-domain Workload Management
By FEI GUO (Alibaba), NOVEMBER 20 2019, 6 MINUTE READ

Ironically, probably every cloud user knew (or should realized that) failures in Cloud resources
are inevitable. Hence, high availability is probably one of the most desirable features that
Cloud Provider offers to cloud users. For example, in AWS, each geographic region has 
multiple isolated locations known as Availability Zones (AZs). 
AWS provides various AZ-aware solutions to allow the compute or storage resources of the user
applications to be distributed across multiple AZs in order to tolerate AZ failure, which indeed
happened in the past. 

In Kubernetes, the concept of AZ is not realized by an API object. Instead,
an AZ is usually represented by a set of hosts that have the same location label.
Although hosts within the same AZ can be identified by labels, the capability of distributing Pods across
multiple AZs was missing in Kubernetes default scheduler. Hence it was difficult to use single 
`StatefulSet` or `Deployment` to perform  AZ-aware workload management. Fortunately, 
in Kubernetes 1.16, a new feature called ["Pod Topology Spread Constraints"](https://kubernetes.io/docs/concepts/workloads/pods/pod-topology-spread-constraints/)
was invented. Users now can add new constraints in the Pod Spec to ensure the Pods of an 
application can be evenly distributed across failure domains such as AZs, regions or nodes.

In Kruise, **UnitedDeploymemt** provides an alternative to achieve high availability in
a cluster that spans over multiple fault domains - that is, managing multiple homogeneous 
workloads each manage Pods within a single `Subset`. Pod distribution across AZs are
determined by the replica number of each workload. 
Since each `Subset` is associated with a workload, UnitedDeployment can support
finer-grained rollout and deployment strategies. 
In addition, it can be further extended to support managing 
an application across multiple clusters! Let us reveal how UnitedDeployment is designed.


## Using `Subsets` to describe domain topology

UnitedDeploymemt uses `Subset` to represent a failure domain. `Subset` API
primarily specifies the nodes that forms the domain and the number of replicas run
in this domain. UnitedDeploymemt manages subset workloads against a
specific domain topology, described by a `Subset` array.

```
type Topology struct {
	// Contains the details of each subset.
	Subsets []Subset
}

// Subset defines the detail of a subset.
type Subset struct {
	// Indicates the name of this subset, which will be used to generate
	// subset workload name in the format '<uniteddeployment-name>-<subset-name>'.
	Name string

	// Indicates the node select strategy to form the subset.
	NodeSelector corev1.NodeSelector

	// Indicates the number of the subset replicas or percentage of it on the
	// UnitedDeployment replicas.
	// If nil, the number of replicas in this subset is determined by controller.
	Replicas *intstr.IntOrString
}
```

The specification of the subset workload is specified in `Spec.Template`. UnitedDeployment
only supports `StatefulSet` subset workload as of now. An interesting use case of `Subset`
is that now user can specify **customized Pod distribution** across AZs, which is not
necessarily a uniform distribution in some cases. For example, if the AZ
utilization or capacity are not homogeneous, evenly distributing Pods may lead to Pod deployment
failure due to lack of resources. If users have prior knowledge about AZ resource capacity/usage,
UnitedDeployment can help to apply an optimal Pod distribution for a high Pod deployment
success rate. Of course, if not specified, a uniform Pod distribution will be applied to
maximize availability.

## Customized subset rollout `Partitions`

User can update all the UnitedDeployment subset workloads by providing a
new version of subset workload template.
Similar to other Kruise controllers, UnitedDeployment controller does not orchestrate
the rollout process of all subset workloads, which is typically done by another rollout
controller built on top of it. To help a rollout controller to realize flexible rollout plans
like canary or batch release, UnitedDeployment provides `ManualUpdate` strategy
which allows user to specify the individual rollout `partition` of each subset workload.

```
type UnitedDeploymentUpdateStrategy struct {
	// Type of UnitedDeployment update.
	Type UpdateStrategyType
	// Indicate the partition of each subset.
	ManualUpdate *ManualUpdate
}

// ManualUpdate is a update strategy which allow users to provide the partition
// of each subset.
type ManualUpdate struct {
	// Indicates number of subset partition.
	Partitions map[string]int32
}
```

Now, it is fairly easy to implement subset-grained canary roll out for application
whose instances spread over multiple subsets.

## Multi-Cluster application management (In future)

UnitedDeployment can potentially be extended to support multi-cluster workload
management with additional API support. The idea is that `Subset` can not only
be used to specify a domain within the cluster, but also be used to specify
a domain in another cluster. More specifically, a domain topology also includes
a `ClusterRegistryQuerySpec`, which describes the clusters that UnitedDeployment
may access. The cluster CRs are managed by a ClusterRegistry controller that
implements the Kubernetes [cluster registry API](https://github.com/kubernetes/cluster-registry).

```
type Topology struct {
  // ClusterRegistryQuerySpec is used to find the all the clusters that
  // the workload may be deployed to. 
  ClusterRegistry *ClusterRegistryQuerySpec
  // Contains the details of each subset including the target cluster name and
  // the node selector in target cluster.
  Subsets []Subset
}

type ClusterRegistryQuerySpec struct {
  // Namespaces that the cluster CRDs reside.
  // If not specified, default namespace is used.
  Namespaces []string
  // Selector is the label matcher to find all qualified clusters.
  Selector   map[string]string
  // Describe the kind and APIversion of the cluster object
  ClusterType metav1.TypeMeta
}

type Subset struct {
  // Indicate the name of this subset, which will be used to generate 
  // subset workload name in the format '<deployment-name>-<subset-name>'
  Name string
    
  // The name of target cluster. The controller will validate that
  // the TargetCluster exits based on Topology.ClusterRegistry.
  TargetCluster *TargetCluster

  // Indicate the node select strategy in the Subset.TargetCluster.
  // If Subset.TargetCluster is not set, node selector strategy refers to
  // current cluster. 
  NodeSelector corev1.NodeSelector

  // Indicate the number of pod replicas of this subset.
  // If nil, the number of replicas in this subset is determined by controller.
  Replicas *intstr.IntOrString 
}

type TargetCluster struct {
  // Namespace of the target cluster CRD
  Namespace string
  // Target cluster name
  Name string
}
```
A new `TargetCluster` field is added to the `Subset` API. If it presents, the
`NodeSelector` indicates the node selection logic in the target cluster. Now
UnitedDeployment controller can distribute application Pods to multiple clusters by
instantiating a `StatefulSet` workload in each target cluster with a specific
replica number, as illustrated in Figure1.

![multi-cluster	controller](/img/uniteddeployment.png)

At a first glance, UnitedDeployment looks more like a federation
controller under [Kubefed](https://github.com/kubernetes-sigs/kubefed), but it isn't.
The fundamental difference is that Kubefed focuses on propagating arbitrary
types to remote clusters instead of managing an application across clusters. 
In this example, had Kubefed been used, each `StatefulSet` workload in individual
cluster would have a replica of 100. With customized `Partition` support as described
above, cluster-grained application canary roll can be easily achieved by a rollout
controller.


## Summary

This blog post introduces UnitedDeployment, a new workload which helps managing 
application spread over multiple domains (in arbitrary clusters). By reading this post,
I wish readers would understand that UnitedDeployment does more than just evenly
distributing Pods over AZs, which can be done more efficiently by using the new Pod
Topology Spread Constraint APIs in Kubernetes 1.16 if it is the only user concern.





