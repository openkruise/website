## Getting started

### Install with YAML files

##### Install CRDs

```
kubectl apply -f https://raw.githubusercontent.com/kruiseio/kruise/master/config/crds/apps_v1alpha1_broadcastjob.yaml
kubectl apply -f https://raw.githubusercontent.com/kruiseio/kruise/master/config/crds/apps_v1alpha1_sidecarset.yaml
kubectl apply -f https://raw.githubusercontent.com/kruiseio/kruise/master/config/crds/apps_v1alpha1_statefulset.yaml
```
Note that ALL three CRDs need to be installed for kruise-controller to run properly.

##### Install kruise-controller-manager

`kubectl apply -f https://raw.githubusercontent.com/kruiseio/kruise/master/config/manager/all_in_one.yaml`

Or run from the repo root directory:

`kustomize build config/default | kubectl apply -f -`

To Install Kustomize, check kustomize [website](https://github.com/kubernetes-sigs/kustomize).

Note that use Kustomize 1.0.11. Version 2.0.3 has compatibility issues with kube-builder

The official kruise-controller-manager image is hosted under [docker hub](https://hub.docker.com/r/openkruise/kruise-manager).

## Usage examples

### Advanced StatefulSet
```yaml
apiVersion: apps.kruise.io/v1alpha1
kind: StatefulSet
metadata:
  name: sample
spec:
  replicas: 3
  serviceName: fake-service
  selector:
    matchLabels:
      app: sample
  template:
    metadata:
      labels:
        app: sample
    spec:
      readinessGates:
      - conditionType: InPlaceUpdateReady # A new condition that ensures the pod reamin at NotReady state while the in-place update is happening
      containers:
      - name: main
        image: nginx:alpine
  updateStrategy:
    type: RollingUpdate
    rollingUpdate:
      podUpdatePolicy: InPlaceIfPossible
```
### Broadcast Job
Run a BroadcastJob that each Pod computes pi, with `ttlSecondsAfterFinished` set to 30. The job
will be deleted in 30 seconds after the job is finished.

```yaml
apiVersion: apps.kruise.io/v1alpha1
kind: BroadcastJob
metadata:
  name: broadcastjob-ttl
spec:
  template:
    spec:
      containers:
        - name: pi
          image: perl
          command: ["perl",  "-Mbignum=bpi", "-wle", "print bpi(2000)"]
      restartPolicy: Never
  completionPolicy:
    type: Always
    ttlSecondsAfterFinished: 30
```
### SidecarSet

The yaml file below describes a SidecarSet that contains a sidecar container named `sidecar1`

```yaml
# sidecarset.yaml
apiVersion: apps.kruise.io/v1alpha1
kind: SidecarSet
metadata:
  name: test-sidecarset
spec:
  selector: # select the pods to be injected with sidecar containers
    matchLabels:
      app: nginx
  containers:
  - name: sidecar1
    image: centos:7
    command: ["sleep", "999d"] # do nothing at all 
```

