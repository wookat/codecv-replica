import Layout from '@/layout/main.vue'

export default {
  name: 'editor',
  path: '/editor',
  component: Layout,
  children: [
    {
      path: '/editor',
      name: 'editor',
      component: () => import('@/views/editor/editor.vue')
    },
    {
      // 兼容 /editor/<type> 深链（使用模板等入口均按此跳转）
      path: '/editor/:type',
      redirect: (to: any) => ({ path: '/editor', query: { type: to.params.type } })
    }
  ]
}
