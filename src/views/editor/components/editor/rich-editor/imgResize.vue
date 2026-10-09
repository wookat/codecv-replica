<script setup lang="ts">
// 生产同款 resizable-image：点击编辑器内图片 → 框选 + 右下角拖拽手柄缩放（宽度百分比）
import { onBeforeUnmount, onMounted, reactive } from 'vue'
import { getPMEditor } from './pm/useEditor'

const state = reactive({ visible: false, top: 0, left: 0, width: 0, height: 0 })
let target: HTMLImageElement | null = null
let drag: { startX: number; startW: number; containerW: number } | null = null

function frame() {
  if (!target) return
  const r = target.getBoundingClientRect()
  state.top = r.top
  state.left = r.left
  state.width = r.width
  state.height = r.height
}
function onDocClick(ev: MouseEvent) {
  const t = ev.target as HTMLElement
  if (t.classList?.contains('img-resize-handle')) return
  const img = t.closest?.('.writable-edit-mode img') as HTMLImageElement | null
  if (
    img &&
    !img.classList.contains('cv-avatar-overlay') &&
    !img.classList.contains('cv-badge-overlay')
  ) {
    target = img
    frame()
    state.visible = true
    return
  }
  close()
}
function close() {
  state.visible = false
  target = null
}
function onScrollOrResize() {
  if (state.visible) frame()
}
function startDrag(ev: MouseEvent) {
  if (!target) return
  ev.preventDefault()
  ev.stopPropagation()
  const container = target.closest('.writable-edit-mode')
  drag = {
    startX: ev.clientX,
    startW: target.getBoundingClientRect().width,
    containerW: container?.getBoundingClientRect().width || 1
  }
  document.addEventListener('mousemove', onMove, true)
  document.addEventListener('mouseup', endDrag, true)
}
function onMove(ev: MouseEvent) {
  if (!drag || !target) return
  const w = Math.max(40, drag.startW + (ev.clientX - drag.startX))
  const pct = Math.min(100, Math.round((w / drag.containerW) * 100))
  target.style.width = `${pct}%`
  target.style.maxWidth = '100%'
  frame()
}
function endDrag() {
  drag = null
  document.removeEventListener('mousemove', onMove, true)
  document.removeEventListener('mouseup', endDrag, true)
  // PM：style 落进 image 节点 attrs，防止下次渲染回滚
  const e = getPMEditor()
  if (e && target) {
    try {
      const pos = e.view.posAtDOM(target, -1)
      const node = pos >= 0 ? e.state.doc.nodeAt(pos) : null
      if (node?.type.name === 'image') {
        e.view.dispatch(
          e.state.tr.setNodeMarkup(pos, undefined, {
            ...node.attrs,
            style: target.getAttribute('style') || null
          })
        )
        frame()
        return
      }
    } catch {
      /* fallback */
    }
  }
  target?.closest('.writable-edit-mode')?.dispatchEvent(new Event('input', { bubbles: true }))
}
onMounted(() => {
  document.addEventListener('click', onDocClick, true)
  document.addEventListener('scroll', onScrollOrResize, true)
  window.addEventListener('resize', onScrollOrResize)
})
onBeforeUnmount(() => {
  document.removeEventListener('click', onDocClick, true)
  document.removeEventListener('scroll', onScrollOrResize, true)
  window.removeEventListener('resize', onScrollOrResize)
})
</script>

<template>
  <Teleport to="body">
    <div
      v-if="state.visible"
      class="resizable-image-frame"
      :style="{
        top: state.top + 'px',
        left: state.left + 'px',
        width: state.width + 'px',
        height: state.height + 'px'
      }"
    >
      <span class="img-resize-handle" @mousedown="startDrag"></span>
    </div>
  </Teleport>
</template>

<style lang="scss" scoped>
.resizable-image-frame {
  position: fixed;
  z-index: 3000;
  border: 2px solid var(--theme);
  border-radius: 4px;
  pointer-events: none;
  .img-resize-handle {
    position: absolute;
    right: -7px;
    bottom: -7px;
    width: 14px;
    height: 14px;
    border-radius: 50%;
    background: var(--theme);
    border: 2px solid #fff;
    cursor: nwse-resize;
    pointer-events: auto;
  }
}
</style>
