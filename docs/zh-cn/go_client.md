---
title: Golang 客户端
---
# Golang client

如果要在一个 Golang 项目中对 OpenKruise 的资源做 create/get/update/delete 这些操作、或者通过 informer 做 list-watch，你需要一个支持 OpenKruise 的 client。

尽管 Kruise 在 [pkg/client](https://github.com/openkruise/kruise/tree/master/pkg/client) 目录中已经生成了一些 clientset/informers/listers 工具，但我们强烈不推荐用户使用这些。因为如果把整个 Kruise 仓库引入到你的项目中，可能会导致 go mod 依赖非常复杂，有些还会关系到 K8s 依赖版本问题。

我们推荐用户只使用 [kruise-api](https://github.com/openkruise/kruise-api) 仓库，它只包含了 Kruise 中自定义资源的 API schema 定义。

[kruise-api](https://github.com/openkruise/kruise-api) 专门用来放置 Kruise APi 定义，它是从 `https://github.com/openkruise/kruise/tree/master/pkg/apis` 中同步过来的。所有的代码改动都是在后者里提交的，前者是只读的仓库。

## 使用方式

[controller-runtime](https://github.com/kubernetes-sigs/controller-runtime) 是最好的使用 `kruise-api` 的方式：

- 如果你的项目是通过 [kubebuilder](https://github.com/kubernetes-sigs/kubebuilder) 或 [operator-sdk](https://github.com/operator-framework/operator-sdk) 生成的，表明你已经使用了 `controller-runtime`。
- 否则，你需要将它和 kruise-api 一起加入到你的 `go.mod` 中。

### 1. 添加 kruise scheme

```go
import kruiseapps "github.com/openkruise/kruise-api/apps/v1alpha1"

// ...
_ = kruiseapps.AddToScheme(scheme)
```

### 2. 生成 client

这一步在你直接使用 controller-runtime client 的时候才需要。

如果你的项目是通过 [kubebuilder](https://github.com/kubernetes-sigs/kubebuilder) 或 [operator-sdk](https://github.com/operator-framework/operator-sdk) 生成的，你应该直接用 `mgr.GetClient()` 来获取 client，就不需要以下这个步骤了。

```go
import "sigs.k8s.io/controller-runtime/pkg/client"

apiClient, err := client.New(c, client.Options{Scheme: scheme})
```

### 3. Get/List

```go
import (
    kruiseapps "github.com/openkruise/kruise-api/apps/v1alpha1"
    "sigs.k8s.io/controller-runtime/pkg/client"
)

cloneSet := kruiseapps.CloneSet{}
err = apiClient.Get(context.TODO(), types.NamespacedName{Namespace: namespace, Name: name}, &cloneSet)

cloneSetList := kruiseapps.CloneSetList{}
err = apiClient.List(context.TODO(), &cloneSetList, client.InNamespace(instance.Namespace))
```

### 4. Create/Update/Delete

创建一个 CloneSet：

```go
import kruiseapps "github.com/openkruise/kruise-api/apps/v1alpha1"

cloneSet := kruiseapps.CloneSet{
    // ...
}
err = apiClient.Create(context.TODO(), &cloneSet)
```

基于一个存量的 CloneSet 来更新：

```go
import kruiseapps "github.com/openkruise/kruise-api/apps/v1alpha1"

// Get first
cloneSet := kruiseapps.CloneSet{}
if err = apiClient.Get(context.TODO(), types.NamespacedName{Namespace: namespace, Name: name}, &cloneSet); err != nil {
    return err
}

// Modify object, such as replicas or template
cloneSet.Spec.Replicas = utilpointer.Int32Ptr(5)

// Update
// This might get conflict, should retry it
if err = apiClient.Update(context.TODO(), &cloneSet); err != nil {
    return err
}
```

### 5. List watch and informer

如果你的项目是通过 [kubebuilder](https://github.com/kubernetes-sigs/kubebuilder) 或 [operator-sdk](https://github.com/operator-framework/operator-sdk) 生成的，并且使用了 `mgr.GetClient()`，那么当你使用 `Get`/`List` 这些操作时就已经是从 informer 中查询了，而不是调用的 kube-apiserver。
