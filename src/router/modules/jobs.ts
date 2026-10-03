import Layout from '@/layout/main.vue'

export default {
  name: 'jobs',
  path: '/jobs',
  component: Layout,
  children: [
    {
      path: '/jobs',
      name: 'jobs',
      component: () => import('@/views/jobs/index.vue')
    },
    {
      path: '/progress',
      name: 'progress',
      component: () => import('@/views/jobs/progress.vue')
    }
  ]
}
