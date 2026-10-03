import { RouteRecordRaw, createRouter, createWebHashHistory } from 'vue-router'

/* 统一导入路由 */
const routeFiles = import.meta.glob('./modules/*.ts', { eager: true })
export const routeConfiguras: RouteRecordRaw[] = []

Object.keys(routeFiles).forEach(routeModule => {
  ;(routeFiles[routeModule] as any).default &&
    routeConfiguras.push((routeFiles[routeModule] as any).default)
})

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    redirect: '/home'
  },
  {
    path: '/download',
    name: 'download',
    component: () => import('@/views/download/index.vue')
  },
  {
    // 复刻线上版分类落地页，须位于具名路由之后、NotFound 之前
    path: '/:templateCategory',
    name: 'template-category',
    component: () => import('@/views/jianlimoban/category.vue')
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'NotFound',
    component: () => import('@/views/404/index.vue')
  }
]

const topInitList = ['/community/detail', '/syntax/helper', '/update/line', '/home', '/editor']

const router = createRouter({
  routes: routeConfiguras.concat(routes),
  history: createWebHashHistory(),
  scrollBehavior: (to, from, savePos) => {
    if (topInitList.includes(to.path)) return { top: 0 /*  behavior: 'smooth' */ }
    if (savePos) return savePos
  }
})

export default router
