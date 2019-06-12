export default {
  'zh-cn': {
    brand: {
      brandName: 'OpenKruise',
      briefIntroduction: '一组可在应用程序工作负载管理上扩展和补充Kubernetes核心控制器。',
      buttons: [
        {
          text: '快速开始',
          link: '/zh-cn/docs/quick-start.html',
          type: 'primary',
        },
        {
          text: 'GitHub',
          link: 'https://github.com/openkruise/kruise',
          type: 'normal',
        },
      ],
    },
    introduction: {
      title: 'OpenKruise是什么',
      desc: 'Kruise是OpenKruise项目的核心。它是一组控制器，可在应用程序工作负载管理上扩展和补充Kubernetes核心控制器。',
      img: '/img/sentinel-flow-index-overview-cn.jpg',
    },
    features: {
      title: '特性一览',
      list: [
        {
          icon: 'feature-1',
          title: '微服务框架支持',
          content: '目前已支持 Dubbo 和 Spring Cloud 微服务框架，其他微服务框架持续集成中',
        },
        {
          icon: 'feature-2',
          title: '数据库支持',
          content: '已支持 MySQL 自动模式, Oracle、PostgreSQL、H2 开发中',
        },
        {
          icon: 'feature-3',
          title: 'TCC 模式（开发中）',
          content: '支持 用户自定义 TCC 接口模式并可与 AT 混用',
        },
        {
          icon: 'feature-4',
          title: 'XA 模式（开发中）',
          content: '支持已实现 XA 接口的数据库的 XA 模式',
        },
        {
          icon: 'feature-5',
          title: '动态伸缩',
          content: 'TBD',
        },
        {
          icon: 'feature-6',
          title: '高可用',
          content: 'TBD',
        },
      ],
    },
  },
  'en-us': {
    brand: {
      brandName: 'Sentinel',
      briefIntroduction: 'A set of controllers which extends and complements Kubernetes core controllers on application workload management',
      buttons: [
        {
          text: 'GET STARTED',
          link: '/en-us/docs/quick-start.html',
          type: 'primary',
        },
        {
          text: 'GITHUB',
          link: 'https://github.com/openkruise/kruise',
          type: 'normal',
        },
      ],
    },
    introduction: {
      title: 'What is OpenKruise',
      desc: 'Kruise is at the core of the OpenKruise project. It is a set of controllers which extends and complements Kubernetes core controllers on application workload management.',
      img: '/img/sentinel-flow-index-overview-en.jpg',
    },
    features: {
      title: 'Feature List',
      list: [
        {
          icon: 'feature-1',
          title: 'Scalability',
          content: 'Brokers, producers, consumers, and name servers adopt special deployment and processing methods that bring strong scale-out ability. ',
        },
        {
          icon: 'feature-2',
          title: 'Distributed transaction',
          content: 'Fescar implements a function similar to distributed transaction processing of X/Open XA, which allows multiple resources to be accessed within the same transaction.',
        },
        {
          icon: 'feature-3',
          title: 'Cache and Cache Maintenance',
          content: 'Fescar makes the best use of system memory cache to maintain data to the file system through flushing either synchronously or asynchronously.',
        },
        {
          icon: 'feature-4',
          title: 'Message filtering',
          content: 'Apache Fescar supports flexible syntax expressions to filter messages, which reduces transmission of useless messages to consumers.',
        },
        {
          icon: 'feature-5',
          title: 'Consumer offset',
          content: 'Based on the message storage model of Apache Fescar, consumer offset can be reset by the time, accurate to a millisecond. Messages can be re-consumed from the earliest offset and the latest offset.',
        },
        {
          icon: 'feature-6',
          title: 'Timed messaging',
          content: 'Apache Fescar supports timed messaging, but the time precision has specific levels. ',
        },
      ]
    },
  },
};
