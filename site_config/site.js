// 全局的一些配置
export default {
  rootPath: '', // 发布到服务器的根目录，需以/开头但不能有尾/，如果只有/，请填写空字符串
  port: 8080, // 本地开发服务器的启动端口
  domain: 'openkruise.io', // 站点部署域名，无需协议和path等
  defaultSearch: 'google', // 默认搜索引擎，baidu或者google
  defaultLanguage: 'en-us',
  'en-us': {
    pageMenu: [
      {
        key: 'home', // 用作顶部菜单的选中
        text: 'HOME',
        link: '/en-us/index.html'
      },
      {
        key: 'docs',
        text: 'DOCS',
        link: 'https://github.com/openkruise/kruise/tree/master/docs'
			},
			{
        key: 'blog',
        text: 'Blog',
        link: '/en-us/blog/index.html'
      },
      {
        key: 'slack',
        text: 'SLACK',
        link:
          'https://join.slack.com/t/kruise-workspace/shared_invite/enQtNjU5NzQ0ODcyNjYzLWMzZDI5NTM3ZjM1MGY2Mjg1NzU4ZjBjMDJmNjZmZTEwYTZkMzk4ZTAzNmY5NTczODhkZDU2NzVhM2I2MzNmODc',
        target: '_blank'
      }
    ],
    disclaimer: {
      title: 'Disclaimer',
      content: 'OpenKruise is an open-source project under Apache License 2.0.'
    },
    documentation: {
      title: 'Documentation',
      list: [
        {
          text: 'Overview',
          link: 'https://github.com/openkruise/kruise/tree/master/docs'
        },
        {
          text: 'Tutorial',
          link: 'https://github.com/openkruise/kruise/tree/master/docs/tutorial'
        },
        {
          text: 'Concepts',
          link: 'https://github.com/openkruise/kruise/tree/master/docs/concepts'
        }
        // {
        //   text: 'Developer guide',
        //   link: '/en-us/docs/dir/demo3.html',
        // },
      ]
    },
    resources: {
      title: 'Resources',
      list: []
    },
    copyright: 'Copyright © 2019 The OpenKruise Authors, The Kubernetes Authors'
  },
  'zh-cn': {
    pageMenu: [
      {
        key: 'home',
        text: '首页',
        link: '/zh-cn/index.html'
      },
      {
        key: 'docs',
        text: '文档',
        link: 'https://github.com/openkruise/kruise/tree/master/docs'
			},
			{
        key: 'blog',
        text: '博客',
        link: '/zh-cn/blog/index.html'
      },
      {
        key: 'slack',
        text: 'SLACK',
        link:
          'https://join.slack.com/t/kruise-workspace/shared_invite/enQtNjU5NzQ0ODcyNjYzLWMzZDI5NTM3ZjM1MGY2Mjg1NzU4ZjBjMDJmNjZmZTEwYTZkMzk4ZTAzNmY5NTczODhkZDU2NzVhM2I2MzNmODc',
        target: '_blank'
      }
    ],
    disclaimer: {
      title: 'Disclaimer',
      content: 'OpenKruise is an open-source project under Apache License 2.0.'
    },
    documentation: {
      title: '文档',
      list: [
        {
          text: '概览',
          link: 'https://github.com/openkruise/kruise/tree/master/docs'
        },
        {
          text: '快速开始',
          link: 'https://github.com/openkruise/kruise/tree/master/docs/tutorial'
        }
        // {
        //   text: '开发者指南',
        //   link: '/zh-cn/docs/contribution/contribution-guideline.html',
        // },
      ]
    },
    resources: {
      title: '资源',
      list: []
    },
    copyright: 'Copyright © 2019 The OpenKruise Authors, The Kubernetes Authors'
  }
};
