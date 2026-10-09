<script setup lang="ts">
// 生产同款 LinkMenu：光标进入链接 → 浮层 [icon + href | 打开链接 | 复制链接 | 移除链接]
import { onBeforeUnmount, onMounted, reactive, ref } from 'vue'
import { successMessage } from '@/common/message'
import { getPMEditor } from './pm/useEditor'

const state = reactive({ visible: false, top: 0, left: 0, href: '' })
const menuRef = ref<HTMLElement>()
let target: HTMLAnchorElement | null = null
let timer = 0

function anchorOf(el: Element | null): HTMLAnchorElement | null {
  return (el?.closest?.('a') as HTMLAnchorElement) || null
}
function onSelectionChange() {
  window.clearTimeout(timer)
  timer = window.setTimeout(() => {
    const sel = window.getSelection()
    if (!sel?.rangeCount) return close()
    const node = sel.anchorNode
    const el = (node?.nodeType === 1 ? node : node?.parentElement) as Element | null
    const a = anchorOf(el)
    if (!a || !a.closest('.writable-edit-mode')) return close()
    target = a
    state.href = a.getAttribute('href') || ''
    const r = a.getBoundingClientRect()
    state.top = r.bottom + 6
    state.left = Math.max(8, Math.min(window.innerWidth - 240, r.left))
    state.visible = true
  }, 120)
}
function onDocDown(ev: MouseEvent) {
  const t = ev.target as HTMLElement
  if (menuRef.value?.contains(t)) return
  if (t.closest?.('a')?.closest?.('.writable-edit-mode')) return
  close()
}
function onKey(ev: KeyboardEvent) {
  if (ev.key === 'Escape') close()
}
function close() {
  state.visible = false
  target = null
}
function openLink() {
  if (state.href) window.open(state.href, '_blank')
  close()
}
function copyLink() {
  navigator.clipboard
    .writeText(state.href)
    .then(() => successMessage('链接已复制'))
    .catch(() => undefined)
  close()
}
function removeLink() {
  const e = getPMEditor()
  if (e) {
    // PM：光标附近的 link mark 全域移除
    const { from } = e.state.selection
    e.chain().focus().setTextSelection(from).extendMarkRange('link').unsetLink().run()
  } else if (target) {
    const frag = document.createDocumentFragment()
    while (target.firstChild) frag.appendChild(target.firstChild)
    target.replaceWith(frag)
    document
      .querySelector('.writable-edit-mode')
      ?.dispatchEvent(new Event('input', { bubbles: true }))
  }
  close()
}
onMounted(() => {
  document.addEventListener('selectionchange', onSelectionChange)
  document.addEventListener('mousedown', onDocDown, true)
  document.addEventListener('keydown', onKey)
})
onBeforeUnmount(() => {
  document.removeEventListener('selectionchange', onSelectionChange)
  document.removeEventListener('mousedown', onDocDown, true)
  document.removeEventListener('keydown', onKey)
})
</script>

<template>
  <Teleport to="body">
    <Transition name="link-pop">
      <div
        v-if="state.visible"
        ref="menuRef"
        class="link-pop"
        :style="{ top: state.top + 'px', left: state.left + 'px' }"
      >
        <i class="iconfont icon-link link-ico"></i>
        <span class="link-href" :title="state.href">{{ state.href }}</span>
        <button class="link-pop-btn" title="打开链接" @click="openLink">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <path d="M15 3h6v6" />
            <path d="M10 14 21 3" />
            <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
          </svg>
        </button>
        <button class="link-pop-btn" title="复制链接" @click="copyLink">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <rect width="14" height="14" x="8" y="8" rx="2" />
            <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" />
          </svg>
        </button>
        <span class="link-pop-divider"></span>
        <button class="link-pop-btn link-pop-danger" title="移除链接" @click="removeLink">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <path d="M3 6h18" />
            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
            <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
          </svg>
        </button>
      </div>
    </Transition>
  </Teleport>
</template>

<style lang="scss" scoped>
.link-pop {
  position: fixed;
  z-index: 3100;
  display: flex;
  align-items: center;
  gap: 4px;
  background: var(--background);
  border-radius: 8px;
  padding: 4px 6px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.14);
  max-width: 320px;
  .link-ico {
    font-size: 12px;
    opacity: 0.5;
    margin-left: 2px;
  }
  .link-href {
    font-size: 12px;
    color: var(--super-link, #337ea9);
    max-width: 160px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .link-pop-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 24px;
    height: 24px;
    border: none;
    background: transparent;
    border-radius: 5px;
    cursor: pointer;
    color: var(--font-color);
    svg {
      width: 14px;
      height: 14px;
    }
    &:hover {
      background: rgba(0, 0, 0, 0.06);
    }
    &.link-pop-danger {
      color: #f56c6c;
    }
  }
  .link-pop-divider {
    width: 1px;
    height: 14px;
    background: rgba(0, 0, 0, 0.1);
  }
}
.link-pop-enter-active,
.link-pop-leave-active {
  transition: opacity 0.15s, transform 0.15s;
}
.link-pop-enter-from,
.link-pop-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}
</style>
