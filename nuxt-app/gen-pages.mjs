import { writeFileSync, mkdirSync } from 'fs'
import { dirname } from 'path'
// [path, view, layout, meta]
const pages = [
  ['home', 'home/home.vue'],
  ['jianlimoban/index', 'jianlimoban/index.vue'],
  ['jianlimoban/[type]', 'jianlimoban/detail.vue'],
  ['mianjing/index', 'mianjing/index.vue'],
  ['mianjing/activity', 'mianjing/activity.vue'],
  ['mianjing/mine', 'mianjing/mine.vue'],
  ['mianjing/write', 'mianjing/write.vue', 'toolsonly'],
  ['mianjing/c/[slug]/index', 'mianjing/company.vue'],
  ['mianjing/c/[slug]/[combo]', 'mianjing/company.vue'],
  ['mianjing/t/[slug]', 'mianjing/topic.vue'],
  ['mianjing/p/[docId]', 'mianjing/detail.vue'],
  ['strategy/index', 'strategy/index.vue'],
  ['post/[id]', 'strategy/post.vue'],
  ['profile/index', 'profile/index.vue'],
  ['notify/index', 'notify/index.vue'],
  ['member/index', 'member/index.vue'],
  ['order/index', 'order/index.vue'],
  ['feedback/index', 'feedback/index.vue'],
  ['agreement/index', 'agreement/index.vue'],
  ['invite/index', 'invite/index.vue'],
  ['user/invite', 'invite/index.vue'],
  ['resume/import', 'resume/import.vue'],
  ['add/post', 'add/post.vue'],
  ['add/success', 'add/success.vue'],
  ['share/[id]', 'share/index.vue'],
  ['cv/[type]/[id]', 'cv/index.vue'],
  ['export/[id]', 'export/index.vue'],
  ['mp-editor/[id]', 'mp-editor/index.vue', 'blank'],
  ['syntax/helper', 'syntax/syntax.vue'],
  ['template/index', 'template/template.vue'],
  ['jobs/index', 'jobs/index.vue'],
  ['progress/index', 'jobs/progress.vue'],
  ['update/line', 'update/update.vue'],
  ['editor/index', 'editor/editor.vue', 'toolsonly'],
  ['login/index', 'login/index.vue', 'blank'],
  ['download/index', 'download/index.vue'],
  ['404', '404/index.vue'],
  ['[templateCategory]', 'jianlimoban/category.vue'],
]
for (const [p, view, layout] of pages) {
  const file = `pages/${p}.vue`
  mkdirSync(dirname(file), { recursive: true })
  const meta = layout ? `\ndefinePageMeta({ layout: '${layout}' })\n` : ''
  writeFileSync(file, `<script setup lang="ts">
import View from '@/views/${view}'${meta}</script>
<template>
  <View />
</template>
`)
}
// admin children
const admin = [
  ['workbench','workbench.vue'],['statistics','statistics.vue'],['user','user.vue'],
  ['resume/index','resume.vue'],['resume/[id]','resumeEdit.vue'],['template','template.vue'],
  ['history','history.vue'],['post/index','post.vue'],['post/add','postEdit.vue'],
  ['post/edit/[id]','postEdit.vue'],['mianjing/index','mianjing.vue'],
  ['mianjing/comments','mianjingComments.vue'],['mianjing/activity','mianjingActivity.vue'],
  ['topic','topic.vue'],['order','order.vue'],['vipCode','vipCode.vue'],['invite','invite.vue'],
  ['progress','progress.vue'],['advertiseSpace','advertiseSpace.vue'],['advertise','advertise.vue'],
  ['exportStats','exportStats.vue'],['proofreadStats','proofreadStats.vue'],
]
writeFileSync('pages/admin.vue', `<script setup lang="ts">
import AdminLayout from '@/views/admin/AdminLayout.vue'
definePageMeta({ layout: 'blank', ssr: false })
</script>
<template>
  <AdminLayout />
</template>
`)
for (const [p, view] of admin) {
  const file = `pages/admin/${p}.vue`
  mkdirSync(dirname(file), { recursive: true })
  writeFileSync(file, `<script setup lang="ts">
import View from '@/views/admin/${view}'
definePageMeta({ layout: 'blank' })
</script>
<template>
  <View />
</template>
`)
}
// index redirect + catch-all 404 + editor/:type redirect
writeFileSync('pages/index.vue', `<script setup lang="ts">
await navigateTo('/home')
</script>
<template><div /></template>
`)
writeFileSync('pages/admin/index.vue', `<script setup lang="ts">
await navigateTo('/admin/workbench')
</script>
<template><div /></template>
`)
writeFileSync('pages/editor/[type].vue', `<script setup lang="ts">
const route = useRoute()
await navigateTo({ path: '/editor', query: { type: route.params.type } })
</script>
<template><div /></template>
`)
writeFileSync('pages/[...slug].vue', `<script setup lang="ts">
import View from '@/views/404/index.vue'
</script>
<template>
  <View />
</template>
`)
console.log('generated')
