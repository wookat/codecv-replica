// 生产同款 PM 插件（prod 实测契约）：
//  - drag-handle widget 仅挂 doc 顶层块（H1/P/H2/UL/flex-layout/table），
//    类名 `.drag-handle.ProseMirror-widget`，置于块内容起始位（prod DOM 中为块首个子元素）
//  - 模块操作 widget 挂顶层 H2（模块标题）→ 上移/下移/删除该模块
//  - trailingNode：文末保底段落
import { Extension } from '@tiptap/core'
import { Node as PMNode } from '@tiptap/pm/model'
import { Plugin, PluginKey } from '@tiptap/pm/state'
import { Decoration, DecorationSet, EditorView } from '@tiptap/pm/view'

export const HANDLE = 'drag-handle'

// prod 顶层挂手柄的块类型（实测 H1/P/H2/UL.tight/DIV.flex-layout；table 同规则兜底）
const HANDLE_TOP_TYPES = new Set([
  'paragraph',
  'heading',
  'bulletList',
  'orderedList',
  'blockquote',
  'flexLayout',
  'htmlDiv',
  'table',
  'horizontalRule',
  'image'
])

// ---------- drag-handle widget ----------
let dragSrcPos = -1
let dragSrcSize = 0

function blockEl(view: EditorView, pos: number, fallback: HTMLElement) {
  try {
    const got = view.domAtPos(pos).node
    if (got instanceof HTMLElement) return got
    if (got?.parentElement) return got.parentElement
  } catch {
    /* use fallback */
  }
  return fallback
}

function handleDOM(pos: number, node: PMNode, view: EditorView) {
  const h = document.createElement('div')
  h.className = `${HANDLE} ProseMirror-widget`
  h.contentEditable = 'false'

  const grip = document.createElement('div')
  grip.className = 'drag-btn'
  grip.draggable = true
  grip.title = '拖动调整顺序'
  // PM 会吞 widget 区域的真 click → mousedown 触发菜单
  grip.addEventListener('mousedown', ev => {
    ev.stopPropagation()
    window.dispatchEvent(
      new CustomEvent('side-tool-menu-trigger', {
        detail: {
          mode: 'row-actions',
          pos,
          node,
          anchorRect: h.getBoundingClientRect(),
          el: blockEl(view, pos, h)
        }
      })
    )
  })
  grip.addEventListener('dragstart', ev => {
    window.dispatchEvent(new CustomEvent('side-tool-menu-close'))
    dragSrcPos = pos
    dragSrcSize = node.nodeSize
    ev.dataTransfer?.setData('text/plain', '')
    blockEl(view, pos, h).classList.add('is-dragging')
    ev.stopPropagation()
  })
  grip.addEventListener('dragend', () => {
    view.dom.querySelectorAll('.is-dragging').forEach(x => x.classList.remove('is-dragging'))
  })

  const add = document.createElement('div')
  add.className = 'add-btn'
  add.title = '添加内容'
  add.addEventListener('mousedown', ev => {
    ev.stopPropagation()
    window.dispatchEvent(
      new CustomEvent('side-tool-menu-trigger', {
        detail: {
          mode: 'insert',
          pos,
          node,
          anchorRect: h.getBoundingClientRect(),
          el: blockEl(view, pos, h)
        }
      })
    )
  })

  h.appendChild(grip)
  h.appendChild(add)
  return h
}

// 顶层块落点：返回目标块的起始 pos（在目标块之前插入）
function dropTargetPos(view: EditorView, clientY: number) {
  let bestPos = -1
  let bestDist = Infinity
  view.state.doc.forEach((node, pos) => {
    let el: HTMLElement | null = null
    try {
      const got = view.domAtPos(pos).node
      el = got instanceof HTMLElement ? got : got.parentElement
    } catch {
      return
    }
    const r = el?.getBoundingClientRect()
    if (!r || !r.height) return
    const mid = r.top + r.height / 2
    const dist = Math.abs(clientY - mid)
    if (dist < bestDist) {
      bestDist = dist
      bestPos = clientY < mid ? pos : pos + node.nodeSize
    }
  })
  return bestPos
}

