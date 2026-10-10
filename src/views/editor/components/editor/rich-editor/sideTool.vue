<script setup lang="ts">
// 生产同款 side-tool-floating-menu（ProseMirror 引擎版）：
//  - row-actions 模式（点 ⋮⋮ 手柄）: 创建副本/复制为Markdown/复制纯文本 | 上移/下移 | 列块操作 | 删除
//  - insert 模式（点 + 钮）: 正文/模块标题/小标题 + 插入左右布局 + 插入空白符
//  - block 模式（光标停在空段落）: 正文/模块标题/小标题 + 插入左右布局 + 插入空白符
import { onBeforeUnmount, onMounted, reactive, ref } from 'vue'
import { resumeDOMStruct2Markdown } from '@/utils/dom2md'
import { successMessage, errorMessage } from '@/common/message'
import { getPMEditor } from './pm/useEditor'
import { selectIcon, linkFlag } from '../toolbar/hook'
import { reset } from '../toolbar/components/linkInput/hook'
import { pickAndUploadImage } from '@/utils/uploader'
import { INSERT_ITEM_DEFS } from './insertItems'
import type { Node as PMNode } from '@tiptap/pm/model'

interface MenuState {
  visible: boolean
  mode: 'row-actions' | 'insert' | 'block'
  top: number
  left: number
  pos: number
  node: PMNode | null
  el: HTMLElement | null
  gridOpen: boolean
  grid: { row: number; col: number } | null
}
const state = reactive<MenuState>({
  visible: false,
  mode: 'insert',
  top: 0,
  left: 0,
  pos: -1,
  node: null,
  el: null,
  gridOpen: false,
  grid: null
})
const menuRef = ref<HTMLElement>()

// prod add-btn 弹出的是与 slash 完全一致的 22 项 mention-menu（实测菜单文本逐项相同）
const INSERT_ITEMS = INSERT_ITEM_DEFS.map(d => ({ ...d, label: d.zh }))

function open(detail: {
  mode: MenuState['mode']
  pos: number
  node: PMNode
  anchorRect: DOMRect
  el: HTMLElement
}) {
  state.pos = detail.pos
  state.node = detail.node
  state.el = detail.el
  state.mode = detail.mode
  const r = detail.anchorRect
  // 视口下方放不下时翻到锚点上方（菜单最高 ~320px）
  const MENU_H = 320
  const below = window.innerHeight - r.bottom - 8
  state.top = below >= 200 ? r.bottom + 8 : r.top - MENU_H - 8
  if (state.top < 8) state.top = 8
  state.left = Math.max(8, Math.min(window.innerWidth - 185, r.left))
  state.gridOpen = false
  state.grid = null
  state.visible = true
}
function onTrigger(ev: Event) {
  const d = (ev as CustomEvent).detail
  if (d?.node && d.pos != null) open(d)
}
function close() {
  state.visible = false
  state.node = null
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
  window.addEventListener('side-tool-menu-close', close)
  document.addEventListener('mousedown', onDocDown, true)
  document.addEventListener('keydown', onKey)
  document.addEventListener('scroll', close, true)
})
onBeforeUnmount(() => {
  window.removeEventListener('side-tool-menu-trigger', onTrigger)
  window.removeEventListener('side-tool-menu-close', close)
  document.removeEventListener('mousedown', onDocDown, true)
  document.removeEventListener('keydown', onKey)
  document.removeEventListener('scroll', close, true)
})

// ---------- PM 节点工具 ----------
const ed = () => getPMEditor()
function $pos() {
  const e = ed()
  if (!e || state.pos < 0) return null
  return e.state.doc.resolve(Math.min(state.pos, e.state.doc.content.size))
}
const isFirst = () => !$pos()?.nodeBefore
const isLast = () => !$pos()?.nodeAfter
const flexLayoutPosOf = () => {
  // 当前块本身是 flexLayout，或在 flexItem 里（其父是 flexLayout）
  const e = ed()
  const $p = $pos()
  if (!e || !$p) return -1
  const n = state.node
  if (n?.type.name === 'flexLayout') return state.pos
  for (let d = $p.depth; d >= 0; d--) {
    if ($p.node(d).type.name === 'flexLayout') return $p.before(d)
  }
  return -1
}
const inFlex = () => flexLayoutPosOf() >= 0

