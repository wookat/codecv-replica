<script setup lang="ts">
import { onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'

// 小程序 webview 入口：转发到完整编辑器
const route = useRoute()
const router = useRouter()
onMounted(() => {
  router.replace({ path: `/editor/${route.params.id}`, query: route.query })
})
</script>

<template>
  <div class="mp-loading">加载编辑器…</div>
</template>

<style lang="scss">
.mp-loading {
  min-height: 60vh;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #9ca3af;
  font-size: 14px;
}
</style>
