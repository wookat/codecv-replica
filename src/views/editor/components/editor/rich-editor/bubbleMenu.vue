<script setup lang="ts">
// 生产同款选中文本浮动菜单：标题级别 / AI润色 / B I U S / 链接 / 列表 / 引用 / 清除格式；图片点选走图片模式
import { onBeforeUnmount, onMounted, ref } from 'vue'
import { successMessage, errorMessage } from '@/common/message'
import { getLocalStorage } from '@/common/localstorage'
import useUserStore, { TOKEN } from '@/store/modules/user'
import { getPickerFile } from '@/utils/uploader'

type Mode = 'tools' | 'ai' | 'link' | 'image'
const state = ref({ visible: false, top: 0, left: 0 })
const mode = ref<Mode>('tools')
const curLevel = ref<number>(0)
const linkUrl = ref('')
const posInput = ref('')
const streaming = ref(false)
const savedRange = ref<Range | null>(null)
const imgEl = ref<HTMLImageElement | null>(null)

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

const editorRoot = () => document.querySelector('.writable-edit-mode') as HTMLElement | null
function sync() {
  editorRoot()?.dispatchEvent(new Event('input', { bubbles: true }))
}
function sel(): Selection | null {
  const s = window.getSelection()
  return s && s.rangeCount ? s : null
}
function insideEditor(n: Node | null) {
  return !!n && !!editorRoot()?.contains(n)
}
function exec(cmd: string, arg?: string) {
  document.execCommand(cmd, false, arg)
  sync()
}
function restoreSelection() {
  const r = savedRange.value
  const s = window.getSelection()
  if (r && s) {
    s.removeAllRanges()
    s.addRange(r)
  }
}
function saveSel() {
  const s = sel()
  if (s && !s.isCollapsed && insideEditor(s.anchorNode))
    savedRange.value = s.getRangeAt(0).cloneRange()
}
function blockOf(): HTMLElement | null {
  const s = sel()
  let el = (
    s?.anchorNode?.nodeType === 1 ? s.anchorNode : s?.anchorNode?.parentElement
  ) as HTMLElement | null
  const root = editorRoot()
  while (el && el !== root && !/^(H[1-6]|P|BLOCKQUOTE|PRE|LI|TD|TH|DIV)$/.test(el.tagName))
    el = el.parentElement
  return el && el !== root ? el : null
}
function currentLevel(): number {
  const b = blockOf()
  return b && /^H[1-6]$/.test(b.tagName) ? Number(b.tagName[1]) : 0
}
function setLevel(level: number) {
  restoreSelection()
  const block = blockOf()
  if (!block) return
  const tag = level === 0 ? 'p' : `h${level}`
  if (block.tagName.toLowerCase() === tag) return
  const el = document.createElement(tag)
  for (const c of Array.from(block.childNodes)) el.appendChild(c)
  block.replaceWith(el)
  const r = document.createRange()
  r.selectNodeContents(el)
  r.collapse(false)
  const s = window.getSelection()
  s?.removeAllRanges()
  s?.addRange(r)
  sync()
  curLevel.value = level
}

/* ---------- 链接 ---------- */
function linkAnchor(): HTMLAnchorElement | null {
  const s = sel()
  let el = (
    s?.anchorNode?.nodeType === 1 ? s.anchorNode : s?.anchorNode?.parentElement
  ) as HTMLElement | null
  while (el && el !== editorRoot()) {
    if (el.tagName === 'A') return el as HTMLAnchorElement
    el = el.parentElement
  }
  return null
}
function openLinkMode() {
  saveSel()
  linkUrl.value = linkAnchor()?.href || ''
  mode.value = 'link'
}
function confirmLink() {
  if (!linkUrl.value.trim()) return
  restoreSelection()
  exec('createLink', linkUrl.value.trim())
  mode.value = 'tools'
}
function openHref() {
  const a = linkAnchor()
  if (a) window.open(a.href, '_blank', 'noopener')
}
function copyHref() {
  const a = linkAnchor()
  if (a) {
    navigator.clipboard.writeText(a.href).catch(() => undefined)
    successMessage('链接已复制')
  }
}
function removeHref() {
  restoreSelection()
  exec('unlink')
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
  const range = savedRange.value
  if (!range || streaming.value) return
  const text = range.toString()
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
        } catch (e) {
          if (e instanceof SyntaxError) continue
          throw e
        }
      }
    }
    if (acc.trim()) {
      restoreSelection()
      const s = sel()
      if (s && s.rangeCount) {
        const r = s.getRangeAt(0)
        r.deleteContents()
        r.insertNode(document.createTextNode(acc.trim()))
        sync()
        successMessage('已润色')
      }
    }
    mode.value = 'tools'
  } catch (e) {
    errorMessage(e instanceof Error ? e.message : '润色失败')
  } finally {
    streaming.value = false
  }
}

