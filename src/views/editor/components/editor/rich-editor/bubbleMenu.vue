<script setup lang="ts">
// 生产同款选中文本浮动菜单（ProseMirror 引擎版）：
// 标题级别 / AI润色 / B I U S / 链接 / 列表 / 引用 / 清除格式；图片点选走图片模式
import { onBeforeUnmount, onMounted, ref } from 'vue'
import { successMessage, errorMessage } from '@/common/message'
import { getLocalStorage } from '@/common/localstorage'
import useUserStore, { TOKEN } from '@/store/modules/user'
import { getPickerFile } from '@/utils/uploader'
import { getPMEditor } from './pm/useEditor'

type Mode = 'tools' | 'ai' | 'link' | 'image'
const state = ref({ visible: false, top: 0, left: 0 })
const mode = ref<Mode>('tools')
const curLevel = ref<number>(0)
const linkUrl = ref('')
const posInput = ref('')
const streaming = ref(false)
// 保存的 PM 选区（弹层交互时 DOM 选区会丢）
const savedSel = ref<{ from: number; to: number } | null>(null)
const imgPos = ref(-1)
const imgSrc = ref('')

// prod: A 字色触发 → 小色板（设 textStyle color；空串=移除 mark 回默认）
const colorOpen = ref(false)
const FONT_COLORS = [
  '',
  '#1f2329',
  '#787774',
  '#d44c47',
  '#d9730d',
  '#cb912f',
  '#448361',
  '#337ea9',
  '#9065b0',
  '#c14c8a',
  '#f6a22f',
  '#e8b424'
]
function setFg(c: string) {
  const e = ed()
  if (!e) return
  restoreSel()
  if (c) e.chain().focus().setColor(c).run()
  else e.chain().focus().unsetColor().run()
  colorOpen.value = false
}

const userStore = useUserStore()
const POSITION_KEY = 'cv-ai-target-position'
const POSITIONS = [
  '前端开发工程师',
  '后端开发工程师',
  'Java开发工程师',
  '测试工程师',
  '产品经理',
  'UI设计师',
  '运营',
  '数据分析师'
]
const LEVELS = [
  { level: 0, tip: '正文' },
  { level: 1, tip: 'H1' },
  { level: 2, tip: 'H2' },
  { level: 3, tip: 'H3' },
  { level: 4, tip: 'H4' },
  { level: 5, tip: 'H5' },
  { level: 6, tip: 'H6' }
]

const ed = () => getPMEditor()
const editorRoot = () => document.querySelector('.writable-edit-mode') as HTMLElement | null
const chain = () => ed()!.chain().focus()

function saveSel() {
  const e = ed()
  if (!e) return
  const { from, to, empty } = e.state.selection
  if (!empty) savedSel.value = { from, to }
}
function restoreSel() {
  const e = ed()
  const s = savedSel.value
  if (e && s) e.chain().focus().setTextSelection({ from: s.from, to: s.to }).run()
}
function setLevel(level: number) {
  restoreSel()
  if (level === 0) chain().setNode('paragraph').run()
  else
    chain()
      .setNode('heading', { level: level as 1 | 2 | 3 | 4 | 5 | 6 })
      .run()
  curLevel.value = level
}
function currentLevel(): number {
  const e = ed()
  const p = e?.state.selection.$from.parent
  if (p?.type.name === 'heading') return p.attrs.level as number
  return 0
}

/* ---------- 链接 ---------- */
const linkActive = () => !!ed()?.isActive('link')
const linkHref = () => (ed()?.getAttributes('link').href as string) || ''
function openLinkMode() {
  saveSel()
  linkUrl.value = linkActive() ? linkHref() : ''
  mode.value = 'link'
}
function confirmLink() {
  if (!linkUrl.value.trim()) return
  restoreSel()
  chain().setLink({ href: linkUrl.value.trim() }).run()
  mode.value = 'tools'
}
function openHref() {
  const h = linkHref()
  if (h) window.open(h, '_blank', 'noopener')
}
function copyHref() {
  const h = linkHref()
  if (h) {
    navigator.clipboard.writeText(h).catch(() => undefined)
    successMessage('链接已复制')
  }
}
function removeHref() {
  restoreSel()
  chain().unsetLink().run()
  mode.value = 'tools'
}

