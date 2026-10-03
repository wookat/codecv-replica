import Layout from '@/layout/main.vue'

/* 复刻线上版页面路由（/:templateCategory 单独挂在 index.ts 末尾防止遮蔽） */
export default {
  name: 'replica',
  path: '/replica-root',
  component: Layout,
  children: [
    {
      path: '/jianlimoban',
      name: 'jianlimoban',
      component: () => import('@/views/jianlimoban/index.vue')
    },
    {
      path: '/jianlimoban/:type',
      name: 'jianlimoban-type',
      component: () => import('@/views/jianlimoban/detail.vue')
    },
    { path: '/mianjing', name: 'mianjing', component: () => import('@/views/mianjing/index.vue') },
    {
      path: '/mianjing/activity',
      name: 'mianjing-activity',
      component: () => import('@/views/mianjing/activity.vue')
    },
    {
      path: '/mianjing/write',
      name: 'mianjing-write',
      component: () => import('@/views/mianjing/write.vue')
    },
    {
      path: '/mianjing/mine',
      name: 'mianjing-mine',
      component: () => import('@/views/mianjing/mine.vue')
    },
    {
      path: '/mianjing/c/:slug',
      name: 'mianjing-company',
      component: () => import('@/views/mianjing/company.vue')
    },
    {
      path: '/mianjing/c/:slug/:combo',
      name: 'mianjing-company-combo',
      component: () => import('@/views/mianjing/company.vue')
    },
    {
      path: '/mianjing/t/:slug',
      name: 'mianjing-topic',
      component: () => import('@/views/mianjing/topic.vue')
    },
    {
      path: '/mianjing/p/:docId',
      name: 'mianjing-detail',
      component: () => import('@/views/mianjing/detail.vue')
    },
    { path: '/strategy', name: 'strategy', component: () => import('@/views/strategy/index.vue') },
    {
      path: '/post/:id',
      name: 'post-detail',
      component: () => import('@/views/strategy/post.vue')
    },
    { path: '/profile', name: 'profile', component: () => import('@/views/profile/index.vue') },
    { path: '/login', name: 'login', component: () => import('@/views/login/index.vue') },
    { path: '/member', name: 'member', component: () => import('@/views/member/index.vue') },
    { path: '/order', name: 'order', component: () => import('@/views/order/index.vue') },
    { path: '/feedback', name: 'feedback', component: () => import('@/views/feedback/index.vue') },
    { path: '/invite', name: 'invite', component: () => import('@/views/invite/index.vue') },
    {
      path: '/user/invite',
      name: 'user-invite',
      component: () => import('@/views/invite/index.vue')
    },
    {
      path: '/resume/import',
      name: 'resume-import',
      component: () => import('@/views/resume/import.vue')
    },
    { path: '/add/post', name: 'add-post', component: () => import('@/views/add/post.vue') },
    {
      path: '/add/success',
      name: 'add-success',
      component: () => import('@/views/add/success.vue')
    },
    { path: '/share/:id', name: 'share', component: () => import('@/views/share/index.vue') },
    { path: '/cv/:type/:id', name: 'cv', component: () => import('@/views/cv/index.vue') },
    {
      path: '/export/:id',
      name: 'export-resume',
      component: () => import('@/views/export/index.vue')
    },
    {
      path: '/mp-editor/:id',
      name: 'mp-editor',
      component: () => import('@/views/mp-editor/index.vue')
    }
  ]
}
