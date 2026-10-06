const nav = [
  {
    name: '导入简历',
    multiple: true,
    children: ['导入MD', '打印']
  },
  {
    name: '简历模板',
    path: '/jianlimoban',
    tooltip: false
  },
  {
    name: '使用教程',
    path: '/strategy',
    tooltip: false
  },
  {
    name: '证件照制作',
    path: '/jianlimoban?tag=证件照',
    tooltip: false
  },
  {
    name: '面经',
    path: '/mianjing',
    tooltip: false
  },
  {
    name: '网申助手',
    path: 'https://assist.codecvcv.com?utm_source=codecv_nav',
    external: true,
    hot: true,
    tooltip: false
  },
  {
    name: '秋招岗位汇总',
    path: '/jobs',
    hot: true,
    tooltip: false
  }
]

export default nav
