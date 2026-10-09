import { defineStore } from 'pinia'

import pinia from '@/store'
import { getLocalStorage, setLocalStorage } from '@/common/localstorage'
import { showMessageVN } from '@/common/message'
import { loadTemplateContent } from '@/templates/config'
import { cloudPush } from '@/api/modules/cloudResume'

const MARKDOWN_CONTENT = 'markdown-content'
const WRITABLE = 'writable'

export const getCurrentTypeContent = async (type: string): Promise<string> => {
  const base = type.split('~')[0] // 副本实例键回落到母版模板内容
  return await loadTemplateContent(base)
}

const useEditorStore = defineStore('editorStore', {
  state: () => ({
    MDContent: '',
    nativeContent: '',
    // 生产版默认进入「编辑」所见即所得模式；用户显式切到 MD 才持久化 false
    writable: (() => {
      const raw = localStorage.getItem(WRITABLE)
      return raw === null ? true : Boolean(getLocalStorage(WRITABLE))
    })(),
    // 预览模式：隐藏左侧编辑器 只看纸面（对齐线上版三模式切换）
    previewMode: false,
    // 编辑历史栈 用于顶栏撤销按钮；future = 重做栈
    history: [] as string[],
    future: [] as string[]
  }),
  actions: {
    // 初始化编辑器内容（默认为Markdown模式）
    async initMDContent(resumeType: string) {
      const cacheKey = MARKDOWN_CONTENT + '-' + resumeType
      this.MDContent = getLocalStorage(cacheKey)
        ? (getLocalStorage(cacheKey) as string)
        : await getCurrentTypeContent(resumeType)
    },
    setMDContent(nv: string, resumeType: string, fromHistory = false) {
      if (nv !== this.MDContent && !fromHistory) {
        this.history.push(this.MDContent)
        if (this.history.length > 30) this.history.shift()
        this.future.length = 0 // 新编辑使重做栈失效
      }
      this.MDContent = nv
      // 处理之后的操作
      if (!nv) return
      setLocalStorage(`${MARKDOWN_CONTENT}-${resumeType}`, nv)
      cloudPush(resumeType, nv)
    },
    // 撤销到上一个内容快照
    undo() {
      const prev = this.history.pop()
      if (prev === undefined) return null
      this.future.push(this.MDContent)
      return prev
    },
    // 重做到撤销前的内容快照
    redo() {
      const next = this.future.pop()
      if (next === undefined) return null
      this.history.push(this.MDContent)
      return next
    },
    setPreviewMode(v: boolean) {
      this.previewMode = v
    },
    // 切换编辑模式（PM 引擎由 fillContent 按 md 重灌，无需再注入 HTML）
    setWritableMode() {
      this.writable = !this.writable
      setLocalStorage(WRITABLE, this.writable)
      showMessageVN('您已切换至', this.writable ? '内容模式' : 'Markdown模式')
    },
    setNativeContent(content: string) {
      this.nativeContent = content
    },
    resetNativeContent() {
      this.nativeContent = ''
    }
  }
})

export default () => useEditorStore(pinia)
