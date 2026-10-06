// 生产编辑器顶栏导航（appConfig header.editor + 静态项，逐项对齐）
const nav = [
  {
    name: '导入简历',
    file: true,
    tip: '导入上次编写的MD'
  },
  {
    name: '简历模板',
    path: '/jianlimoban'
  },
  {
    name: '使用教程',
    tutor: true
  },
  {
    name: '证件照制作',
    path: 'https://www.quzuotu.com/idphoto/guide',
    external: true
  },
  {
    name: '面经',
    path: '/mianjing'
  },
  {
    name: '网申助手',
    path: 'https://assist.codecvcv.com?utm_source=codecv_nav',
    external: true,
    hot: true
  },
  {
    name: '秋招岗位汇总',
    path: '/jobs',
    hot: true
  },
  {
    name: 'AI助手',
    act: 'ai',
    hot: true
  }
]

export default nav
