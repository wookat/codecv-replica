<script setup lang="ts">
// 生产同款 / 斜杠命令菜单（ProseMirror 引擎版）：行首输入 / 弹出，键入过滤（zh/en），↑↓ 选择，Enter 执行
import { onBeforeUnmount, onMounted, reactive, ref } from 'vue'
import { successMessage, errorMessage } from '@/common/message'
import { getLocalStorage } from '@/common/localstorage'
import { TOKEN } from '@/store/modules/user'
import { getPickerFile } from '@/utils/uploader'
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
    const file = await getPickerFile({ multiple: false, accept: '.png,.jpg,.jpeg,.webp' })
    if (!file) return
    const token = (getLocalStorage(TOKEN) as string) || ''
    const fd = new FormData()
    fd.append('file', file)
    const res = await fetch('/api/upload', {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      body: fd
    })
    let url = ''
    if (res.ok) {
      const data = await res.json()
      if (data.code === 200) url = data.url
    }
    if (!url) {
      // 未登录/上传失败 → data URL 兜底
      url = await new Promise<string>((resolve, reject) => {
        const fr = new FileReader()
        fr.onload = () => resolve(String(fr.result))
        fr.onerror = reject
        fr.readAsDataURL(file)
      })
    }
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
const ITEMS: Item[] = [
  { zh: '模块标题', en: 'jianlimokuaibiaoti', icon: 'wrongly', act: setHeading(2) },
  {
    zh: '左右布局',
    en: 'zuoyoubuju/column',
    icon: 'columns',
    act: () => {
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
    }
  },
  {
    zh: '插入图标',
    en: 'charutubiao/icon',
    icon: 'emoji',
    act: () => {
      removeQuery()
      selectIcon.value = true
    }
  },
  {
    zh: '插入图片',
    en: 'tupian/image',
    icon: 'image',
    act: () => uploadImage('image')
  },
  { zh: '一级标题', en: 'yijibiaoti/heading', icon: 'head', act: setHeading(1) },
  { zh: '二级标题', en: 'erjibiaoti/heading', icon: 'head', act: setHeading(2) },
  { zh: '三级标题', en: 'sanjibiaoti/heading', icon: 'head', act: setHeading(3) },
  { zh: '四级标题', en: 'sijibiaoti/heading', icon: 'head', act: setHeading(4) },
  { zh: '五级标题', en: 'wujibiaoti/heading', icon: 'head', act: setHeading(5) },
  { zh: '六级标题', en: 'liujibiaoti/heading', icon: 'head', act: setHeading(6) },
  {
    zh: '表格布局',
    en: 'biaogebuju/table',
    icon: 'table',
    sub: 'table',
    act: (rows = 3, cols = 3) => {
      // prod: insertTable({rows,cols,withHeaderRow:true})
      removeQuery()
      chain().insertTable({ rows, cols, withHeaderRow: true }).run()
    }
  },
  {
    zh: '插入空白符',
    en: 'kongbaifu/space',
    icon: 'space',
    act: () => {
      removeQuery()
      chain().insertContent('\u00a0').run()
    }
  },
  {
    zh: '加粗',
    en: 'jiacu/bold',
    icon: 'bold',
    act: () => {
      removeQuery()
      chain().toggleBold().run()
    }
  },
  {
    zh: '斜体',
    en: 'xieti/italic',
    icon: 'italic',
    act: () => {
      removeQuery()
      chain().toggleItalic().run()
    }
  },
  {
    zh: '引用',
    en: 'yinyong/quote',
    icon: 'quote',
    act: () => {
      removeQuery()
      chain().toggleBlockquote().run()
    }
  },
  {
    zh: '水平分割线',
    en: 'fengexian/horizontal',
    icon: 'segment',
    act: () => {
      removeQuery()
      chain().setHorizontalRule().run()
    }
  },
  {
    zh: '删除线',
    en: 'shanchuxian/',
    icon: 'strike',
    act: () => {
      removeQuery()
      chain().toggleStrike().run()
    }
  },
  {
    zh: '标签',
    en: 'biaoqian/code',
    icon: 'code',
    act: () => {
      removeQuery()
      chain().insertContent('<code class="single-code">标签</code>').run()
    }
  },
  {
    zh: '插入链接',
    en: 'charulianjie/link',
    icon: 'link',
    act: () => {
      removeQuery()
      reset()
      linkFlag.value = true
    }
  },
  {
    zh: '有序列表',
    en: 'youxuliebiao/orderlist',
    icon: 'orderedlist',
    act: () => {
      removeQuery()
      chain().toggleOrderedList().run()
    }
  },
  {
    zh: '无序列表',
    en: 'wuxuliebiao/unorderlist',
    icon: 'unorderedlist',
    act: () => {
      removeQuery()
      chain().toggleBulletList().run()
    }
  },
  {
    zh: '头像上传',
    en: 'touxiang/image',
    icon: 'user',
    act: () => uploadImage('个人头像', 'cv-avatar-overlay')
  }
]

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
    state.top = r.bottom + 6
    state.left = Math.max(8, Math.min(window.innerWidth - 200, r.left))
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
        class="slash-menu-shell mention-menu floating-shadow"
        :style="{ top: state.top + 'px', left: state.left + 'px' }"
      >
        <button
          v-for="(it, i) in state.items"
          :key="it.zh"
          class="slash-item"
          :class="{ active: i === state.index }"
          @mouseenter="onItemEnter(i)"
          @click="run(it)"
        >
          <i class="iconfont item-icon" :class="'icon-' + it.icon"></i>
          <p>{{ it.zh }}</p>
          <sub>{{ it.en }}</sub>
        </button>
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
    p {
      font-size: 13px;
      line-height: 1.2;
    }
    sub {
      font-size: 10px;
      color: #999;
      margin-left: 4px;
      max-width: 90px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
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
