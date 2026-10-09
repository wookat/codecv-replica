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
  // 实现为 widget decoration：resumeModule 节点尾部挂 .mod-op 按钮，CSS hover 显隐
  function moduleNodes() {
    const list: { pos: number; node: PMNode }[] = []
    editor?.state.doc.descendants((node, pos) => {
      if (node.type.name === 'resumeModule') list.push({ pos, node })
      return true
    })
    return list
  }
  function moveModulePos(pos: number, dir: -1 | 1) {
    if (!editor) return
    const mods = moduleNodes()
    const i = mods.findIndex(m => m.pos === pos)
    if (i < 0) return
    if (dir < 0 && i === 0) return warningMessage('已经是第一位了')
    if (dir > 0 && i === mods.length - 1) return warningMessage('已经到最后了')
    const node = mods[i].node
    const target = mods[i + dir]
    const tr = editor.state.tr
    tr.delete(pos, pos + node.nodeSize)
    const ins = dir < 0 ? target.pos : target.pos - node.nodeSize + target.node.nodeSize
    tr.insert(ins, node)
    editor.view.dispatch(tr.scrollIntoView())
  }
  async function removeModulePos(pos: number) {
    if (!editor) return
    const node = editor.state.doc.nodeAt(pos)
    if (!node) return
    const title = node.firstChild?.textContent?.trim()
    try {
      await ElMessageBox.confirm(
        `您确定要删除${title ? `【${title}】` : '此'}模块吗？`,
        '删除模块提示',
        { confirmButtonText: '确定', cancelButtonText: '取消', type: 'warning' }
      )
      editor.view.dispatch(editor.state.tr.delete(pos, pos + node.nodeSize))
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
    if (typeof data?.index !== 'number' || !editor) return
    const mods = moduleNodes()
    const m = mods[data.index]
    if (!m) return
    try {
      const el = editor.view.domAtPos(m.pos).node as HTMLElement
      const scroller = DOMTree.value
      if (scroller && scroller.scrollHeight > scroller.clientHeight) {
        scroller.scrollTo({ top: Math.max(0, el.offsetTop - 56), behavior: 'smooth' })
      } else {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }
    } catch {
      /* node may not be mounted yet */
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
  const fillContent = () => {
    if (!editorStore.writable || !editor) return
    nextTick(() => {
      const ref = queryDOM('.reference-dom') as HTMLElement | null
      if (!ref) return
      editor!.commands.setContent(ref.innerHTML)
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
