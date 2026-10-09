<script setup lang="ts">
// 生产同款 column-resize：flex-layout 相邻卡片边界 ±8px 命中 → 拖拽改两栏百分比宽度
// hover 时显示 .column-resize-line 竖线，拖动中显示 .column-resize-badge 百分比徽标，Esc 取消
import { onBeforeUnmount, onMounted, reactive } from 'vue'
import { getPMEditor } from './pm/useEditor'

interface Hover {
  layout: HTMLElement
  leftEl: HTMLElement
  rightEl: HTMLElement
  boundary: number
  top: number
  height: number
}
const hover = reactive<{ value: Hover | null }>({ value: null })
const badge = reactive({ visible: false, x: 0, y: 0, text: '' })
let drag: {
  leftEl: HTMLElement
  rightEl: HTMLElement
  startX: number
  leftW: number
  rightW: number
  total: number
} | null = null
let saved: {
  leftEl: HTMLElement
  rightEl: HTMLElement
  leftStyle: string
  rightStyle: string
} | null = null

function itemsOf(layout: HTMLElement) {
  return Array.from(layout.children).filter(c =>
    c.classList.contains('flex-layout-item')
  ) as HTMLElement[]
}
function hitTest(layout: HTMLElement, x: number): Hover | null {
  const items = itemsOf(layout)
  for (let i = 0; i < items.length - 1; i++) {
    const a = items[i].getBoundingClientRect()
    const b = items[i + 1].getBoundingClientRect()
    const boundary = (a.right + b.left) / 2
    if (Math.abs(x - boundary) <= 8) {
      return {
        layout,
        leftEl: items[i],
        rightEl: items[i + 1],
        boundary,
        top: Math.min(a.top, b.top),
        height: Math.max(a.bottom, b.bottom) - Math.min(a.top, b.top)
      }
    }
  }
  return null
}
let hoverRaf = 0
let hoverEv: MouseEvent | null = null
function onMove(ev: MouseEvent) {
  if (drag) {
    onDragMove(ev)
    return
  }
  // 全局 mousemove 命中检测 rAF 节流：每帧至多一次 getBoundingClientRect 批读
  hoverEv = ev
  if (hoverRaf) return
  hoverRaf = requestAnimationFrame(() => {
    hoverRaf = 0
    const e2 = hoverEv
    hoverEv = null
    if (!e2) return
    const t = e2.target instanceof Element ? e2.target : null
    const layout = t?.closest('.flex-layout') as HTMLElement | null
    if (!layout || !layout.closest('.writable-edit-mode')) {
      hover.value = null
      return
    }
    hover.value = hitTest(layout, e2.clientX)
  })
}
function startDrag(ev: MouseEvent) {
  if (!hover.value) return
  ev.preventDefault()
  const { leftEl, rightEl } = hover.value
  const a = leftEl.getBoundingClientRect()
  const b = rightEl.getBoundingClientRect()
  saved = {
    leftEl,
    rightEl,
    leftStyle: leftEl.getAttribute('style') || '',
    rightStyle: rightEl.getAttribute('style') || ''
  }
  drag = {
    leftEl,
    rightEl,
    startX: ev.clientX,
    leftW: a.width,
    rightW: b.width,
    total: a.width + b.width
  }
  document.addEventListener('mousemove', onDragMove, true)
  document.addEventListener('mouseup', endDrag, true)
  document.addEventListener('keydown', onKey, true)
}
function applyWidths(leftPct: number, rightPct: number) {
  if (!drag) return
  for (const [el, pct] of [
    [drag.leftEl, leftPct],
    [drag.rightEl, rightPct]
  ] as const) {
    el.style.width = `${pct}%`
    el.style.flex = '0 1 auto'
    el.style.minWidth = '0'
  }
}
function onDragMove(ev: MouseEvent) {
  if (!drag) return
  const dx = ev.clientX - drag.startX
  const total = drag.total
  const leftPx = Math.min(Math.max(drag.leftW + dx, 40), total - 40)
  const leftPct = Math.round((leftPx / total) * 100)
  const rightPct = 100 - leftPct
  applyWidths(leftPct, rightPct)
  const a = drag.leftEl.getBoundingClientRect()
  const b = drag.rightEl.getBoundingClientRect()
  badge.visible = true
  badge.x = (a.right + b.left) / 2
  badge.y = Math.min(a.top, b.top) - 30
  badge.text = `${leftPct} : ${rightPct}`
}
function endDrag() {
  // PM：两栏宽度写进 flexItem 节点 style attr
  const e = getPMEditor()
  if (e && drag) {
    for (const el of [drag.leftEl, drag.rightEl]) {
      try {
        const pos = e.view.posAtDOM(el, -1)
        const node = pos >= 0 ? e.state.doc.nodeAt(pos) : null
        if (node?.type.name === 'flexItem') {
          e.view.dispatch(
            e.state.tr.setNodeMarkup(pos, undefined, {
              ...node.attrs,
              style: el.getAttribute('style') || null
            })
          )
        }
      } catch {
        /* skip */
      }
    }
  }
  cleanup()
}
function onKey(ev: KeyboardEvent) {
  if (ev.key !== 'Escape' || !drag) return
  ev.preventDefault()
  if (saved) {
    saved.leftEl.setAttribute('style', saved.leftStyle)
    saved.rightEl.setAttribute('style', saved.rightStyle)
  }
  cleanup()
}
function cleanup() {
  drag = null
  saved = null
  badge.visible = false
  document.removeEventListener('mousemove', onDragMove, true)
  document.removeEventListener('mouseup', endDrag, true)
  document.removeEventListener('keydown', onKey, true)
}
function sync() {
  // 松手后落回 md
  hover.value?.layout
    ?.closest('.writable-edit-mode')
    ?.dispatchEvent(new Event('input', { bubbles: true }))
}
function wrappedEnd(ev: MouseEvent) {
  endDrag()
  sync()
  void ev
}
onMounted(() => {
  document.addEventListener('mousemove', onMove, true)
})
onBeforeUnmount(() => {
  document.removeEventListener('mousemove', onMove, true)
  if (hoverRaf) cancelAnimationFrame(hoverRaf)
  cleanup()
})
</script>

