import useEditorStore from '@/store/modules/editor'
import { queryDOM } from '@/utils'
import { resumeDOMStruct2Markdown } from '@/utils/dom2md'
import { nextTick, onActivated, onMounted, ref } from 'vue'
// 使用编辑模式
export function useToggleEditorMode(resumeType: string) {
  const editorStore = useEditorStore(),
    DOMTree = ref<HTMLElement>()

  function ObserverContent() {
    // 克隆序列化：drag-handle 等编辑态辅助元素不进 md
    const clone = DOMTree.value?.cloneNode(true) as HTMLElement
    clone?.querySelectorAll('.' + HANDLE).forEach(e => e.remove())
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
    const targets: Element[] = []
    for (const el of Array.from(root.children)) if (isBlock(el)) targets.push(el)
    for (const mod of Array.from(
      root.querySelectorAll('.resume-module, .head-layout, .main-layout')
    ))
      for (const el of Array.from(mod.children)) if (isBlock(el)) targets.push(el)
    for (const fl of Array.from(root.querySelectorAll('.flex-layout')))
      for (const el of Array.from(fl.children)) if (isBlock(el)) targets.push(el)
    for (const el of targets) {
      if (el.querySelector(':scope > .' + HANDLE)) continue
      el.classList.add('draggable-block')
      const h = document.createElement('div')
      h.className = HANDLE
      h.contentEditable = 'false'
      // 生产版手柄 = ⋮⋮ 拖拽钮 + ＋ 添加内容钮
      const grip = document.createElement('div')
      grip.className = 'drag-btn'
      grip.title = '拖拽移动/节点操作'
      grip.draggable = true
      const add = document.createElement('div')
      add.className = 'add-btn'
      add.title = '添加内容'
      add.addEventListener('click', ev => {
        ev.stopPropagation()
        const p = document.createElement('p')
        p.innerHTML = '<br>'
        el.parentElement?.insertBefore(p, el.nextSibling)
        ObserverContent()
        nextTick(() => {
          const range = document.createRange()
          range.selectNodeContents(p)
          range.collapse(false)
          const sel = window.getSelection()
          sel?.removeAllRanges()
          sel?.addRange(range)
        })
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
        ObserverContent()
      })
      el.appendChild(h)
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

  onMounted(() => {
    const root = DOMTree.value
    if (root) {
      root.addEventListener('dragover', onDragOver)
      // 新建节点（回车拆段等）出现时补挂手柄
      new MutationObserver(muts => {
        const need = muts.some(
          m =>
            m.addedNodes.length &&
            !Array.from(m.addedNodes).every(n => (n as HTMLElement).classList?.contains(HANDLE))
        )
        if (need) injectHandles()
      }).observe(root, { childList: true, subtree: true })
    }
  })

  const fillContent = () => {
    if (editorStore.writable) {
      nextTick(() => {
        ;(DOMTree.value as HTMLElement).innerHTML = (<HTMLElement>(
          queryDOM('.reference-dom')
        )).innerHTML
        injectHandles()
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
