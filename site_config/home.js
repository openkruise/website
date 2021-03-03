import React from 'react';

export default {
  title: 'OpenKruise',
  'zh-cn': {
    brand: {
      brandName: 'OpenKruise',
      briefIntroduction: '面向应用自动化场景的 Kubernetes 扩展套件',
      buttons: [
        {
          text: '快速开始',
          link: '/zh-cn/docs/installation.html',
          type: 'primary',
        },
        {
          text: 'GitHub',
          link: 'https://github.com/openkruise/kruise',
          type: 'normal',
          target: '_blank',
        },
      ],
    },
    introduction: {
      title: 'OpenKruise是什么',
      desc: 'OpenKruise 是一组 Kubernetes 之上的套件，提供了面向云原生应用的自动化能力，' +
          '包括多种面向无状态、有状态应用、Sidecar管理方面的工作负载，以及镜像预热等扩展功能。',
      img: '/img/kruise-overall.png',
    },
    functions: {
      title: '亮点 (更多内容见 Github)',
      list: [
        {
          img: '/img/inplace.png',
          title: '原地升级',
          content: '这是一种新的更新容器镜像的方法，与 Deployment 和 StatefulSet 中 Pod 重建升级的方法不同，原地升级只是用新镜像重新启动特定的容器，并不会重新创建 Pod。这使得更新速度更快，对其他子系统（如调度器、CNI 或 CSI）的影响也更小。',
        },
        {
          img: '/img/sidecar.png',
          title: 'Sidecar 容器管理',
          content: '支持在一个单独的 CR 中定义 Sidecar 容器，Kruise 控制器将在创建 Pod 时把它们注入到所有符合条件的 Pod 中。除此之外，通过更新 CR 中的 container Spec ，也可以在原地升级 Sidecar 容器镜像。主容器管理和 Sidecar 容器管理的分离，极大地简化了开发者的合作。',
        },
        {
          img: '/img/united.png',
          title: '多区域部署',
          content: 'UnitedDeployment 是一种新的 CRD，用于在由多个区域组成的集群中实现高可用部署。它管理多个同类的工作负载，每个工作负载都专用于一个区域。跨域的 Pod 分配由每个工作负载的副本数决定。由节点标签标识的域可以是一个可用区（AZ）或一组同类节点。'
        },
      ],
    },
    features: {
      title: 'OpenKruise 特性一览',
      list: [
        {
          img: '/img/feature_adaptable.png',
          title: '原生 Kubernetes',
          content: [
            '使用 CRDs 进行拓展',
            '支持 Stateful/Stateless/Job Workloads 和各类 Operators',
          ],
        },
        {
          img: '/img/feature_production_grade.png',
          title: '生产级别可用',
          content: [
            '在生产环境用于管理数以万计的 Pod',
            '支持具有数千个节点的大规模集群',
          ],
        },
        {
          img: '/img/feature_easy_to_use.png',
          title: '简单易用',
          content: [
            '安装/卸载 简单',
            '安装 feature-gate 可选'
          ],
        },
        {
          img: '/img/feature_rich.png',
          title: '策略丰富',
          content: [
            '可以指定 Pod 升级/删除',
            '可以管理升级顺序',
            '升级期间 Pod 优雅离线'
          ],
        },
      ],
    },
    users: {
      title: 'OpenKruise 用户登记',
      desc: <span>请提交您的信息到 <a rel="noopener noreferrer" target="_blank" href="https://github.com/openkruise/kruise/issues/289"> ISSUE：如果贵司正在使用 Kruise 请留言</a> 来帮助我们改进项目。</span>,
      list: [],
    },
  },
  'en-us': {
    brand: {
      brandName: 'OpenKruise',
      briefIntroduction: 'A Kubernetes extended suite for application automations',
      buttons: [
        {
          text: 'GET STARTED',
          link: '/en-us/docs/installation.html',
          type: 'primary',
        },
        {
          text: 'GITHUB',
          link: 'https://github.com/openkruise/kruise',
          type: 'normal',
          target: '_blank',
        },
      ],
    },
    introduction: {
      title: 'Introduction',
      desc: 'OpenKruise is a suite that provides application automations in Kubernetes. ' +
          'It complements the popular upstream workload controllers by ' +
        'supporting new capabilities based on real production requirements. ' +
        'There are two major categories that OpenKruise ' +
        'focuses on: workload management and controller management. The kruise repo collects all supported workload controllers. ' +
        'They are built primarily based on Kubernetes CRD extensions. ' +
        'The platform repo provides a framework to manage multiple controllers in the aspects of upgrading, sharding, tooling, monitoring etc (to be released). ',
      img: '/img/kruise-overall.png',
    },
    functions: {
      title: 'Highlights (many more in Github)',
      list: [
        {
          img: '/img/inplace.png',
          title: 'Inplace Update',
          content: 'It is a new methodology to update container image. Unlike the Pod recreation based container image update methodology used in Deployment and StatefulSet, inplace update only restarts the specific container with the new image and the Pod will not be recreated. It leads to much faster update process and much less side effects on other sub-systems such as scheduler, CNI or CSI.',
        },
        {
          img: '/img/sidecar.png',
          title: 'Sidecar Container Management',
          content: 'Sidecar containers are defined in a new Custom Resource (CR). Kruise controller will inject them into all matching Pods during Pod creation. Besides that, the sidecar container images can also be inplace updated through updating the container Spec in the CR. The ability of separating main container management and sidecar container management greatly eases the developer collaborations.'
        },
        {
          img: '/img/united.png',
          title: 'Multi-Domain Deployment',
          content: 'UnitedDeployment is a new Custom Resource Definition (CRD) used to achieve high availability in a cluster that consists of multiple domains. It manages multiple homogeneous workloads, and each workload is dedicated to a single domain. Pod distribution across domains is determined by the replica number of each workload. A domain, identified by a node label, can be an availability zone (AZ) or a group of homogeneous nodes.',
        },
      ],
    },
    features: {
      title: 'Why OpenKruise',
      list: [
        {
          img: '/img/feature_adaptable.png',
          title: 'Kubernetes native',
          content: [
            'Leverage CRDs for extension',
            'Support Stateful/Stateless/Job workloads and various operators',
          ],
        },
        {
          img: '/img/feature_production_grade.png',
          title: 'Production grade',
          content: [
            'Used in production managing tens of thousands Pods',
            'Support large scale clusters with thousands of nodes',
          ],
        },
        {
          img: '/img/feature_easy_to_use.png',
          title: 'Easy to use',
          content: [
            'Easy install/uninstall',
            'Selective feature-gate installation'
          ],
        },
        {
          img: '/img/feature_rich.png',
          title: 'Rich set of management strategies',
          content: [
            'Selective Pod upgrade/deletion',
            'Upgrade sequence management',
            'Graceful Pod offline during upgrade',
          ],
        },
      ],
    },
    users: {
      title: 'Who is using OpenKruise',
      desc: <span>Please provide your information on <a rel="noopener noreferrer" target="_blank" href="https://github.com/openkruise/kruise/issues/289"> Wanted: who is using openkruise</a> to help improving the project.</span>,
      list: [],
    },
  },
};