/* ---------- AI 润色 ---------- */
const savedPos = ref(localStorage.getItem(POSITION_KEY) || '')
function openAi() {
  saveSel()
  if (savedPos.value) {
    void perf(savedPos.value)
  } else {
    posInput.value = ''
    mode.value = 'ai'
  }
}
function pickPos() {
  const p = posInput.value.trim()
  if (p) {
    savedPos.value = p
    localStorage.setItem(POSITION_KEY, p)
    successMessage(`已按「${p}」方向润色，岗位已存入`)
  }
  void perf(p || undefined)
}
function skipPos() {
  void perf(undefined)
}
async function perf(targetPosition?: string) {
  const e = ed()
  const s = savedSel.value
  if (!e || !s || streaming.value) return
  const text = e.state.doc.textBetween(s.from, s.to, ' ')
  if (!text.trim()) return
  streaming.value = true
  try {
    const res = await fetch('/api/ai/perf', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${(getLocalStorage(TOKEN) as string) || ''}`
      },
      body: JSON.stringify({
        content: text,
        targetPosition,
        userId: String(userStore.userInfo?.uid || '')
      })
    })
    const ct = res.headers.get('Content-Type') || ''
    if (ct.includes('json')) {
      const d = await res.json()
      throw new Error(d.message || '润色失败')
    }
    const reader = res.body?.getReader()
    if (!reader) throw new Error('润色失败')
    const dec = new TextDecoder()
    let buf = ''
    let acc = ''
    for (;;) {
      const { done, value } = await reader.read()
      if (done) break
      buf += dec.decode(value, { stream: true })
      const parts = buf.split('\n')
      buf = parts.pop() || ''
      for (const line of parts) {
        const t = line.trim()
        if (!t.startsWith('data:')) continue
        try {
          const d = JSON.parse(t.slice(5).trim())
          if (d.text) acc += d.text
          if (d.error) throw new Error(d.error)
        } catch (err) {
          if (err instanceof SyntaxError) continue
          throw err
        }
      }
    }
    if (acc.trim()) {
      e.chain().focus().deleteRange({ from: s.from, to: s.to }).insertContent(acc.trim()).run()
      successMessage('已润色')
    }
    mode.value = 'tools'
  } catch (err) {
    errorMessage(err instanceof Error ? err.message : '润色失败')
  } finally {
    streaming.value = false
  }
}

/* ---------- 图片模式 ---------- */
function viewImg() {
  if (imgSrc.value) window.open(imgSrc.value, '_blank', 'noopener')
}
function copyImg() {
  if (imgSrc.value) {
    navigator.clipboard.writeText(imgSrc.value).catch(() => undefined)
    successMessage('图片链接已复制')
  }
}
function delImg() {
  const e = ed()
  if (e && imgPos.value >= 0) {
    const n = e.state.doc.nodeAt(imgPos.value)
    if (n)
      e.chain()
        .deleteRange({ from: imgPos.value, to: imgPos.value + n.nodeSize })
        .run()
  }
  imgPos.value = -1
  hide()
}
async function replaceImg() {
  const e = ed()
  try {
    const file = await getPickerFile({ multiple: false, accept: '.png,.jpg,.jpeg,.webp' })
    if (!file || !e || imgPos.value < 0) return
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
      const d = await res.json()
      if (d.code === 200) url = d.url
    }
    if (!url) {
      url = await new Promise<string>((resolve, reject) => {
        const fr = new FileReader()
        fr.onload = () => resolve(String(fr.result))
        fr.onerror = reject
        fr.readAsDataURL(file)
      })
    }
    const tr = e.state.tr.setNodeMarkup(imgPos.value, undefined, {
      ...e.state.doc.nodeAt(imgPos.value)?.attrs,
      src: url
    })
    e.view.dispatch(tr)
    imgSrc.value = url
    successMessage('图片已替换')
  } catch {
    errorMessage('上传失败')
  }
}

/* ---------- 显示/定位 ---------- */
function show(rect: { top: number; left: number; width: number }) {
  state.value = {
    visible: true,
    top: Math.max(8, rect.top - 46),
    left: Math.max(8, Math.min(window.innerWidth - 460, rect.left + rect.width / 2 - 170))
  }
}
function hide() {
  state.value.visible = false
  mode.value = 'tools'
}
function onSelChange() {
  const e = ed()
  if (!e) return
  const { from, to, empty } = e.state.selection
  const sel = window.getSelection()
  if (empty || !sel?.anchorNode || !editorRoot()?.contains(sel.anchorNode)) {
    if (!streaming.value && mode.value !== 'ai' && mode.value !== 'link') hide()
    return
  }
  if (to > from && e.state.doc.textBetween(from, to, ' ').trim()) {
    saveSel()
    curLevel.value = currentLevel()
    if (mode.value === 'image') mode.value = 'tools'
    const start = e.view.coordsAtPos(from)
    const end = e.view.coordsAtPos(to)
    const r = {
      top: Math.min(start.top, end.top),
      left: start.left,
      width: Math.abs(end.left - start.left) || 1
    }
    show(r)
  }
}
function onClick(e: MouseEvent) {
  const t = e.target as HTMLElement
  const ed2 = ed()
  if (t.tagName === 'IMG' && editorRoot()?.contains(t) && ed2) {
    // 图片 → 图片模式；定位其 PM pos
    let p = -1
    try {
      p = ed2.view.posAtDOM(t, 0, -1)
    } catch {
      /* fallback scan */
    }
    if (p < 0) {
      ed2.state.doc.descendants((node, pos) => {
        if (p >= 0) return false
        if (node.type.name === 'image') {
          try {
            if (ed2.view.domAtPos(pos).node === t) p = pos
          } catch {
            /* skip */
          }
        }
        return true
      })
    }
    if (p >= 0) {
      imgPos.value = p
      imgSrc.value = (t as HTMLImageElement).src
      mode.value = 'image'
      show(t.getBoundingClientRect())
      return
    }
  }
  imgPos.value = -1
}
function onDocDown(e: MouseEvent) {
  const t = e.target as HTMLElement
  if (state.value.visible && !t.closest('.bubble-menu')) {
    if (mode.value === 'link' || mode.value === 'ai') mode.value = 'tools'
    else hide()
  }
}
onMounted(() => {
  document.addEventListener('selectionchange', onSelChange)
  document.addEventListener('click', onClick, true)
  document.addEventListener('mousedown', onDocDown, true)
})
onBeforeUnmount(() => {
  document.removeEventListener('selectionchange', onSelChange)
  document.removeEventListener('click', onClick, true)
  document.removeEventListener('mousedown', onDocDown, true)
})
</script>

<template>
  <Teleport to="body">
    <div
      v-if="state.visible"
      class="bubble-menu"
      :style="{ top: state.top + 'px', left: state.left + 'px' }"
      @mousedown.prevent
    >
      <!-- 图片模式 -->
      <div v-if="mode === 'image'" class="bm-row">
        <el-tooltip content="替换图片" placement="top">
          <button class="bubble-menu-item" @click="replaceImg">
            <i class="iconfont icon-image" />
          </button>
        </el-tooltip>
        <el-tooltip content="查看原图" placement="top">
          <button class="bubble-menu-item" @click="viewImg">
            <i class="iconfont icon-search" />
          </button>
        </el-tooltip>
        <el-tooltip content="复制图片链接" placement="top">
          <button class="bubble-menu-item" @click="copyImg">
            <i class="iconfont icon-link" />
          </button>
        </el-tooltip>
        <el-tooltip content="删除图片" placement="top">
          <button class="bubble-menu-item link-danger" @click="delImg">
            <i class="iconfont icon-delete" />
          </button>
        </el-tooltip>
      </div>
      <!-- 链接模式 -->
      <div v-else-if="mode === 'link'" class="bm-row">
        <button class="bubble-menu-item shrink-0" title="返回" @click="mode = 'tools'">
          <i class="iconfont icon-back" />
        </button>
        <input
          v-model="linkUrl"
          class="link-url-input"
          placeholder="粘贴或输入链接地址"
          @keyup.enter="confirmLink"
        />
        <button class="link-confirm" @click="confirmLink">确认</button>
        <template v-if="linkActive()">
          <button class="bubble-menu-item link-action" title="打开链接" @click="openHref">
            <i class="iconfont icon-open" />
          </button>
          <button class="bubble-menu-item link-action" title="复制链接" @click="copyHref">
            <i class="iconfont icon-copy" />
          </button>
          <button
            class="bubble-menu-item link-action link-danger"
            title="移除链接"
            @click="removeHref"
          >
            <i class="iconfont icon-delete" />
          </button>
        </template>
      </div>
      <!-- AI 方向模式 -->
      <div v-else-if="mode === 'ai'" class="bm-row">
        <button class="bubble-menu-item shrink-0" title="返回" @click="mode = 'tools'">
          <i class="iconfont icon-back" />
        </button>
        <span class="ai-label">润色方向</span>
        <select v-model="posInput" class="ai-position-picker">
          <option value="" disabled>选择岗位方向</option>
          <option v-for="p in POSITIONS" :key="p" :value="p">{{ p }}</option>
        </select>
        <button class="ai-position-skip" @click="skipPos">跳过，直接润色</button>
        <button class="link-confirm" @click="pickPos">确认</button>
      </div>
      <!-- 主工具行 -->
      <div v-else class="bm-row">
        <select
          class="bm-level"
          :value="curLevel"
          title="选择字号大小"
          @change="setLevel(Number(($event.target as HTMLSelectElement).value))"
        >
          <option :value="0">正文</option>
          <option v-for="l in LEVELS.slice(1)" :key="l.level" :value="l.level">{{ l.tip }}</option>
        </select>
        <div class="bm-divider" />
        <el-tooltip
          :content="
            savedPos
              ? `使用Ai润色（🔥会员可无限制使用）· 按「${savedPos}」方向`
              : '使用Ai润色（🔥会员可无限制使用）'
          "
          placement="top"
        >
          <button class="bubble-menu-item ai-polish" :disabled="streaming" @click="openAi">
            <i class="iconfont icon-magic" />
          </button>
        </el-tooltip>
        <div class="bm-divider" />
        <el-tooltip content="加粗" placement="top">
          <button class="bubble-menu-item" @click="chain().toggleBold().run()">
            <i class="iconfont icon-bold" />
          </button>
        </el-tooltip>
        <el-tooltip content="斜体" placement="top">
          <button class="bubble-menu-item" @click="chain().toggleItalic().run()">
            <i class="iconfont icon-italic" />
          </button>
        </el-tooltip>
        <el-tooltip content="下划线" placement="top">
          <button class="bubble-menu-item" @click="chain().toggleUnderline().run()">
            <i class="iconfont icon-underline" />
          </button>
        </el-tooltip>
        <el-tooltip content="删除线" placement="top">
          <button class="bubble-menu-item" @click="chain().toggleStrike().run()">
            <i class="iconfont icon-strike" />
          </button>
        </el-tooltip>
        <!-- prod: icon-tagfill 标签 + A 字色触发 -->
        <el-tooltip content="标签" placement="top">
          <button class="bubble-menu-item" @click="chain().toggleCode().run()">
            <i class="iconfont icon-tagfill" />
          </button>
        </el-tooltip>
        <div class="color-wrap">
          <el-tooltip content="字体颜色" placement="top">
            <button class="bubble-menu-item color-trigger" @click="colorOpen = !colorOpen">
              <span class="color-a">A</span>
            </button>
          </el-tooltip>
          <div v-if="colorOpen" class="color-panel floating-shadow">
            <button
              v-for="c in FONT_COLORS"
              :key="c"
              class="swatch"
              :style="{ background: c || 'transparent', border: c ? 'none' : '1px solid #ccc' }"
              :title="c || '默认'"
              @click="setFg(c)"
            ></button>
          </div>
        </div>
        <div class="bm-divider" />
        <el-tooltip content="插入链接" placement="top">
          <button class="bubble-menu-item" @click="openLinkMode">
            <i class="iconfont icon-link" />
          </button>
        </el-tooltip>
        <div class="bm-divider" />
        <el-tooltip content="有序列表" placement="top">
          <button class="bubble-menu-item" @click="chain().toggleOrderedList().run()">
            <i class="iconfont icon-orderedlist" />
          </button>
        </el-tooltip>
        <el-tooltip content="无序列表" placement="top">
          <button class="bubble-menu-item" @click="chain().toggleBulletList().run()">
            <i class="iconfont icon-unorderedlist" />
          </button>
        </el-tooltip>
        <el-tooltip content="引用" placement="top">
          <button class="bubble-menu-item" @click="chain().toggleBlockquote().run()">
            <i class="iconfont icon-quote" />
          </button>
        </el-tooltip>
        <div class="bm-divider" />
        <el-tooltip content="清除格式" placement="top">
          <button class="bubble-menu-item" @click="chain().unsetAllMarks().clearNodes().run()">
            <i class="iconfont icon-eraser" />
          </button>
        </el-tooltip>
      </div>
    </div>
  </Teleport>
</template>

<style lang="scss" scoped>
.bubble-menu {
  position: fixed;
  z-index: 3200;
  background: #fff;
  border-radius: 8px;
  padding: 4px 6px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.16);
  display: flex;
}
.color-wrap {
  position: relative;
}
.color-a {
  font-weight: 700;
  font-size: 13px;
  border-bottom: 2.5px solid var(--theme, #f6a22f);
  line-height: 1.1;
}
.color-panel {
  position: absolute;
  top: calc(100% + 8px);
  left: 0;
  display: grid;
  grid-template-columns: repeat(6, 18px);
  gap: 6px;
  padding: 10px;
  background: var(--background, #fff);
  border-radius: 8px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.16);
  z-index: 5;
  .swatch {
    width: 18px;
    height: 18px;
    border-radius: 4px;
    cursor: pointer;
    padding: 0;
  }
}
html.dark .bubble-menu {
  background: #222;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.5);
}
.bm-row {
  display: flex;
  align-items: center;
  gap: 2px;
}
.bubble-menu-item {
  width: 28px;
  height: 28px;
  border: none;
  background: transparent;
  border-radius: 6px;
  cursor: pointer;
  color: #444;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 15px;
  &:hover {
    background: rgba(0, 0, 0, 0.07);
  }
  &:disabled {
    opacity: 0.4;
    cursor: wait;
  }
}
html.dark .bubble-menu-item {
  color: #ddd;
  &:hover {
    background: rgba(255, 255, 255, 0.12);
  }
}
.bm-divider {
  width: 1px;
  height: 16px;
  background: rgba(0, 0, 0, 0.12);
  margin: 0 4px;
}
html.dark .bm-divider {
  background: rgba(255, 255, 255, 0.16);
}
.bm-level {
  width: 66px;
  height: 24px;
  border: 1px solid rgba(0, 0, 0, 0.15);
  border-radius: 6px;
  font-size: 12px;
  padding: 0 4px;
  background: transparent;
  color: inherit;
}
.link-url-input {
  width: 180px;
  height: 26px;
  border: 1px solid rgba(0, 0, 0, 0.15);
  border-radius: 6px;
  font-size: 12px;
  padding: 0 8px;
  background: transparent;
  color: inherit;
}
.link-confirm {
  height: 26px;
  padding: 0 10px;
  margin-left: 6px;
  border: none;
  border-radius: 6px;
  background: var(--theme, #504cd7);
  color: #fff;
  font-size: 12px;
  cursor: pointer;
}
.link-danger {
  color: #e5484d !important;
}
.ai-label {
  font-size: 12px;
  color: #666;
  margin: 0 4px;
  white-space: nowrap;
}
.ai-position-picker {
  min-width: 150px;
  height: 26px;
  border: 1px solid rgba(0, 0, 0, 0.15);
  border-radius: 6px;
  font-size: 12px;
  padding: 0 6px;
  background: transparent;
  color: inherit;
}
.ai-position-skip {
  height: 26px;
  margin-left: 6px;
  padding: 0 8px;
  border: 1px solid rgba(0, 0, 0, 0.15);
  border-radius: 6px;
  background: transparent;
  font-size: 12px;
  cursor: pointer;
  color: inherit;
}
.ai-polish {
  color: var(--theme, #504cd7);
}
</style>
