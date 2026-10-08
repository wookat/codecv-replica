<script setup lang="ts">
// 生产同款 / 斜杠命令菜单：行首输入 / 弹出，键入过滤（zh/en），↑↓ 选择，Enter 执行
import { onBeforeUnmount, onMounted, reactive, ref } from 'vue'
import { successMessage, errorMessage } from '@/common/message'
import { getLocalStorage } from '@/common/localstorage'
import { TOKEN } from '@/store/modules/user'
import { getPickerFile } from '@/utils/uploader'
import { selectIcon, linkFlag } from '../toolbar/hook'
import { reset } from '../toolbar/components/linkInput/hook'

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
let anchorNode: Node | null = null // 命中的文本节点
let matchStart = 0 // `/` 在文本中的下标

/* ---------- 光标/工具 ---------- */
const editorRoot = () => document.querySelector('.writable-edit-mode') as HTMLElement | null
function sync() {
  editorRoot()?.dispatchEvent(new Event('input', { bubbles: true }))
}
function caretRect(): DOMRect | null {
  const sel = window.getSelection()
  if (!sel?.rangeCount) return null
  const r = sel.getRangeAt(0).cloneRange()
  r.collapse(true)
  const rects = r.getClientRects()
  if (rects.length) return rects[0]
  const el = (
    r.startContainer.nodeType === 1 ? r.startContainer : r.startContainer.parentElement
  ) as HTMLElement | null
  return el?.getBoundingClientRect() || null
}
function blockOf(node: Node | null): HTMLElement | null {
  let el = (node?.nodeType === 1 ? node : node?.parentElement) as HTMLElement | null
  const root = editorRoot()
  while (el && el !== root && !/^(H[1-6]|P|UL|OL|BLOCKQUOTE|PRE|TABLE|DIV)$/.test(el.tagName)) {
    el = el.parentElement
  }
  return el && el !== root ? el : null
}
// 删除 `/query` 文本并把光标留在该处
function removeQuery() {
  if (!anchorNode || anchorNode.nodeType !== 3) return
  const text = anchorNode as Text
  const sel = window.getSelection()
  const caret = sel?.anchorOffset ?? text.length
  text.data = text.data.slice(0, matchStart) + text.data.slice(caret)
  if (!text.data.trim() && text.parentElement && text.parentElement.childNodes.length === 1) {
    // 空段保留（光标留在空块里）
  }
  const r = document.createRange()
  r.setStart(text, matchStart)
  r.collapse(true)
  sel?.removeAllRanges()
  sel?.addRange(r)
}
function placeCaret(el: Node) {
  const r = document.createRange()
  r.selectNodeContents(el)
  r.collapse(false)
  const s = window.getSelection()
  s?.removeAllRanges()
  s?.addRange(r)
}
function convertBlock(tag: string) {
  const block = blockOf(anchorNode)
  removeQuery()
  if (block && block.tagName !== tag.toUpperCase()) {
    const el = document.createElement(tag)
    for (const c of Array.from(block.childNodes)) {
      if ((c as HTMLElement).classList?.contains('drag-handle')) continue
      el.appendChild(c)
    }
    block.replaceWith(el)
    placeCaret(el)
  }
  sync()
}
function insertNode(node: Node, caretAfter = true) {
  removeQuery()
  const sel = window.getSelection()
  let r = sel?.rangeCount ? sel.getRangeAt(0) : null
  if (!r || !editorRoot()?.contains(r.commonAncestorContainer)) {
    r = document.createRange()
    r.selectNodeContents(editorRoot() as Node)
    r.collapse(false)
  }
  r.deleteContents()
  r.insertNode(node)
  if (caretAfter) placeCaret(node)
  sync()
}
function exec(cmd: string, arg?: string) {
  removeQuery()
  document.execCommand(cmd, false, arg)
  sync()
}
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
    const img = document.createElement('img')
    img.src = url
    img.alt = alt
    img.style.maxWidth = '100%'
    if (cls) img.className = cls
    insertNode(img)
    successMessage('图片已插入')
  } catch {
    errorMessage('上传失败')
  }
}
const setHeading = (level: number) => () => convertBlock(`h${level}`)
const ITEMS: Item[] = [
  { zh: '模块标题', en: 'jianlimokuaibiaoti', icon: 'wrongly', act: setHeading(2) },
  {
    zh: '左右布局',
    en: 'zuoyoubuju/column',
    icon: 'columns',
    act: () => {
      const wrap = document.createElement('div')
      wrap.className = 'flex-layout'
      wrap.innerHTML =
        '<div class="flex-layout-item"><p><br></p></div><div class="flex-layout-item"><p><br></p></div>'
      insertNode(wrap, false)
      placeCaret(wrap.querySelector('.flex-layout-item p') || wrap)
      sync()
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
      const table = document.createElement('table')
      table.style.width = '100%'
      const tbody = document.createElement('tbody')
      for (let r = 0; r < rows; r++) {
        const tr = document.createElement('tr')
        for (let c = 0; c < cols; c++) {
          const cell = document.createElement(r === 0 ? 'th' : 'td')
          cell.innerHTML = '<br>'
          tr.appendChild(cell)
        }
        tbody.appendChild(tr)
      }
      table.appendChild(tbody)
      insertNode(table, false)
      const p = document.createElement('p')
      p.innerHTML = '<br>'
      insertNode(p)
    }
  },
  {
    zh: '插入空白符',
    en: 'kongbaifu/space',
    icon: 'space',
    act: () => insertNode(document.createTextNode(' '))
  },
  { zh: '加粗', en: 'jiacu/bold', icon: 'bold', act: () => exec('bold') },
  { zh: '斜体', en: 'xieti/italic', icon: 'italic', act: () => exec('italic') },
  { zh: '引用', en: 'yinyong/quote', icon: 'quote', act: () => exec('formatBlock', 'blockquote') },
  {
    zh: '水平分割线',
    en: 'fengexian/horizontal',
    icon: 'segment',
    act: () => {
      insertNode(document.createElement('hr'))
      const p = document.createElement('p')
      p.innerHTML = '<br>'
      insertNode(p)
    }
  },
  { zh: '删除线', en: 'shanchuxian/', icon: 'strike', act: () => exec('strikeThrough') },
  {
    zh: '标签',
    en: 'biaoqian/code',
    icon: 'code',
    act: () => {
      removeQuery()
      const code = document.createElement('code')
      code.className = 'single-code'
      code.textContent = '标签'
      insertNode(code, false)
      placeCaret(code)
      const sel = window.getSelection()
      sel?.selectAllChildren(code)
      sync()
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
    act: () => exec('insertOrderedList')
  },
  {
    zh: '无序列表',
    en: 'wuxuliebiao/unorderlist',
    icon: 'unorderedlist',
    act: () => exec('insertUnorderedList')
  },
  {
    zh: '头像上传',
    en: 'touxiang/image',
    icon: 'user',
    act: () => uploadImage('个人头像', 'cv-avatar-overlay')
  }
]

/* ---------- 触发/过滤 ---------- */
function query(): { q: string; node: Text; start: number } | null {
  const sel = window.getSelection()
  if (!sel?.isCollapsed || !sel.rangeCount) return null
  const n = sel.anchorNode
  if (!n || n.nodeType !== 3) return null
  if (!editorRoot()?.contains(n)) return null
  const before = (n as Text).data.slice(0, sel.anchorOffset)
  const m = /(^|\s)\/([^\s/]*)$/.exec(before)
  if (!m) return null
  return { q: m[2], node: n as Text, start: sel.anchorOffset - m[2].length - 1 }
}
function refresh() {
  const hit = query()
  if (!hit) {
    state.visible = false
    return
  }
  anchorNode = hit.node
  matchStart = hit.start
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
    padding: 6px 8px;
    border-radius: 6px;
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
