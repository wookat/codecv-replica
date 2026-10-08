import useEditorStore from '@/store/modules/editor'
import { TOKEN } from '@/store/modules/user'
import { getLocalStorage } from '@/common/localstorage'
import { queryDOM } from '@/utils'
import { resumeDOMStruct2Markdown } from '@/utils/dom2md'
import { warningMessage } from '@/common/message'
import { ElMessageBox } from 'element-plus'
import { nextTick, onActivated, onBeforeUnmount, onMounted, ref } from 'vue'
// 使用编辑模式
export function useToggleEditorMode(resumeType: string) {
  const editorStore = useEditorStore(),
    DOMTree = ref<HTMLElement>()

  function ObserverContent() {
    // 克隆序列化：drag-handle 等编辑态辅助元素不进 md
    const clone = DOMTree.value?.cloneNode(true) as HTMLElement
    clone?.querySelectorAll('.' + HANDLE + ',.mod-op').forEach(e => e.remove())
    const content = resumeDOMStruct2Markdown({
      node: clone as Node,
      latest: true,
      uid: 0,
      whiteSpace: 0,
      parent: <Node>DOMTree.value?.parentElement
    })
    editorStore.setMDContent(content, resumeType)
  }

  // ===== 拖拽移动/节点操作（对齐生产：块级节点 hover 出 ⋮⋮ 手柄，拖动重排） =====
  let dragEl: HTMLElement | null = null
  const HANDLE = 'drag-handle'

  function isBlock(el: Element) {
    return (
      el.nodeType === 1 && !el.classList.contains(HANDLE) && !['IMG', 'BR'].includes(el.tagName)
    )
  }

  function injectHandles() {
    const root = DOMTree.value
    if (!root) return
    root.querySelectorAll('.' + HANDLE).forEach(e => e.remove())
    // 生产同款：所有块级节点（模块/行/卡片内标题段落列表等）都挂 ⋮⋮ 手柄
    const targets = Array.from(
      root.querySelectorAll(
        'h1,h2,h3,h4,h5,h6,p,ul,ol,blockquote,pre,table,.resume-module,.head-layout,.main-layout,.flex-layout,.flex-layout-item'
      )
    ).filter(el => isBlock(el) && !el.closest('td,th') && !el.closest('.' + HANDLE))
    for (const el of targets) {
      if (el.querySelector(':scope > .' + HANDLE)) continue
      el.classList.add('draggable-block')
      const h = document.createElement('div')
      h.className = HANDLE
      h.contentEditable = 'false'
      // 生产版手柄 = ⋮⋮ 拖拽钮（点击开 row-actions 菜单）+ ＋ 添加内容钮（点击开 insert 菜单）
      const grip = document.createElement('div')
      grip.className = 'drag-btn'
      grip.draggable = true
      grip.addEventListener('click', ev => {
        ev.stopPropagation()
        window.dispatchEvent(
          new CustomEvent('side-tool-menu-trigger', {
            detail: { mode: 'row-actions', block: el, anchorRect: h.getBoundingClientRect() }
          })
        )
      })
      const add = document.createElement('div')
      add.className = 'add-btn'
      add.title = '添加内容'
      add.addEventListener('click', ev => {
        ev.stopPropagation()
        window.dispatchEvent(
          new CustomEvent('side-tool-menu-trigger', {
            detail: { mode: 'insert', block: el, anchorRect: h.getBoundingClientRect() }
          })
        )
      })
      h.appendChild(grip)
      h.appendChild(add)
      grip.addEventListener('dragstart', ev => {
        dragEl = el as HTMLElement
        ev.dataTransfer?.setData('text/plain', '')
        ev.dataTransfer?.setDragImage(el as HTMLElement, 0, 0)
        el.classList.add('is-dragging')
        ev.stopPropagation()
      })
      h.addEventListener('dragend', () => {
        el.classList.remove('is-dragging')
        root
          .querySelectorAll('.is-draggable-hover')
          .forEach(x => x.classList.remove('is-draggable-hover'))
        // 生产同款落点闪烁反馈
        el.classList.add('is-dropped-flash')
        window.setTimeout(() => el.classList.remove('is-dropped-flash'), 1300)
        ObserverContent()
      })
      el.appendChild(h)
    }
  }

  // ===== 生产同款模块操作：hover .resume-module 出内联 img 钮（上移/下移/删除该模块） =====
  let modOpEls: HTMLElement[] = []
  const modulesOf = () =>
    Array.from(DOMTree.value?.querySelectorAll('.resume-module') || []) as HTMLElement[]

  function mkModBtn(cls: string, title: string, arrow: string) {
    const b = document.createElement('span')
    b.className = `mod-op ${cls}`
    b.title = title
    b.contentEditable = 'false'
    b.innerHTML = `<svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">${arrow}</svg>`
    return b
  }
  function clearModOps() {
    modOpEls.forEach(e => e.parentElement?.removeChild(e))
    modOpEls = []
  }
  function onModEnter(ev: Event) {
    const mod = ev.currentTarget as HTMLElement
    clearModOps()
    const up = mkModBtn('mod-up', '上移', '<path d="M6 15l6-6 6 6"/>')
    const down = mkModBtn('mod-down', '下移', '<path d="M6 9l6 6 6-6"/>')
    const del = mkModBtn('remove-module', '删除该模块', '<path d="M6 6l12 12M18 6L6 18"/>')
    mod.appendChild(down)
    mod.appendChild(up)
    mod.appendChild(del)
    modOpEls = [down, up, del]
  }
  function onModLeave() {
    clearModOps()
  }
  // tiptap 会把非文档化的 DOM 交换归一化回滚——与生产效果一致的做法：直接按 `##` 模块边界操作 md
  function mdChunks() {
    const md = editorStore.MDContent || ''
    const lines = md.split('\n')
    const heads: number[] = []
    lines.forEach((l, i) => {
      if (/^##\s/.test(l)) heads.push(i)
    })
    const pre = lines.slice(0, heads[0] ?? lines.length).join('\n')
    const chunks = heads.map((h, i) => lines.slice(h, heads[i + 1]).join('\n'))
    return { pre, chunks }
  }
  function writeChunks(pre: string, chunks: string[]) {
    editorStore.setMDContent([pre, ...chunks].filter(Boolean).join('\n'), resumeType)
  }
  function moveModule(mod: HTMLElement, dir: -1 | 1) {
    const mods = modulesOf()
    const i = mods.indexOf(mod)
    if (i < 0) return
    if (dir < 0 && i === 0) return warningMessage('已经是第一位了')
    if (dir > 0 && i === mods.length - 1) return warningMessage('已经到最后了')
    clearModOps()
    const { pre, chunks } = mdChunks()
    if (chunks.length !== mods.length) return
    ;[chunks[i + dir], chunks[i]] = [chunks[i], chunks[i + dir]]
    writeChunks(pre, chunks)
  }
  async function removeModule(mod: HTMLElement) {
    clearModOps()
    const mods = modulesOf()
    const i = mods.indexOf(mod)
    const title = mod.querySelector('h2')?.textContent?.trim()
    try {
      await ElMessageBox.confirm(
        `您确定要删除${title ? `【${title}】` : '此'}模块吗？`,
        '删除模块提示',
        {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning'
        }
      )
      if (i >= 0) {
        const { pre, chunks } = mdChunks()
        if (chunks.length === mods.length) {
          chunks.splice(i, 1)
          writeChunks(pre, chunks)
          return
        }
      }
      mod.remove()
      ObserverContent()
    } catch {
      /* 取消 */
    }
  }
  function onModClick(ev: Event) {
    const t = ev.target as HTMLElement
    const mod = ev.currentTarget as HTMLElement
    if (t.closest('.mod-up')) {
      ev.stopPropagation()
      moveModule(mod, -1)
    } else if (t.closest('.mod-down')) {
      ev.stopPropagation()
      moveModule(mod, 1)
    } else if (t.closest('.remove-module')) {
      ev.stopPropagation()
      void removeModule(mod)
    }
  }
  function bindModuleOps() {
    modulesOf().forEach(mod => {
      if (mod.dataset.modopsBound) return
      mod.dataset.modopsBound = '1'
      mod.addEventListener('mouseenter', onModEnter)
      mod.addEventListener('mouseleave', onModLeave)
      mod.addEventListener('click', onModClick)
    })
  }

  // ===== 生产同款滚动联动：预览点击模块 → BroadcastChannel 广播 index/line =====
  let modChannel: BroadcastChannel | null = null
  function onChannelMsg(ev: MessageEvent) {
    const data = ev.data as { index?: number }
    if (typeof data?.index !== 'number') return
    const mod = modulesOf()[data.index]
    if (!mod) return
    const scroller =
      (DOMTree.value?.closest('[style*="overflow"]') as HTMLElement | null) ||
      (DOMTree.value?.parentElement as HTMLElement | null)
    if (scroller && scroller.scrollHeight > scroller.clientHeight) {
      scroller.scrollTo({ top: Math.max(0, mod.offsetTop - 56), behavior: 'smooth' })
    } else {
      mod.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }

  function siblingsOf(el: HTMLElement): HTMLElement[] {
    const p = el.parentElement
    return p ? (Array.from(p.children).filter(c => isBlock(c)) as HTMLElement[]) : []
  }

  function onDragOver(ev: DragEvent) {
    if (!dragEl) return
    ev.preventDefault()
    const sibs = siblingsOf(dragEl)
    const y = ev.clientY
    // 找当前命中的兄弟节点（除拖拽体本身）
    let target: HTMLElement | null = null
    for (const s of sibs) {
      if (s === dragEl) continue
      const r = s.getBoundingClientRect()
      if (y >= r.top && y <= r.bottom) {
        target = s
        break
      }
    }
    if (!target) return
    const r = target.getBoundingClientRect()
    const before = y < r.top + r.height / 2
    sibs.forEach(s => s.classList.remove('is-draggable-hover'))
    if (before && target.previousElementSibling === dragEl) return
    if (!before && target.nextElementSibling === dragEl) return
    target.parentElement?.insertBefore(dragEl, before ? target : target.nextSibling)
    target.classList.add('is-draggable-hover')
  }

  // 生产同款空段落浮层：光标停在顶层空块时弹出 block-menu（正文/模块标题/小标题/左右布局/空白符）
  let blockMenuTimer = 0
  function onSelectionChange() {
    const root = DOMTree.value
    if (!root) return
    window.clearTimeout(blockMenuTimer)
    blockMenuTimer = window.setTimeout(() => {
      const sel = window.getSelection()
      if (!sel || !sel.isCollapsed || !sel.rangeCount) return
      const node = sel.anchorNode
      const el = (node?.nodeType === 1 ? node : node?.parentElement) as HTMLElement | null
      if (!el || !root.contains(el)) return
      // 找到直属 root 的块级祖先
      let block = el
      while (block.parentElement && block.parentElement !== root) {
        block = block.parentElement
      }
      if (block.parentElement !== root) return
      const isText =
        !block.textContent?.trim() &&
        ['P', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6'].includes(block.tagName)
      if (!isText) return
      const r = block.getBoundingClientRect()
      window.dispatchEvent(
        new CustomEvent('side-tool-menu-trigger', {
          detail: { mode: 'block', block, anchorRect: r }
        })
      )
    }, 120)
  }

  // 生产同款粘贴图片：剪贴板含图片文件 → 上传(KV图床，未登录dataURL兜底) → 插入
  async function onPaste(ev: ClipboardEvent) {
    const file = Array.from(ev.clipboardData?.files || []).find(f => f.type.startsWith('image/'))
    if (!file) return
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
    const img = document.createElement('img')
    img.src = url
    img.alt = file.name || 'image'
    img.style.maxWidth = '100%'
    const sel = getSelection()
    const r = sel?.rangeCount ? sel.getRangeAt(0) : null
    if (r && DOMTree.value?.contains(r.commonAncestorContainer)) {
      r.deleteContents()
      r.insertNode(img)
      r.setStartAfter(img)
      r.collapse(true)
      sel?.removeAllRanges()
      sel?.addRange(r)
    } else {
      DOMTree.value?.appendChild(img)
    }
    ObserverContent()
  }

  onMounted(() => {
    const root = DOMTree.value
    if (root) {
      root.addEventListener('dragover', onDragOver)
      root.addEventListener('paste', onPaste)
      document.addEventListener('selectionchange', onSelectionChange)
      modChannel = new BroadcastChannel('resume-module-scroll')
      modChannel.addEventListener('message', onChannelMsg)
      // 新建节点（回车拆段等）出现时补挂手柄 + 模块钮
      new MutationObserver(muts => {
        const need = muts.some(
          m =>
            m.addedNodes.length &&
            !Array.from(m.addedNodes).every(n => (n as HTMLElement).classList?.contains(HANDLE))
        )
        if (need) {
          injectHandles()
          bindModuleOps()
        }
      }).observe(root, { childList: true, subtree: true })
    }
  })
  onBeforeUnmount(() => {
    document.removeEventListener('selectionchange', onSelectionChange)
    modChannel?.removeEventListener('message', onChannelMsg)
    modChannel?.close()
    clearModOps()
  })

  const fillContent = () => {
    if (editorStore.writable) {
      nextTick(() => {
        ;(DOMTree.value as HTMLElement).innerHTML = (<HTMLElement>(
          queryDOM('.reference-dom')
        )).innerHTML
        injectHandles()
        bindModuleOps()
      })
    }
  }

  // 撤销：恢复上一个 md 快照并从预览 DOM 回填
  const undo = () => {
    const prev = editorStore.undo()
    if (prev == null) return
    editorStore.setMDContent(prev, resumeType)
    nextTick(fillContent)
  }

  onMounted(fillContent)
  onActivated(fillContent)
  return {
    editorStore,
    DOMTree,
    ObserverContent,
    undo
  }
}
