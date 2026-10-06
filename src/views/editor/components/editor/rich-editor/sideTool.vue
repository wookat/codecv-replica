<script setup lang="ts">
// 生产同款 side-tool-floating-menu：
//  - row-actions 模式（点 ⋮⋮ 手柄）: 创建副本/复制为Markdown/复制纯文本 | 上移/下移 | 列块操作 | 删除
//  - insert 模式（点 + 钮）: 正文/模块标题/小标题 + 插入左右布局 + 插入空白符
//  - block 模式（光标停在空段落）: 正文/模块标题/小标题 + 插入左右布局 + 插入空白符
import { nextTick, onBeforeUnmount, onMounted, reactive, ref } from 'vue'
import { resumeDOMStruct2Markdown } from '@/utils/dom2md'
import { successMessage } from '@/common/message'

interface MenuState {
  visible: boolean
  mode: 'row-actions' | 'insert' | 'block'
  top: number
  left: number
  block: HTMLElement | null
}
const state = reactive<MenuState>({ visible: false, mode: 'insert', top: 0, left: 0, block: null })
const menuRef = ref<HTMLElement>()

const INSERT_ITEMS = [
  { key: 'p', label: '正文', en: 'zhengwen/paragraph' },
  { key: 'h2', label: '模块标题', en: 'erjibiaoti/heading' },
  { key: 'h3', label: '小标题', en: 'sanjibiaoti/heading' },
  { key: 'cols', label: '插入左右布局', en: 'multi columns', icon: true },
  { key: 'nbsp', label: '插入空白符，保留空行', en: 'insert nbsp', icon: true }
]

function open(detail: { mode: MenuState['mode']; block: HTMLElement; anchorRect: DOMRect }) {
  state.block = detail.block
  state.mode = detail.mode
  const r = detail.anchorRect
  state.top = Math.min(window.innerHeight - 320, r.bottom + 8)
  state.left = Math.max(8, Math.min(window.innerWidth - 185, r.left))
  state.visible = true
}
function onTrigger(ev: Event) {
  const d = (ev as CustomEvent).detail
  if (d?.block) open(d)
}
function close() {
  state.visible = false
  state.block = null
}
function onDocDown(ev: MouseEvent) {
  const t = ev.target as HTMLElement
  if (menuRef.value?.contains(t)) return
  if (t.closest?.('.drag-handle')) return
  close()
}
function onKey(ev: KeyboardEvent) {
  if (ev.key === 'Escape') close()
}
onMounted(() => {
  window.addEventListener('side-tool-menu-trigger', onTrigger)
  document.addEventListener('mousedown', onDocDown, true)
  document.addEventListener('keydown', onKey)
  document.addEventListener('scroll', close, true)
})
onBeforeUnmount(() => {
  window.removeEventListener('side-tool-menu-trigger', onTrigger)
  document.removeEventListener('mousedown', onDocDown, true)
  document.removeEventListener('keydown', onKey)
  document.removeEventListener('scroll', close, true)
})

function siblings(): HTMLElement[] {
  const b = state.block
  if (!b?.parentElement) return []
  return Array.from(b.parentElement.children).filter(
    c => !c.classList.contains('drag-handle')
  ) as HTMLElement[]
}
const isFirst = () => siblings()[0] === state.block
const isLast = () => siblings()[siblings().length - 1] === state.block
const inFlex = () => !!state.block?.parentElement?.classList.contains('flex-layout')

function sync() {
  // 变更落回 md：交给编辑器 input 监听（writable 模式 input 冒泡已接 ObserverContent）
  const b = state.block
  if (!b) return
  const root = b.closest('.writable-edit-mode')
  nextTick(() => root?.dispatchEvent(new Event('input', { bubbles: true })))
}

