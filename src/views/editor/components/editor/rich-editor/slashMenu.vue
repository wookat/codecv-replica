<script setup lang="ts">
// 生产同款 / 斜杠命令菜单（ProseMirror 引擎版）：行首输入 / 弹出，键入过滤（zh/en），↑↓ 选择，Enter 执行
import { onBeforeUnmount, onMounted, reactive, ref } from 'vue'
import { successMessage, errorMessage } from '@/common/message'
import { pickAndUploadImage } from '@/utils/uploader'
import { INSERT_ITEM_DEFS } from './insertItems'
import { selectIcon, linkFlag } from '../toolbar/hook'
import { reset } from '../toolbar/components/linkInput/hook'
import { getPMEditor } from './pm/useEditor'

interface Item {
  zh: string
  en: string
  icon: string
  act: (...args: number[]) => void | Promise<void>
  sub?: 'table' // prod 同款：表格布局带子菜单网格选择
}
const state = reactive({
  visible: false,
  top: 0,
  left: 0,
  items: [] as Item[],
  index: 0,
  subOpen: false,
  grid: null as { row: number; col: number } | null
})
// `/` 在 PM 文档中的位置（配合 $from 结算）
let slashPos = -1

/* ---------- 光标/PM 工具 ---------- */
const ed = () => getPMEditor()
const editorRoot = () => document.querySelector('.writable-edit-mode') as HTMLElement | null
function caretRect(): DOMRect | null {
  const e = ed()
  if (!e) return null
  return (e.view.coordsAtPos(e.state.selection.from) as unknown as DOMRect)
    ? (() => {
        const c = e.view.coordsAtPos(e.state.selection.from)
        return {
          top: c.top,
          bottom: c.bottom,
          left: c.left,
          right: c.right,
          x: c.left,
          y: c.top,
          width: 0,
          height: c.bottom - c.top,
          toJSON: () => ({})
        } as DOMRect
      })()
    : null
}
// 删除 `/query` 文本并保留光标（PM deleteRange）
function removeQuery() {
  const e = ed()
  if (!e || slashPos < 0) return
  const to = e.state.selection.from
  if (to > slashPos) e.chain().focus().deleteRange({ from: slashPos, to }).run()
  slashPos = -1
}
const chain = () => ed()!.chain().focus()

async function uploadImage(alt: string, cls = '') {
  removeQuery()
  try {
    const url = await pickAndUploadImage()
    if (!url) return
    chain()
      .setImage({ src: url, alt, class: cls || null, style: 'max-width:100%' } as never)
      .run()
    successMessage('图片已插入')
  } catch {
    errorMessage('上传失败')
  }
}
const setHeading = (level: number) => () => {
  removeQuery()
  chain()
    .setNode('heading', { level: level as 1 | 2 | 3 | 4 | 5 | 6 })
    .run()
}
const ACTS: Record<string, (rows?: number, cols?: number) => void> = {
  h2: setHeading(2),
  cols: () => {
    removeQuery()
    chain()
      .insertContent({
        type: 'flexLayout',
        content: [
          { type: 'flexItem', content: [{ type: 'paragraph' }] },
          { type: 'flexItem', content: [{ type: 'paragraph' }] }
        ]
      })
      .run()
  },
  icon: () => {
    removeQuery()
    selectIcon.value = true
  },
  img: () => uploadImage('image'),
  h1: setHeading(1),
  h2b: setHeading(2),
  h3: setHeading(3),
  h4: setHeading(4),
  h5: setHeading(5),
  h6: setHeading(6),
  table: (rows = 3, cols = 3) => {
    removeQuery()
    chain().insertTable({ rows, cols, withHeaderRow: true }).run()
  },
  nbsp: () => {
    removeQuery()
    chain().insertContent('\u00a0').run()
  },
  bold: () => {
    removeQuery()
    chain().toggleBold().run()
  },
  italic: () => {
    removeQuery()
    chain().toggleItalic().run()
  },
  quote: () => {
    removeQuery()
    chain().toggleBlockquote().run()
  },
  hr: () => {
    removeQuery()
    chain().setHorizontalRule().run()
  },
  strike: () => {
    removeQuery()
    chain().toggleStrike().run()
  },
  tag: () => {
    removeQuery()
    chain().insertContent('<code class="single-code">标签</code>').run()
  },
  link: () => {
    removeQuery()
    reset()
    linkFlag.value = true
  },
  ol: () => {
    removeQuery()
    chain().toggleOrderedList().run()
  },
  ul: () => {
    removeQuery()
    chain().toggleBulletList().run()
  },
  avatar: () => uploadImage('个人头像', 'cv-avatar-overlay')
}
const ITEMS: Item[] = INSERT_ITEM_DEFS.map(d => ({
  zh: d.zh,
  en: d.en,
  icon: d.icon,
  sub: d.sub,
  act: ACTS[d.key]
}))

