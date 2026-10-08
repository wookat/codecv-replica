<script setup lang="ts">
import { Codemirror } from 'vue-codemirror'
import { markdownLanguage } from '@codemirror/lang-markdown'
import { oneDark } from '@codemirror/theme-one-dark'
import { useResumeType } from '../../../hook'
import useEditorStore from '@/store/modules/editor'

import { useThemeConfig } from '@/common/global'
import MarkdownToolbar from '../toolbar/mdTool.vue'
import './md-editor.scss'
import { onMounted, onBeforeUnmount, ref } from 'vue'
import { EditorView } from '@codemirror/view'

defineProps<{ left: number }>()
const { isDark } = useThemeConfig()
const { resumeType } = useResumeType()
const editorStore = useEditorStore()

// 生产同款滚动联动：预览点击模块 → 收 resume-module-scroll 广播滚动到对应行
const cm = ref<{ view?: EditorView } | null>(null)
let ch: BroadcastChannel | null = null
function onMsg(ev: MessageEvent) {
  const data = ev.data as { line?: number | null }
  const view = cm.value?.view
  if (!view || typeof data?.line !== 'number' || !data.line) return
  try {
    const line = Math.min(data.line, view.state.doc.lines)
    const pos = view.state.doc.line(Math.max(1, line)).from
    view.dispatch({
      effects: EditorView.scrollIntoView(pos, { y: 'start', yMargin: 24 })
    })
  } catch {
    /* ignore */
  }
}
onMounted(() => {
  ch = new BroadcastChannel('resume-module-scroll')
  ch.addEventListener('message', onMsg)
})
onBeforeUnmount(() => {
  ch?.removeEventListener('message', onMsg)
  ch?.close()
})
</script>

<template>
  <markdown-toolbar @toggle-editor-mode="editorStore.setWritableMode" />
  <codemirror
    ref="cm"
    v-model="editorStore.MDContent"
    :style="{
      height: 'calc(100vh - 40px)',
      borderLeft: isDark ? 'none' : '1px solid #ddd',
      borderBottomLeftRadius: '10px',
      borderBottomRightRadius: '10px',
      minWidth: '550px',
      width: `${left}px`,
      background: '#fff'
    }"
    :autofocus="true"
    :indent-with-tab="true"
    :extensions="isDark ? [markdownLanguage, oneDark] : [markdownLanguage]"
    @change="(nv: string) => editorStore.setMDContent(nv, resumeType)"
  />
</template>

<style lang="scss" scoped></style>