function act(key: string) {
  const b = state.block
  if (!b) return close()
  switch (key) {
    case 'copy': {
      const c = b.cloneNode(true) as HTMLElement
      c.querySelectorAll('.drag-handle').forEach(e => e.remove())
      b.parentElement?.insertBefore(c, b.nextSibling)
      break
    }
    case 'copyMd': {
      const c = b.cloneNode(true) as HTMLElement
      c.querySelectorAll('.drag-handle').forEach(e => e.remove())
      navigator.clipboard
        .writeText(
          resumeDOMStruct2Markdown({
            parent: (b.parentElement as HTMLElement) || c,
            node: c,
            latest: true,
            uid: 0,
            whiteSpace: 0
          })
        )
        .then(() => successMessage('已复制为 Markdown'))
        .catch(() => undefined)
      break
    }
    case 'copyText': {
      navigator.clipboard
        .writeText(b.innerText)
        .then(() => successMessage('已复制纯文本'))
        .catch(() => undefined)
      break
    }
    case 'moveUp':
      b.previousElementSibling?.before(b)
      break
    case 'moveDown':
      b.nextElementSibling?.after(b)
      break
    case 'addCol': {
      const fl = b.classList.contains('flex-layout') ? b : b.closest('.flex-layout')
      if (fl) {
        const item = document.createElement('div')
        item.className = 'flex-layout-item'
        item.innerHTML = '<p><br></p>'
        fl.appendChild(item)
      }
      break
    }
    case 'deleteLastCol': {
      const fl = b.classList.contains('flex-layout') ? b : b.closest('.flex-layout')
      const items = fl?.querySelectorAll(':scope > .flex-layout-item')
      if (items && items.length > 1) items[items.length - 1].remove()
      break
    }
    case 'resetLayout': {
      const fl = b.classList.contains('flex-layout') ? b : b.closest('.flex-layout')
      fl?.querySelectorAll(':scope > .flex-layout-item').forEach(i => {
        ;(i as HTMLElement).style.flex = ''
      })
      break
    }
    case 'delete':
      b.remove()
      break
  }
  close()
  sync()
}

function insert(key: string) {
  const b = state.block
  if (!b) return close()
  if (state.mode === 'block' && b.tagName === 'P' && !b.textContent?.trim()) {
    // 空块转换类型
    if (key === 'p') {
      close()
      return
    }
    if (key === 'h2' || key === 'h3') {
      const h = document.createElement(key)
      h.innerHTML = '<br>'
      b.replaceWith(h)
      placeCaret(h)
      close()
      sync()
      return
    }
    if (key === 'nbsp') {
      b.innerHTML = '&nbsp;'
      close()
      sync()
      return
    }
    if (key === 'cols') {
      const fl = document.createElement('div')
      fl.className = 'flex-layout'
      fl.innerHTML =
        '<div class="flex-layout-item"><p><br></p></div><div class="flex-layout-item"><p><br></p></div>'
      b.replaceWith(fl)
      const p = fl.querySelector('p')
      if (p) placeCaret(p)
      close()
      sync()
      return
    }
    close()
    return
  }
  // insert 模式：在该块之后插入
  const mk = (el: HTMLElement) => {
    b.parentElement?.insertBefore(el, b.nextSibling)
    return el
  }
  if (key === 'p' || key === 'h2' || key === 'h3') {
    const el = document.createElement(key === 'p' ? 'p' : key)
    el.innerHTML = '<br>'
    mk(el)
    placeCaret(el)
  } else if (key === 'cols') {
    const fl = document.createElement('div')
    fl.className = 'flex-layout'
    fl.innerHTML =
      '<div class="flex-layout-item"><p><br></p></div><div class="flex-layout-item"><p><br></p></div>'
    mk(fl)
    const p = fl.querySelector('p')
    if (p) placeCaret(p)
  } else if (key === 'nbsp') {
    const el = document.createElement('p')
    el.innerHTML = '&nbsp;'
    mk(el)
    placeCaret(el)
  }
  close()
  sync()
}

function placeCaret(el: HTMLElement) {
  nextTick(() => {
    const range = document.createRange()
    range.selectNodeContents(el)
    range.collapse(false)
    const sel = window.getSelection()
    sel?.removeAllRanges()
    sel?.addRange(range)
  })
}
</script>