/* ---------- 图片模式 ---------- */
function viewImg() {
  const src = imgEl.value?.src
  if (src) window.open(src, '_blank', 'noopener')
}
function copyImg() {
  const src = imgEl.value?.src
  if (src) {
    navigator.clipboard.writeText(src).catch(() => undefined)
    successMessage('图片链接已复制')
  }
}
function delImg() {
  imgEl.value?.remove()
  imgEl.value = null
  hide()
  sync()
}
async function replaceImg() {
  try {
    const file = await getPickerFile({ multiple: false, accept: '.png,.jpg,.jpeg,.webp' })
    if (!file || !imgEl.value) return
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
    imgEl.value.src = url
    sync()
    successMessage('图片已替换')
  } catch {
    errorMessage('上传失败')
  }
}

/* ---------- 显示/定位 ---------- */
function show(rect: DOMRect) {
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
  const s = sel()
  if (!s || s.isCollapsed || !insideEditor(s.anchorNode)) {
    if (!streaming.value && mode.value !== 'ai' && mode.value !== 'link') hide()
    return
  }
  if (String(s).trim()) {
    saveSel()
    curLevel.value = currentLevel()
    if (mode.value === 'image') mode.value = 'tools'
    const r = s.getRangeAt(0).getBoundingClientRect()
    if (r.width) show(r)
  }
}
function onClick(e: MouseEvent) {
  const t = e.target as HTMLElement
  if (t.tagName === 'IMG' && insideEditor(t)) {
    imgEl.value = t as HTMLImageElement
    mode.value = 'image'
    show(t.getBoundingClientRect())
    return
  }
  imgEl.value = null
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
        <template v-if="linkAnchor()">
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
          <button class="bubble-menu-item" @click="exec('bold')">
            <i class="iconfont icon-bold" />
          </button>
        </el-tooltip>
        <el-tooltip content="斜体" placement="top">
          <button class="bubble-menu-item" @click="exec('italic')">
            <i class="iconfont icon-italic" />
          </button>
        </el-tooltip>
        <el-tooltip content="下划线" placement="top">
          <button class="bubble-menu-item" @click="exec('underline')">
            <i class="iconfont icon-underline" />
          </button>
        </el-tooltip>
        <el-tooltip content="删除线" placement="top">
          <button class="bubble-menu-item" @click="exec('strikeThrough')">
            <i class="iconfont icon-strike" />
          </button>
        </el-tooltip>
        <div class="bm-divider" />
        <el-tooltip content="插入链接" placement="top">
          <button class="bubble-menu-item" @click="openLinkMode">
            <i class="iconfont icon-link" />
          </button>
        </el-tooltip>
        <div class="bm-divider" />
        <el-tooltip content="有序列表" placement="top">
          <button class="bubble-menu-item" @click="exec('insertOrderedList')">
            <i class="iconfont icon-orderedlist" />
          </button>
        </el-tooltip>
        <el-tooltip content="无序列表" placement="top">
          <button class="bubble-menu-item" @click="exec('insertUnorderedList')">
            <i class="iconfont icon-unorderedlist" />
          </button>
        </el-tooltip>
        <el-tooltip content="引用" placement="top">
          <button class="bubble-menu-item" @click="exec('formatBlock', 'blockquote')">
            <i class="iconfont icon-quote" />
          </button>
        </el-tooltip>
        <div class="bm-divider" />
        <el-tooltip content="清除格式" placement="top">
          <button class="bubble-menu-item" @click="exec('removeFormat')">
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
