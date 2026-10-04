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
const noType = ref(!route.query.type)
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
  <div v-if="noType" class="dl-hint">
    <h2>备用导出通道</h2>
    <p>此页面由编辑器的「备用导出」自动打开并完成打印/另存 PDF，直接访问没有可导出的内容。</p>
    <router-link to="/jianlimoban" class="dl-btn">去模板中心挑一份简历</router-link>
  </div>
  <LoginModal v-if="showLogin" @close="onLoginClose" />
</template>

<style lang="scss" scoped>
.dl-hint {
  position: fixed;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  background: var(--body-background);
  color: var(--font-color);
  text-align: center;
  padding: 24px;
  h2 {
    margin: 0;
    font-size: 20px;
  }
  p {
    font-size: 14px;
    opacity: 0.6;
    max-width: 420px;
    line-height: 1.8;
  }
  .dl-btn {
    margin-top: 8px;
    background: var(--theme);
    color: #fff;
    border-radius: 999px;
    padding: 9px 24px;
    font-size: 14px;
    text-decoration: none;
  }
}
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