<template>
  <Teleport to="body">
    <Transition name="side-tool-menu">
      <div
        v-if="state.visible"
        ref="menuRef"
        class="side-tool-floating-menu floating-shadow"
        :style="{ top: state.top + 'px', left: state.left + 'px' }"
      >
        <template v-if="state.mode === 'row-actions'">
          <button class="item" @click="act('copy')">
            <i class="iconfont icon-copy item-icon"></i><span>创建副本</span>
          </button>
          <button class="item" @click="act('copyMd')">
            <i class="iconfont icon-code item-icon"></i><span>复制为 Markdown</span>
          </button>
          <button class="item" @click="act('copyText')">
            <svg
              class="item-svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
            >
              <path d="M4 7V5a2 2 0 012-2h12a2 2 0 012 2v2M9 20h6M12 4v16" /></svg
            ><span>复制纯文本</span>
          </button>
          <div class="divider"></div>
          <button class="item" :disabled="isFirst()" @click="act('moveUp')">
            <svg
              class="item-svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
            >
              <path d="M12 19V5m-7 7l7-7 7 7" /></svg
            ><span>上移</span>
          </button>
          <button class="item" :disabled="isLast()" @click="act('moveDown')">
            <svg
              class="item-svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
            >
              <path d="M12 5v14m-7-7l7 7 7-7" /></svg
            ><span>下移</span>
          </button>
          <template v-if="inFlex() || state.block?.classList.contains('flex-layout')">
            <div class="divider"></div>
            <button class="item" @click="act('addCol')">
              <i class="iconfont icon-add item-icon"></i><span>右侧加一列</span>
            </button>
            <button class="item" @click="act('deleteLastCol')">
              <i class="iconfont icon-decre item-icon"></i><span>删除末列</span>
            </button>
            <button class="item" @click="act('resetLayout')">
              <i class="iconfont icon-undo item-icon"></i><span>重置布局</span>
            </button>
          </template>
          <div class="divider"></div>
          <button class="item danger" @click="act('delete')">
            <i class="iconfont icon-delete item-icon"></i><span>删除</span>
          </button>
        </template>
        <template v-else-if="state.mode === 'insert'">
          <button v-for="it in INSERT_ITEMS" :key="it.key" class="item" @click="insert(it.key)">
            <i
              v-if="it.icon"
              class="iconfont item-icon"
              :class="it.key === 'cols' ? 'icon-columns' : 'icon-space'"
            ></i>
            <span v-else class="item-text">{{
              it.key === 'p' ? '正文' : it.key.toUpperCase()
            }}</span>
            <span class="labels"
              ><p>{{ it.label }}</p>
              <sub>{{ it.en }}</sub></span
            >
          </button>
        </template>
        <template v-else>
          <!-- 生产同款 block-menu 横排胶囊 -->
          <div class="block-menu">
            <button
              v-for="it in INSERT_ITEMS.slice(0, 3)"
              :key="it.key"
              class="block-menu-item"
              @click="insert(it.key)"
            >
              {{ it.label }}
            </button>
            <button class="block-menu-item" title="插入左右布局" @click="insert('cols')">
              <i class="iconfont icon-columns"></i>
            </button>
            <button
              class="block-menu-item"
              title="插入空白符，保留空行用于排版留白"
              @click="insert('nbsp')"
            >
              <i class="iconfont icon-space"></i>
            </button>
          </div>
        </template>
      </div>
    </Transition>
  </Teleport>
</template>

<style lang="scss" scoped>
.side-tool-floating-menu {
  position: fixed;
  z-index: 3100;
  width: 175px;
  max-height: 355px;
  overflow-y: auto;
  background: var(--background);
  border-radius: 10px;
  padding: 6px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.12);
  .item {
    display: flex;
    align-items: center;
    width: 100%;
    border: none;
    background: transparent;
    border-radius: 6px;
    padding: 4px;
    cursor: pointer;
    font-size: 13px;
    color: var(--font-color);
    text-align: left;
    &:hover {
      background: rgba(0, 0, 0, 0.04);
    }
    &:disabled {
      opacity: 0.4;
      cursor: not-allowed;
    }
    &.danger {
      color: #f56c6c;
    }
    .item-icon {
      padding: 6px;
      border-radius: 6px;
      margin-right: 10px;
      font-size: 14px;
    }
    .item-text {
      min-width: 26px;
      padding: 4px 6px;
      margin-right: 10px;
      border-radius: 6px;
      font-weight: 700;
      font-size: 12px;
      background: rgba(0, 0, 0, 0.04);
      text-align: center;
    }
    .labels {
      p {
        margin: 0;
        line-height: 1.4;
      }
      sub {
        color: #999;
        font-size: 11px;
        display: block;
      }
    }
    .item-svg {
      width: 14px;
      height: 14px;
      padding: 6px;
      border-radius: 6px;
      margin-right: 10px;
      flex: none;
    }
  }
  .divider {
    height: 1px;
    background: rgba(0, 0, 0, 0.08);
    margin: 4px 6px;
  }
}
// 生产 block-menu 横排胶囊样式
.block-menu {
  display: flex;
  align-items: center;
  gap: 2px;
  padding: 4px;
  border-radius: 8px;
  background: var(--background);
  width: auto;
  .block-menu-item {
    border: none;
    background: transparent;
    padding: 4px 8px;
    border-radius: 6px;
    font-size: 12px;
    color: var(--font-color);
    cursor: pointer;
    white-space: nowrap;
    &:hover {
      background: rgba(0, 0, 0, 0.06);
    }
    &.is-active {
      background: var(--theme);
      color: #fff;
    }
  }
}
.side-tool-menu-enter-active,
.side-tool-menu-leave-active {
  transition: opacity 0.16s, transform 0.16s;
}
.side-tool-menu-enter-from,
.side-tool-menu-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}
</style>
