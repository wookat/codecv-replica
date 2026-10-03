interface NavItem {
  name: string
  path: string
  tooltip: boolean
  badge?: string
  external?: boolean
}

const homeNav: NavItem[] = [
  {
    name: '首页',
    path: '/home',
    tooltip: false
  },
  {
    name: '模板中心',
    path: '/jianlimoban',
    tooltip: false
  },
  {
    name: '我的简历',
    path: '/profile',
    tooltip: false
  },
  {
    name: '面经',
    path: '/mianjing',
    badge: 'NEW',
    tooltip: false
  },
  {
    name: '求职攻略',
    path: '/strategy',
    tooltip: false
  },
  {
    name: 'AI笔试面试',
    path: 'https://www.offerstar.cn',
    external: true,
    tooltip: false
  },
  {
    name: '校招信息汇总',
    path: '/jobs',
    tooltip: false
  }
]

const homeOutNav: { name: string; path: string; icon: string; color?: string }[] = [
  {
    name: 'GitHub',
    path: 'https://github.com/acmenlei/codecv',
    icon: 'iconfont icon-github'
  }
]
export { homeNav, homeOutNav }
