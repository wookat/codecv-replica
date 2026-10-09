// 全局共享的所见即所得 PM 编辑器实例（sideTool/slashMenu/bubbleMenu 等组件经此访问）
import type { Editor } from '@tiptap/core'
import { shallowRef } from 'vue'

export const pmEditor = shallowRef<Editor | null>(null)
export const getPMEditor = () => pmEditor.value
export const setPMEditor = (e: Editor | null) => {
  pmEditor.value = e
}