<template>
  <Teleport to="body">
    <div
      v-if="hover.value && !drag"
      class="column-resize-line"
      :style="{
        top: hover.value.top + 'px',
        left: hover.value.boundary + 'px',
        height: hover.value.height + 'px'
      }"
      @mousedown.prevent="startDrag"
    ></div>
    <div
      v-else-if="drag"
      class="column-resize-line is-active"
      :style="{
        top: hover.value?.top + 'px',
        left: hover.value?.boundary + 'px',
        height: hover.value?.height + 'px'
      }"
      @mouseup="wrappedEnd"
    ></div>
    <div
      v-if="badge.visible"
      class="column-resize-badge"
      :style="{ top: badge.y + 'px', left: badge.x + 'px' }"
    >
      {{ badge.text }}
    </div>
  </Teleport>
</template>

<style lang="scss" scoped>
.column-resize-line {
  position: fixed;
  z-index: 3000;
  width: 9px;
  margin-left: -4px;
  cursor: col-resize;
  &::after {
    content: '';
    position: absolute;
    left: 4px;
    top: 0;
    width: 1px;
    height: 100%;
    background: var(--theme);
    opacity: 0.6;
  }
  &.is-active::after {
    opacity: 1;
  }
}
.column-resize-badge {
  position: fixed;
  z-index: 3001;
  transform: translateX(-50%);
  background: var(--font-color);
  color: var(--background);
  font-size: 11px;
  padding: 2px 8px;
  border-radius: 999px;
  pointer-events: none;
  white-space: nowrap;
}
</style>
