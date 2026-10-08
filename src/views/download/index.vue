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
  <div v-if="!noType" class="markdown-transform-html jufe"></div>
  <div v-if="noType" class="dl-hint">
    <h1>啊哦～发生了一点错误，请稍后再试</h1>
    <p class="err-code">
      <span>错误码：500</span>
      <span class="err-detail">[nuxt] instance unavailable</span>
    </p>
    <p class="err-tip">如频繁出现此问题，请通过右下角联系我们，感谢您的配合！</p>
    <div class="err-btns">
      <button class="b-outline" @click="router.back()">返回上一页</button>
      <button class="b-solid" @click="router.push('/home')">返回首页</button>
      <button class="b-outline" @click="router.go(0)">重试</button>
      <button class="b-outline" @click="noType = false">忽略并继续</button>
    </div>
  </div>
  <LoginModal v-if="showLogin" @close="onLoginClose" />
</template>

<style lang="scss" scoped>
.dl-hint {
  position: relative;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: var(--body-background);
  color: rgb(85, 85, 85);
  text-align: center;
  padding: 24px;
  h1 {
    font-size: 24px;
    font-weight: 600;
    margin: 0 0 16px;
    line-height: 32px;
  }
  .err-code {
    color: rgb(75, 85, 99);
    font-size: 16px;
    margin: 0 0 16px;
    .err-detail {
      display: block;
      margin-top: 8px;
    }
  }
  .err-tip {
    line-height: 40px;
    font-size: 16px;
    margin: 0 0 24px;
  }
  .err-btns {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: center;
    gap: 12px;
    button {
      padding: 8px 16px;
      font-size: 13.333px;
      cursor: pointer;
      background: none;
    }
    .b-outline {
      border: 1px solid var(--theme);
      color: var(--theme);
      border-radius: 4px;
      &:hover {
        background: var(--theme);
        color: #fff;
      }
    }
    .b-solid {
      border: none;
      border-radius: 6px;
      background: var(--theme);
      color: #fff;
      &:hover {
        opacity: 0.9;
      }
    }
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
