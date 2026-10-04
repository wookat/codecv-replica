<script setup lang="ts">
import { setExportCount, setTemplateCondition } from '@/api/modules/resume'
import { importCSS } from '@/utils'
import { onMounted, onUnmounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import useEditorStore from '@/store/modules/editor'
import { currentUser } from '@/utils/auth'
import LoginModal from '@/components/LoginModal.vue'

const route = useRoute()
const router = useRouter()
const editorStore = useEditorStore()
const showLogin = ref(!route.query.type && !currentUser())
onMounted(() => {
  if (!route.query.type) return
  importCSS(String(route.query.type))
  ;(document.querySelector('.markdown-transform-html') as HTMLElement).innerHTML =
    editorStore.nativeContent
  editorStore.resetNativeContent() // 重置
  setTimeout(() => {
    setExportCount()
    setTemplateCondition({ name: String(route.query.type) })
    window.print()
    router.back()
  }, 100)
})

function onLoginClose() {
  showLogin.value = false
  router.push('/profile')
}

onUnmounted(() => {
  localStorage.removeItem('download')
})
</script>

<template>
  <div class="markdown-transform-html jufe"></div>
  <LoginModal v-if="showLogin" @close="onLoginClose" />
</template>

<style lang="scss" scoped>
.jufe {
  width: 210mm;
  position: relative;
  min-height: 295mm;
  z-index: 1;
  &::after {
    content: '';
    background: inherit;
    z-index: -2;
    position: fixed;
    top: 0;
    left: 0;
    width: 120vw;
    height: 120vh;
  }
}
</style>