export const DragHandle = Extension.create({
  name: 'dragHandle',
  addProseMirrorPlugins() {
    return [
      new Plugin({
        key: new PluginKey('dragHandle'),
        props: {
          decorations(state) {
            const decos: Decoration[] = []
            // prod：仅 doc 顶层块挂手柄（flex-layout-item 等嵌套块无）
            state.doc.forEach((node, pos) => {
              if (!HANDLE_TOP_TYPES.has(node.type.name)) return
              decos.push(
                Decoration.widget(pos + 1, (view: EditorView) => handleDOM(pos, node, view), {
                  key: `dh-${pos}`
                })
              )
            })
            return DecorationSet.create(state.doc, decos)
          },
          handleDOMEvents: {
            drop(view, ev) {
              const e = ev as DragEvent
              if (dragSrcPos < 0) return false
              e.preventDefault()
              const dst = dropTargetPos(view, e.clientY)
              if (dst < 0) {
                dragSrcPos = -1
                return true
              }
              const { state } = view
              const node = state.doc.nodeAt(dragSrcPos)
              if (!node || node.nodeSize !== dragSrcSize) {
                dragSrcPos = -1
                return true
              }
              const tr = state.tr
              const adjDst = dst > dragSrcPos ? dst - dragSrcSize : dst
              if (adjDst === dragSrcPos) {
                dragSrcPos = -1
                return true
              }
              tr.delete(dragSrcPos, dragSrcPos + dragSrcSize)
              const ins = Math.min(Math.max(adjDst, 0), tr.doc.content.size)
              tr.insert(ins, node)
              view.dispatch(tr.scrollIntoView())
              dragSrcPos = -1
              return true
            },
            dragover(view, ev) {
              if (dragSrcPos < 0) return false
              ev.preventDefault()
              return true
            }
          }
        }
      })
    ]
  }
})

// ---------- 模块操作 widget：顶层 H2 挂 上移/下移/删除该模块（prod hover 显隐） ----------
export const ModuleOps = Extension.create({
  name: 'moduleOps',
  addProseMirrorPlugins() {
    const mk = (cls: string, title: string, d: string) => {
      const b = document.createElement('span')
      b.className = `mod-op ${cls}`
      b.title = title
      b.contentEditable = 'false'
      b.innerHTML = `<svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="${d}"/></svg>`
      return b
    }
    return [
      new Plugin({
        key: new PluginKey('moduleOps'),
        props: {
          decorations(state) {
            const decos: Decoration[] = []
            state.doc.forEach((node, pos) => {
              if (node.type.name !== 'heading' || node.attrs.level !== 2) return
              decos.push(
                Decoration.widget(
                  pos + node.nodeSize - 1,
                  () => {
                    const wrap = document.createElement('span')
                    wrap.className = 'mod-ops ProseMirror-widget'
                    wrap.contentEditable = 'false'
                    const down = mk('mod-down', '下移', 'M6 9l6 6 6-6')
                    const up = mk('mod-up', '上移', 'M6 15l6-6 6 6')
                    const del = mk('remove-module', '删除该模块', 'M6 6l12 12M18 6L6 18')
                    down.addEventListener('mousedown', ev => {
                      ev.stopPropagation()
                      window.dispatchEvent(
                        new CustomEvent('module-op', { detail: { op: 'down', pos } })
                      )
                    })
                    up.addEventListener('mousedown', ev => {
                      ev.stopPropagation()
                      window.dispatchEvent(
                        new CustomEvent('module-op', { detail: { op: 'up', pos } })
                      )
                    })
                    del.addEventListener('mousedown', ev => {
                      ev.stopPropagation()
                      window.dispatchEvent(
                        new CustomEvent('module-op', { detail: { op: 'del', pos } })
                      )
                    })
                    wrap.appendChild(down)
                    wrap.appendChild(up)
                    wrap.appendChild(del)
                    return wrap
                  },
                  { key: `mo-${pos}` }
                )
              )
            })
            return DecorationSet.create(state.doc, decos)
          }
        }
      })
    ]
  }
})

// ---------- trailingNode：doc 末尾不是 paragraph 时补空段 ----------
export const TrailingNode = Extension.create({
  name: 'trailingNode',
  addProseMirrorPlugins() {
    return [
      new Plugin({
        key: new PluginKey('trailingNode'),
        appendTransaction(_, __, state) {
          const last = state.doc.lastChild
          if (!last || last.type.name === 'paragraph') return null
          const p = state.schema.nodes.paragraph.create()
          return state.tr.insert(state.doc.content.size, p)
        }
      })
    ]
  }
})

// ---------- 工具：按 DOM 元素找 PM pos ----------
export function posOfElement(view: EditorView, el: HTMLElement) {
  let pos = -1
  view.state.doc.descendants((node, p) => {
    if (pos >= 0) return false
    try {
      const dom = view.domAtPos(p).node as HTMLElement
      if (dom === el) pos = p
    } catch {
      /* skip */
    }
    return true
  })
  return pos
}
