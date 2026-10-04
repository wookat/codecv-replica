<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { templates } from '@/templates/config'
import { setLocalStorage } from '@/common/localstorage'
import { isJsonResume, jsonResumeToMd } from '@/utils/jsonResume'

const router = useRouter()
const dragging = ref(false)
const fileInput = ref<HTMLInputElement>()

function pick() {
  fileInput.value?.click()
}

async function onFile(e: Event) {
  const f = (e.target as HTMLInputElement).files?.[0]
  if (f) await importFile(f)
  ;(e.target as HTMLInputElement).value = ''
}

function onDrop(e: DragEvent) {
  dragging.value = false
  const f = e.dataTransfer?.files?.[0]
  if (f) importFile(f)
}

async function importFile(f: File) {
  if (!/\.(md|markdown|txt|json)$/i.test(f.name))
    return ElMessage.warning('仅支持 .md / .txt / .json 格式')
  let text = await f.text()
  if (text.trim().length < 10) return ElMessage.warning('文件内容过短')
  if (/\.json$/i.test(f.name)) {
    if (!isJsonResume(text)) return ElMessage.warning('不是可识别的 JSON Resume 格式')
    text = jsonResumeToMd(JSON.parse(text))
  }
  // 复刻版：导入到「自定义简历」草稿，进入编辑器
  const type = 'create'
  if (!templates.value.some(t => t.type === type)) {
    templates.value.unshift({
      type,
      id: 0,
      name: '自定义简历',
      content: '',
      primaryColor: '#333',
      primaryBackground: '#333',
      img: ''
    })
  }
  setLocalStorage(`markdown-content-${type}`, text, 1000 * 60 * 60 * 24 * 30)
  ElMessage.success('导入成功，进入编辑器')
  router.push(`/editor/${type}`)
}
</script>

<template>
  <div class="im-page">
    <h1 class="sr-only">导入简历_Markdown简历导入_在线简历编辑器</h1>
    <div class="im-card">
      <h2>导入简历</h2>
      <p class="sub">支持 Markdown 格式（CodeCV 方言），导入后自动进入编辑器</p>
      <div
        class="drop"
        :class="{ on: dragging }"
        @click="pick"
        @dragover.prevent="dragging = true"
        @dragleave="dragging = false"
        @drop.prevent="onDrop"
      >
        <svg
          class="d-ic"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="1.5"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
          <path d="m17 8-5-5-5 5" />
          <path d="M12 3v12" />
        </svg>
        <p class="d-t">点击选择或拖拽文件到此处</p>
        <p class="d-s">.md / .markdown / .txt / .json（JSON Resume）</p>
      </div>
      <input
        ref="fileInput"
        type="file"
        accept=".md,.markdown,.txt,.json"
        hidden
        @change="onFile"
      />
      <div class="tips">
        <p>小提示：在编辑器中可随时用「导出 MD」备份你的简历内容</p>
      </div>
    </div>
  </div>
</template>

<style lang="scss">
.im-page {
  max-width: 720px;
  margin: 0 auto;
  padding: 32px 20px;
  color: var(--font-color);
}
.im-card {
  background: var(--background);
  border-radius: 16px;
  padding: 32px;
  h2 {
    margin: 0;
    font-size: 20px;
    font-weight: 700;
  }
  .sub {
    margin-top: 8px;
    font-size: 13px;
    color: #9ca3af;
  }
}
.drop {
  margin-top: 24px;
  border: 2px dashed rgba(0, 0, 0, 0.15);
  border-radius: 16px;
  padding: 56px 24px;
  text-align: center;
  cursor: pointer;
  transition: all 0.2s;
  &.on,
  &:hover {
    border-color: var(--theme);
    background: color-mix(in srgb, var(--theme) 5%, transparent);
  }
  .d-ic {
    width: 44px;
    height: 44px;
    color: #9ca3af;
    margin: 0 auto;
  }
  .d-t {
    margin-top: 16px;
    font-size: 15px;
    font-weight: 500;
  }
  .d-s {
    margin-top: 6px;
    font-size: 12px;
    color: #9ca3af;
  }
}
.tips {
  margin-top: 24px;
  font-size: 13px;
  color: #9ca3af;
}
</style>