/* ---------- 触发/过滤：PM 选区读 `/` 前缀 ---------- */
function query(): { q: string; pos: number } | null {
  const e = ed()
  if (!e) return null
  const { $from, empty } = e.state.selection
  if (!empty) return null
  const textBefore = $from.parent.textBetween(0, $from.parentOffset, '\0', '\ufffc')
  const m = /(^|\s)\/([^\s/]*)$/.exec(textBefore)
  if (!m) return null
  const pos = $from.pos - m[2].length - 1
  // 只认顶层/包装内的块（排除表格/列表内部）
  for (let d = $from.depth; d > 0; d--) {
    const n = $from.node(d)
    if (['tableCell', 'tableHeader', 'listItem'].includes(n.type.name)) return null
  }
  return { q: m[2], pos }
}
function refresh() {
  const hit = query()
  if (!hit) {
    state.visible = false
    return
  }
  slashPos = hit.pos
  const q = hit.q.toLowerCase()
  state.items = q
    ? ITEMS.filter(i => i.zh.includes(hit.q) || i.en.toLowerCase().includes(q))
    : ITEMS
  if (!state.items.length) {
    state.visible = false
    return
  }
  const r = caretRect()
  if (r) {
    // 视口下方放不下时翻到光标上方（菜单最高 320px）
    const MENU_H = 320
    const below = window.innerHeight - r.bottom - 6
    state.top = below >= Math.min(MENU_H, 200) ? r.bottom + 6 : r.top - MENU_H - 6
    if (state.top < 8) state.top = 8
    state.left = Math.max(8, Math.min(window.innerWidth - 208, r.left))
  }
  state.index = 0
  state.visible = true
}
function close() {
  state.visible = false
}
const listRef = ref<HTMLElement>()
function onKey(ev: KeyboardEvent) {
  if (!state.visible) return
  if (ev.key === 'ArrowDown') {
    ev.preventDefault()
    ev.stopPropagation()
    state.index = (state.index + 1) % state.items.length
  } else if (ev.key === 'ArrowUp') {
    ev.preventDefault()
    ev.stopPropagation()
    state.index = (state.index + state.items.length - 1) % state.items.length
  } else if (ev.key === 'Enter') {
    ev.preventDefault()
    ev.stopPropagation()
    run(state.items[state.index])
  } else if (ev.key === 'Escape') {
    ev.preventDefault()
    close()
  }
  listRef.value?.querySelector('.slash-item.active')?.scrollIntoView({ block: 'nearest' })
}
function run(it: Item, ...args: number[]) {
  if (it.sub) {
    // prod：表格布局点击不执行，只展开网格子菜单
    state.subOpen = true
    return
  }
  close()
  void it.act(...args)
}
// prod TableGridSelector：hover 项若是表格布局 → 右侧弹 10×10 网格
function onItemEnter(i: number) {
  state.index = i
  state.subOpen = !!state.items[i]?.sub
  if (!state.subOpen) state.grid = null
}
function pickCell(row: number, col: number) {
  const it = state.items[state.index]
  close()
  void it?.act(row + 1, col + 1)
}
const GRID_SIZE = 10
function cellHit(r: number, c: number) {
  return state.grid ? r <= state.grid.row && c <= state.grid.col : false
}
function onDocDown(ev: MouseEvent) {
  if (!state.visible) return
  const t = ev.target as HTMLElement
  if (!t.closest?.('.slash-menu-shell')) close()
}
onMounted(() => {
  document.addEventListener('selectionchange', refresh)
  document.addEventListener('keydown', onKey, true)
  document.addEventListener('mousedown', onDocDown, true)
})
onBeforeUnmount(() => {
  document.removeEventListener('selectionchange', refresh)
  document.removeEventListener('keydown', onKey, true)
  document.removeEventListener('mousedown', onDocDown, true)
})
</script>

