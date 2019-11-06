export default {
  'zh-cn': {
    brand: {
      brandName: 'OpenKruise',
      briefIntroduction: '一组可在应用程序工作负载管理上扩展和补充Kubernetes核心控制器。',
      buttons: [
        {
          text: '快速开始',
          link: 'https://github.com/openkruise/kruise/tree/master/docs/tutorial',
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
          link: 'https://github.com/openkruise/kruise/tree/master/docs/tutorial',
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
      title: 'What is OpenKruise',
      desc: 'OpenKruise is a suite that provides multiple solutions to automate cloud native applications in Kubernetes.' +
	    'It is built primarily based on Kubernetes CRD extensions. There are three major categories that OpenKruise ' +
	    'is going to focus on : workload management, autoscaling and QoS. As shown in the figure, we use code name Kruise to ' +
	    'represent all the workload controllers that OpenKruise provides. As name suggests, we expect Kruise is going to be the ' +
	    'core of OpenKruise. Kruise is currently released with three initial controllers. Please check the documentation ' +
	    'for details. We are going to release the controllers for autoscaling and QoS soon, stay tuned!',
      img: '/img/kruise-overall.png',
    },
    features: {
      title: '',
      list: []
    }
  },
};