// 与邻近节点交换（上移/下移）
function swap(dir: -1 | 1) {
  const e = ed()
  const $p = $pos()
  const n = state.node
  if (!e || !$p || !n) return
  const sib = dir < 0 ? $p.nodeBefore : $p.nodeAfter
  if (!sib) return
  const tr = e.state.tr
  if (dir < 0) {
    tr.delete(state.pos, state.pos + n.nodeSize)
    tr.insert(state.pos - sib.nodeSize, n)
  } else {
    tr.delete(state.pos, state.pos + n.nodeSize)
    tr.insert(state.pos + sib.nodeSize, n)
  }
  e.view.dispatch(tr.scrollIntoView())
}

function act(key: string) {
  const e = ed()
  const n = state.node
  if (!e || !n || state.pos < 0) return close()
  const doc = e.state.doc
  switch (key) {
    case 'copy': {
      // 创建副本：紧邻原节点后插入同内容节点
      const ins = Math.min(state.pos + n.nodeSize, doc.content.size)
      e.chain().focus().insertContentAt(ins, n.toJSON()).run()
      break
    }
    case 'copyMd': {
      const el = state.el?.cloneNode(true) as HTMLElement
      el?.querySelectorAll('.drag-handle,.mod-op,.ProseMirror-widget').forEach(x => x.remove())
      navigator.clipboard
        .writeText(
          resumeDOMStruct2Markdown({
            parent: (state.el?.parentElement as HTMLElement) || el,
            node: el,
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
        .writeText(n.textContent)
        .then(() => successMessage('已复制纯文本'))
        .catch(() => undefined)
      break
    }
    case 'moveUp':
      swap(-1)
      break
    case 'moveDown':
      swap(1)
      break
    case 'addCol': {
      const flPos = flexLayoutPosOf()
      const fl = flPos >= 0 ? doc.nodeAt(flPos) : null
      if (fl) {
        e.chain()
          .insertContentAt(flPos + fl.nodeSize - 1, {
            type: 'flexItem',
            content: [{ type: 'paragraph' }]
          })
          .run()
      }
      break
    }
    case 'deleteLastCol': {
      const flPos = flexLayoutPosOf()
      const fl = flPos >= 0 ? doc.nodeAt(flPos) : null
      const last = fl?.lastChild
      if (fl && fl.childCount > 1 && last) {
        const lastPos = flPos + fl.nodeSize - 1 - last.nodeSize
        e.chain()
          .deleteRange({ from: lastPos, to: lastPos + last.nodeSize })
          .run()
      }
      break
    }
    case 'resetLayout': {
      const flPos = flexLayoutPosOf()
      const fl = flPos >= 0 ? doc.nodeAt(flPos) : null
      if (fl) {
        const tr = e.state.tr
        fl.forEach((child, offset) => {
          tr.setNodeMarkup(flPos + 1 + offset, undefined, { ...child.attrs, style: null })
        })
        e.view.dispatch(tr)
      }
      break
    }
    case 'delete':
      e.chain()
        .deleteRange({ from: state.pos, to: state.pos + n.nodeSize })
        .run()
      break
  }
  close()
}

function insert(key: string) {
  const e = ed()
  const n = state.node
  if (!e || !n || state.pos < 0) return close()
  const doc = e.state.doc

  const lv = key.match(/^h(\d)b?$/)?.[1]
  // block 模式：空段落 → 就地转换/替换
  if (state.mode === 'block' && n.type.name === 'paragraph' && !n.textContent.trim()) {
    if (lv) {
      e.chain()
        .focus()
        .setNode('heading', { level: +lv as 1 | 2 | 3 | 4 | 5 | 6 })
        .run()
      return close()
    }
    if (key === 'p') return close()
    if (key === 'nbsp') {
      e.chain()
        .insertContentAt(state.pos + 1, '\u00a0')
        .run()
      return close()
    }
    if (key === 'cols') {
      e.chain()
        .insertContentAt(state.pos, {
          type: 'flexLayout',
          content: [
            { type: 'flexItem', content: [{ type: 'paragraph' }] },
            { type: 'flexItem', content: [{ type: 'paragraph' }] }
          ]
        })
        .run()
      return close()
    }
  }

  // insert 模式：该块之后插入（光标落到插入点，与 slash 菜单同语义）
  const ins = Math.min(state.pos + n.nodeSize, doc.content.size)
  const ch = e.chain().focus()
  switch (key) {
    case 'cols':
      ch.insertContentAt(ins, {
        type: 'flexLayout',
        content: [
          { type: 'flexItem', content: [{ type: 'paragraph' }] },
          { type: 'flexItem', content: [{ type: 'paragraph' }] }
        ]
      }).run()
      break
    case 'icon':
      ch.setTextSelection(ins).run()
      selectIcon.value = true
      break
    case 'img':
      ch.setTextSelection(ins).run()
      void uploadAt('image')
      break
    case 'avatar':
      ch.setTextSelection(ins).run()
      void uploadAt('个人头像', 'cv-avatar-overlay')
      break
    case 'nbsp':
      ch.insertContentAt(ins, {
        type: 'paragraph',
        content: [{ type: 'text', text: '\u00a0' }]
      }).run()
      break
    case 'bold':
      ch.setTextSelection(ins).toggleBold().run()
      break
    case 'italic':
      ch.setTextSelection(ins).toggleItalic().run()
      break
    case 'strike':
      ch.setTextSelection(ins).toggleStrike().run()
      break
    case 'quote':
      ch.insertContentAt(ins, { type: 'blockquote', content: [{ type: 'paragraph' }] }).run()
      break
    case 'hr':
      ch.insertContentAt(ins, { type: 'horizontalRule' }).run()
      break
    case 'tag':
      ch.insertContentAt(ins, {
        type: 'paragraph',
        content: [{ type: 'text', text: '标签', marks: [{ type: 'code' }] }]
      }).run()
      break
    case 'link':
      ch.setTextSelection(ins).run()
      reset()
      linkFlag.value = true
      break
    case 'ol':
      ch.setTextSelection(ins).toggleOrderedList().run()
      break
    case 'ul':
      ch.setTextSelection(ins).toggleBulletList().run()
      break
    case 'table':
      // 点表格式只展开网格子菜单，不执行
      state.gridOpen = true
      return
    default:
      if (lv) ch.insertContentAt(ins, { type: 'heading', attrs: { level: +lv } }).run()
  }
  close()
}

// 插入图片（与 slash 菜单同实现：上传 KV，未登录 dataURL 兜底）
async function uploadAt(alt: string, cls = '') {
  const e = ed()
  if (!e) return
  try {
    const url = await pickAndUploadImage()
    if (!url) return
    e.chain()
      .focus()
      .setImage({ src: url, alt, class: cls || null, style: 'max-width:100%' } as never)
      .run()
    successMessage('图片已插入')
  } catch {
    errorMessage('上传失败')
  }
}
function pickCell(row: number, col: number) {
  const e = ed()
  const n = state.node
  if (!e || !n || state.pos < 0) return close()
  const ins = Math.min(state.pos + n.nodeSize, e.state.doc.content.size)
  e.chain()
    .focus()
    .setTextSelection(ins)
    .insertTable({ rows: row + 1, cols: col + 1, withHeaderRow: true })
    .run()
  close()
}
const GRID = 10
function cellHit(r: number, c: number) {
  return state.grid ? r <= state.grid.row && c <= state.grid.col : false
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
          <template v-if="inFlex() || state.node?.type.name === 'flexLayout'">
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
          <div class="mention-menu">
            <button v-for="it in INSERT_ITEMS" :key="it.key" class="item" @click="insert(it.key)">
              <i class="iconfont item-icon" :class="'icon-' + it.icon"></i>
              <span class="labels"
                ><p>{{ it.label }}</p>
                <sub>{{ it.en }}</sub></span
              >
              <i v-if="it.key === 'table'" class="sub-arrow">&gt;</i>
            </button>
          </div>
          <div v-if="state.gridOpen" class="st-grid">
            <div class="st-grid__label" :class="{ 'is-active': state.grid }">
              {{ state.grid ? `${state.grid.row + 1} x ${state.grid.col + 1}` : '表格' }}
            </div>
            <div class="st-grid__cells" @mouseleave="state.grid = null">
              <button
                v-for="i in GRID * GRID"
                :key="i"
                type="button"
                class="st-grid__cell"
                :class="{ 'is-highlighted': cellHit(Math.floor((i - 1) / GRID), (i - 1) % GRID) }"
                @mouseenter="state.grid = { row: Math.floor((i - 1) / GRID), col: (i - 1) % GRID }"
                @click="pickCell(Math.floor((i - 1) / GRID), (i - 1) % GRID)"
              ></button>
            </div>
          </div>
        </template>
        <template v-else>
          <!-- 生产同款 block-menu 横排胶囊 -->
          <div class="block-menu">
            <button
              v-for="it in [
                { key: 'p', label: '正文' },
                { key: 'h2', label: '模块标题' },
                { key: 'h3', label: '小标题' }
              ]"
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