<template>
  <Teleport to="body">
    <Transition name="slash-pop">
      <div
        v-if="state.visible"
        ref="listRef"
        class="slash-menu-shell mention-menu-shell floating-shadow"
        :style="{ top: state.top + 'px', left: state.left + 'px' }"
      >
        <div class="mention-menu">
          <button
            v-for="(it, i) in state.items"
            :key="it.zh"
            class="slash-item"
            :class="{ active: i === state.index }"
            @mouseenter="onItemEnter(i)"
            @click="run(it)"
          >
            <i class="iconfont item-icon" :class="'icon-' + it.icon"></i>
            <span class="item-text-wrap">
              <p>{{ it.zh }}</p>
              <sub>{{ it.en }}</sub>
            </span>
            <i v-if="it.sub" class="sub-arrow">&gt;</i>
          </button>
        </div>
        <div v-if="state.subOpen" class="table-grid-selector" @mouseenter="state.subOpen = true">
          <div class="table-grid-selector__label" :class="{ 'is-active': state.grid }">
            {{ state.grid ? `${state.grid.row + 1} x ${state.grid.col + 1}` : '表格' }}
          </div>
          <div class="table-grid-selector__grid" @mouseleave="state.grid = null">
            <button
              v-for="i in GRID_SIZE * GRID_SIZE"
              :key="i"
              type="button"
              class="table-grid-selector__cell"
              :class="{
                'is-highlighted': cellHit(Math.floor((i - 1) / GRID_SIZE), (i - 1) % GRID_SIZE)
              }"
              @mouseenter="
                state.grid = { row: Math.floor((i - 1) / GRID_SIZE), col: (i - 1) % GRID_SIZE }
              "
              @click="pickCell(Math.floor((i - 1) / GRID_SIZE), (i - 1) % GRID_SIZE)"
            ></button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style lang="scss" scoped>
.slash-menu-shell {
  position: fixed;
  z-index: 3100;
  width: 200px;
  max-height: 320px;
  overflow-y: auto;
  background: var(--background);
  border-radius: 10px;
  padding: 6px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.14);
  .slash-item {
    display: flex;
    align-items: center;
    width: 100%;
    border: none;
    background: transparent;
    border-radius: 6px;
    padding: 6px 8px;
    cursor: pointer;
    text-align: left;
    color: var(--font-color);
    &.active,
    &:hover {
      background: rgba(0, 0, 0, 0.06);
    }
    .item-icon {
      padding: 6px;
      border-radius: 6px;
      margin-right: 10px;
      font-size: 14px;
      background: rgba(0, 0, 0, 0.04);
    }
    .item-text-wrap {
      flex: 1;
      min-width: 0;
      text-align: left;
      p {
        font-size: 13px;
        line-height: 1.25;
      }
      sub {
        display: block;
        font-size: 10px;
        color: #999;
        line-height: 1.2;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
    }
    .sub-arrow {
      font-style: normal;
      color: #999;
      font-size: 12px;
    }
  }
}
.slash-pop-enter-active,
.slash-pop-leave-active {
  transition: opacity 0.12s, transform 0.12s;
}
.slash-pop-enter-from,
.slash-pop-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}
</style>

<style lang="scss" scoped>
.table-grid-selector {
  position: absolute;
  left: calc(100% + 6px);
  top: 0;
  background: var(--background);
  border-radius: 10px;
  padding: 10px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.14);
  .table-grid-selector__label {
    font-size: 12px;
    color: var(--font-color);
    text-align: center;
    padding: 4px 0 8px;
    &.is-active {
      color: var(--theme);
      font-weight: 600;
    }
  }
  .table-grid-selector__grid {
    display: grid;
    grid-template-columns: repeat(10, 20px);
    gap: 2px;
  }
  .table-grid-selector__cell {
    width: 20px;
    height: 20px;
    border: 1px solid rgba(0, 0, 0, 0.12);
    border-radius: 3px;
    background: rgba(0, 0, 0, 0.02);
    padding: 0;
    cursor: pointer;
    &.is-highlighted {
      background: var(--theme);
      border-color: var(--theme);
      opacity: 0.85;
    }
  }
}
</style>
