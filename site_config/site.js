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
        link: '/en-us/docs/what_is_openkruise.html'
      },
      {
        key: 'blog',
        text: 'BLOG',
        link: '/en-us/blog/index.html'
      },
      // {
      //   key: 'slack',
      //   text: 'SLACK',
      //   link:
      //     'https://join.slack.com/t/kruise-workspace/shared_invite/enQtNjU5NzQ0ODcyNjYzLWMzZDI5NTM3ZjM1MGY2Mjg1NzU4ZjBjMDJmNjZmZTEwYTZkMzk4ZTAzNmY5NTczODhkZDU2NzVhM2I2MzNmODc',
      //   target: '_blank'
      // }
    ],
    disclaimer: {
      title: 'Disclaimer',
      content: 'OpenKruise is an open-source project under Apache License 2.0.'
    },
    cloudNative: 'We are a <a href="https://www.cncf.io">Cloud Native Computing Foundation</a> sandbox project.',
    documentation: {
      title: 'Documentation',
      list: [
        {
          text: 'What is OpenKruise',
          link: '/en-us/docs/what_is_openkruise.html'
        },
        {
          text: 'Components',
          link: '/en-us/docs/components.html'
        },
        {
          text: 'Contribution',
          link: 'https://github.com/openkruise/kruise/blob/master/CONTRIBUTING.md'
        },
      ]
    },
    resources: {
      title: 'Resources',
      list: []
    },
    copyright: 'Copyright © 2021 The OpenKruise Authors. All rights reserved. The Linux Foundation has registered trademarks and uses trademarks. For a list of trademarks of The Linux Foundation, please see our Trademark Usage page: <a href="https://www.linuxfoundation.org/trademark-usage">https://www.linuxfoundation.org/trademark-usage</a>',
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
        link: '/zh-cn/docs/what_is_openkruise.html'
      },
      {
        key: 'blog',
        text: '博客',
        link: '/zh-cn/blog/index.html'
      },
      // {
      //   key: 'slack',
      //   text: 'SLACK',
      //   link:
      //     'https://join.slack.com/t/kruise-workspace/shared_invite/enQtNjU5NzQ0ODcyNjYzLWMzZDI5NTM3ZjM1MGY2Mjg1NzU4ZjBjMDJmNjZmZTEwYTZkMzk4ZTAzNmY5NTczODhkZDU2NzVhM2I2MzNmODc',
      //   target: '_blank'
      // }
    ],
    disclaimer: {
      title: 'Disclaimer',
      content: 'OpenKruise is an open-source project under Apache License 2.0.'
    },
    cloudNative: 'We are a <a href="https://www.cncf.io">Cloud Native Computing Foundation</a> sandbox project.',
    documentation: {
      title: '文档',
      list: [
        {
          text: 'OpenKruise 是什么',
          link: '/zh-cn/docs/what_is_openkruise.html'
        },
        {
          text: '组件',
          link: '/zh-cn/docs/components.html'
        },
        {
          text: '贡献指南',
          link: 'https://github.com/openkruise/kruise/blob/master/CONTRIBUTING.md'
        },
      ]
    },
    resources: {
      title: '资源',
      list: []
    },
    copyright: 'Copyright © 2021 The OpenKruise Authors. All rights reserved. The Linux Foundation has registered trademarks and uses trademarks. For a list of trademarks of The Linux Foundation, please see our Trademark Usage page: <a href="https://www.linuxfoundation.org/trademark-usage">https://www.linuxfoundation.org/trademark-usage</a>',
  }
};
