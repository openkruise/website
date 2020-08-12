export default {
  'zh-cn': {
    brand: {
      brandName: 'OpenKruise',
      briefIntroduction: '面向自动化场景的 Kubernetes 应用负载扩展控制器',
      buttons: [
        {
          text: '快速开始',
          link: '/zh-cn/docs/quick_start.html',
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
      desc: 'Kruise是OpenKruise项目的核心。它是一组控制器，可在应用程序工作负载管理上扩展和补充Kubernetes核心控制器。',
      img: '/img/kruise-overall.png',
    },
    functions: {
      title: '',
      list: []	    
    },  
    features: {
      title: '',
      list: []
    }
  },
  'en-us': {
    brand: {
      brandName: 'OpenKruise',
      briefIntroduction: 'A Kubernetes automation suite for workload management',
      buttons: [
        {
          text: 'GET STARTED',
          link: '/en-us/docs/quick_start.html',
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
      desc: 'OpenKruise is a suite that provides workload automation solutions in Kubernetes. It fixes the gap between Kubernetes upstream controllers and the real production requirements. ' +
	    'It is built primarily based on Kubernetes CRD extensions. There are two major categories that OpenKruise ' +
	    'offers: workload management and controller management. The kruise repo collects all useful workload controllers ' +
	    'and the platform repo provides a framework to manage multiple controllers in the aspects of upgrading, sharding, tooling, monitoring etc (to be released). ',
      img: '/img/kruise-overall.png',
    },
    functions: {
      title: 'Highlights (many more in Github)',
      list: [
         {
            img: '/img/inplace.png',
            title: 'Inplace Update',
            content: 'It is a new methodology to update container image. Unlike the Pod recreation based container image update methodology used in Deployment and StatefulSet, inplace update only restarts the specific container with the new image and the Pod is not recreated. It leads to much faster update process and much less side effects to other sub-systems such as scheduler, CNI or CSI.',
         },
         {
            img: '/img/sidecar.png',
            title: 'Sidecar Container Management',
            content: 'Sidecar containers are defined in a new Custom Resource (CR). Kruise controller will inject them into all matching Pods during Pod creation. Besides that, the sidecar container images can also be inplace updated through updating the container Spec in the CR. The ability of separating main container management and sidecar container management greatly eases the developer collaborations.'
         },
	 {
	    img: '/img/united.png',
	    title: 'Multi-Domain Deployment',
            content: 'UnitedDeployment is a new Custom Resource Definition (CRD) used to achieve high availability in a cluster that consists of multiple domains. It manages multiple homogeneous workloads, and each workload is dedicated to a single domain. Pod distribution across domains is determined by the replica number of each workload. A domain, identified by node label, can be an availability zone (AZ) or a group of homogeneous nodes.',
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
		  'Used in production already, managing tens of thousands Pods',
		  'Support large scale cluster with thousands of nodes',
	    ],
         },
         {
            img: '/img/feature_easy_to_use.png',
            title: 'Easy to use',
            content: [
		  'Easy install/uninstall',
		  'Selective controller installation'  
	    ],
         },
         {
            img: '/img/feature_rich.png',
            title: 'Rich set of strategies',
            content: [
		  'Selective Pod upgrade/deletion',
		  'Upgrade sequence management',
		  'Graceful Pod offline during upgrade',  
	    ],
         },
	      
      ],
    },
  },
};
