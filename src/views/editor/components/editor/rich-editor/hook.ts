import useEditorStore from '@/store/modules/editor'
import { TOKEN } from '@/store/modules/user'
import { getLocalStorage } from '@/common/localstorage'
import { queryDOM } from '@/utils'
import { resumeDOMStruct2Markdown } from '@/utils/dom2md'
import { warningMessage } from '@/common/message'
import { ElMessageBox } from 'element-plus'
import { nextTick, onActivated, onBeforeUnmount, onMounted, ref } from 'vue'
import { Editor } from '@tiptap/core'
import { Node as PMNode } from '@tiptap/pm/model'
import { markdownToHTML } from '@/lib/mth'
import { fontMark } from '@/utils/moduleCombine'
import { resumeExtensions } from './pm/schema'
import { DragHandle, ModuleOps, TrailingNode } from './pm/plugins'
import { setPMEditor } from './pm/useEditor'

// 使用编辑模式 —— tiptap/ProseMirror 引擎（生产同款 .tiptap.ProseMirror 文档模型）
export function useToggleEditorMode(resumeType: string) {
  const editorStore = useEditorStore(),
    DOMTree = ref<HTMLElement>()
  let editor: Editor | null = null

  // ===== 序列化回 md：克隆 PM DOM，剥离编辑态辅助元素后走既有 DOM→md 方言 ==========
  function ObserverContent() {
    if (!editor) return
    const clone = editor.view.dom.cloneNode(true) as HTMLElement
    clone
      .querySelectorAll(
        '.drag-handle,.mod-op,.ProseMirror-widget,.ProseMirror-separator,.ProseMirror-trailingBreak,.column-resize-handle,.table-col-grip,.table-row-grip'
      )
      .forEach(e => e.remove())
    // PM 表格外层 .tableWrapper 不属于简历结构——解包保留 table
    clone.querySelectorAll('.tableWrapper').forEach(w => {
      const t = w.querySelector('table')
      if (t) w.replaceWith(t)
      else w.remove()
    })
    const content = resumeDOMStruct2Markdown({
      node: clone,
      latest: true,
      uid: 0,
      whiteSpace: 0,
      parent: <Node>clone.parentElement
    })
    editorStore.setMDContent(content, resumeType)
  }

  // ===== 模块操作（生产同款 hover 内联 上移/下移/删除该模块） =====
  // prod PM 文档是扁平顶层块（无 resume-module 包装）：模块 = 顶层 H2 + 至下个 H2 前的兄弟块
  interface ModSpan {
    start: number
    end: number
    node: PMNode
  }
  function moduleSpans(): ModSpan[] {
    // 模块 = H2 及其后跟内容：顶层与嵌套（main-layout/head-layout 容器内）都收集，
    // end 取下一个 H2 的 pos（末个到文档尾），使两种布局的模块都能整体搬移/删除。
    const spans: ModSpan[] = []
    if (!editor) return spans
    const doc = editor.state.doc
    const h2s: { pos: number; node: PMNode }[] = []
    doc.descendants((node, pos) => {
      if (node.type.name === 'heading' && node.attrs.level === 2) h2s.push({ pos, node })
      return true
    })
    h2s.forEach((h, i) => {
      // span 结束位置取同级语义：到「下一个 H2」或「本 H2 所在父容器的内容边界」先到者，
      // 否则顶层 H2 会把 main-layout 容器头一半内容卷进 span、嵌套末个 H2 会把容器外节点拖走。
      const $h = doc.resolve(h.pos)
      const parentEnd = h.pos - $h.parentOffset + $h.parent.nodeSize - 1
      const nextH2 = i + 1 < h2s.length ? h2s[i + 1].pos : doc.content.size
      spans.push({ start: h.pos, end: Math.min(nextH2, parentEnd), node: h.node })
    })
    return spans
  }
  function moveModulePos(pos: number, dir: -1 | 1) {
    if (!editor) return
    const mods = moduleSpans()
    const i = mods.findIndex(m => m.start === pos)
    if (i < 0) return
    if (dir < 0 && i === 0) return warningMessage('已经是第一位了')
    if (dir > 0 && i === mods.length - 1) return warningMessage('已经到最后了')
    const m = mods[i]
    const target = mods[i + dir]
    // 相邻 H2 分属不同父容器（如 head-layout ↔ main-layout）时不搬——跨容器拼接会切坏容器
    const doc = editor.state.doc
    const parentKey = (p: number) => {
      const $p = doc.resolve(p)
      return `${$p.depth}:${p - $p.parentOffset}`
    }
    if (parentKey(m.start) !== parentKey(target.start)) {
      return warningMessage(dir < 0 ? '已经是第一位了' : '已经到最后了')
    }
    const tr = editor.state.tr
    const slice = editor.state.doc.slice(m.start, m.end)
    tr.delete(m.start, m.end)
    const ins = dir < 0 ? target.start : target.end - (m.end - m.start)
    tr.insert(ins, slice.content)
    editor.view.dispatch(tr.scrollIntoView())
  }
  async function removeModulePos(pos: number) {
    if (!editor) return
    const mods = moduleSpans()
    const m = mods.find(x => x.start === pos)
    if (!m) return
    const title = m.node.textContent?.trim()
    try {
      await ElMessageBox.confirm(
        `您确定要删除${title ? `【${title}】` : '此'}模块吗？`,
        '删除模块提示',
        { confirmButtonText: '确定', cancelButtonText: '取消', type: 'warning' }
      )
      editor.view.dispatch(editor.state.tr.delete(m.start, m.end))
    } catch {
      /* 取消 */
    }
  }

  // 模块操作按钮事件（widget 里的 上移/下移/删除）
  function onModuleOp(ev: Event) {
    const d = (ev as CustomEvent).detail as { op: string; pos: number }
    if (d?.pos == null) return
    if (d.op === 'del') void removeModulePos(d.pos)
    else moveModulePos(d.pos, d.op === 'up' ? -1 : 1)
  }

  // ===== 预览→编辑滚动联动：BroadcastChannel 广播 index → 滚到第 N 个 resume-module =====
  let modChannel: BroadcastChannel | null = null
  function onChannelMsg(ev: MessageEvent) {
    const data = ev.data as { index?: number }
    if (typeof data?.index !== 'number') return
    // 模块顺序 = 顶层 H2 的 DOM 顺序，与 moduleSpans 一致；直接取 DOM 节点避免 PM 边界差异
    const h2s = DOMTree.value?.querySelectorAll(':scope .tiptap h2')
    const el = h2s?.[data.index] as HTMLElement | undefined
    if (!el) return
    const scroller = el.closest('.tiptap') as HTMLElement | null
    if (scroller && scroller.scrollHeight > scroller.clientHeight) {
      const top =
        scroller.scrollTop + el.getBoundingClientRect().top - scroller.getBoundingClientRect().top
      scroller.scrollTo({ top: Math.max(0, top - 56), behavior: 'smooth' })
    } else {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }

  // ===== 空段落 block-menu：光标停在顶层空块 → 弹 insert 菜单（生产同款） =====
  let blockMenuTimer = 0
  function onSelectionChange() {
    if (!editor) return
    window.clearTimeout(blockMenuTimer)
    blockMenuTimer = window.setTimeout(() => {
      const { $from, empty } = editor!.state.selection
      if (!empty) return
      // 只认顶层或包装节点内的空段落（H/P 级块）
      const node = $from.parent
      if (node.textContent.trim() || !['paragraph', 'heading'].includes(node.type.name)) return
      // 排除表格/列表内部的段落
      for (let d = $from.depth; d > 0; d--) {
        const n = $from.node(d)
        if (['tableCell', 'tableHeader', 'listItem'].includes(n.type.name)) return
      }
      const el = editor!.view.domAtPos($from.before()).node as HTMLElement
      window.dispatchEvent(
        new CustomEvent('side-tool-menu-trigger', {
          detail: {
            mode: 'block',
            pos: $from.before(),
            node,
            anchorRect: el.getBoundingClientRect(),
            el
          }
        })
      )
    }, 120)
  }

  // ===== 粘贴图片（生产同款）：上传 KV 图床，未登录 dataURL 兜底 → 插入 image 节点 =====
  async function onPaste(ev: ClipboardEvent) {
    const file = Array.from(ev.clipboardData?.files || []).find(f => f.type.startsWith('image/'))
    if (!file || !editor) return
    ev.preventDefault()
    let url = ''
    try {
      const token = (getLocalStorage(TOKEN) as string) || ''
      const fd = new FormData()
      fd.append('file', file)
      const res = await fetch('/api/upload', {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        body: fd
      })
      const data = await res.json()
      if (data.code === 200) url = data.url
    } catch {
      /* fall through to dataURL */
    }
    if (!url) {
      url = await new Promise<string>((resolve, reject) => {
        const fr = new FileReader()
        fr.onload = () => resolve(String(fr.result))
        fr.onerror = reject
        fr.readAsDataURL(file)
      })
    }
    editor
      .chain()
      .focus()
      .setImage({ src: url, alt: file.name || 'image' })
      .run()
  }

  // ===== 编辑器挂载 =====
  // prod PM 文档 = md 方言渲染的扁平 DOM（无 resume-module/main-layout 包装，那些只在预览端存在）
  const fillContent = () => {
    if (!editorStore.writable || !editor) return
    nextTick(() => {
      const md = editorStore.MDContent
      if (md == null) return
      // 初始填充不计入撤销栈——否则 Ctrl+Z 连按会把整份简历清成空文档并回写空 md
      const html = fontMark(markdownToHTML(md))
      editor!.commands.command(({ tr, commands }) => {
        tr.setMeta('addToHistory', false)
        return commands.setContent(html)
      })
    })
  }

  onMounted(() => {
    const host = DOMTree.value
    if (!host) return
    const mount = document.createElement('div')
    host.appendChild(mount)
    editor = new Editor({
      element: mount,
      extensions: [...resumeExtensions, DragHandle, TrailingNode, ModuleOps],
      content: '',
      editorProps: {
        attributes: { class: 'tiptap', spellcheck: 'false' }
      },
      onUpdate: () => ObserverContent(),
      onCreate: () => fillContent()
    })
    setPMEditor(editor)
    host.addEventListener('paste', onPaste)
    document.addEventListener('selectionchange', onSelectionChange)
    window.addEventListener('module-op', onModuleOp)
    modChannel = new BroadcastChannel('resume-module-scroll')
    modChannel.addEventListener('message', onChannelMsg)
  })

  onBeforeUnmount(() => {
    document.removeEventListener('selectionchange', onSelectionChange)
    modChannel?.removeEventListener('message', onChannelMsg)
    modChannel?.close()
    DOMTree.value?.removeEventListener('paste', onPaste)
    window.removeEventListener('module-op', onModuleOp)
    editor?.destroy()
    editor = null
    setPMEditor(null)
  })

  onActivated(fillContent)

  // 撤销/重做：PM history 原生（生产同款）
  const undo = () => {
    editor?.commands.undo()
  }
  const redo = () => {
    editor?.commands.redo()
  }

  return {
    editorStore,
    DOMTree,
    ObserverContent,
    undo,
    redo,
    moveModulePos,
    removeModulePos
  }
}
