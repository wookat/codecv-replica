<script setup lang="ts">
// 生产同款 tag-style-panel：点击编辑器内 <code> 技能点 → 预设色 chips + 自定义文字/背景色
import { onBeforeUnmount, onMounted, reactive, ref } from 'vue'
import { getPMEditor } from './pm/useEditor'

const CHIPS = [
  { name: '默认', text: '', bg: '' },
  { name: '灰色', text: '#787774', bg: '#f1f1ef' },
  { name: '棕色', text: '#9f6b53', bg: '#f4eeee' },
  { name: '橙色', text: '#d9730d', bg: '#faebdd' },
  { name: '黄色', text: '#cb912f', bg: '#fbf3db' },
  { name: '绿色', text: '#448361', bg: '#edf3ec' },
  { name: '蓝色', text: '#337ea9', bg: '#e7f3f8' },
  { name: '紫色', text: '#9065b0', bg: '#f6f3f9' },
  { name: '粉色', text: '#c14c8a', bg: '#f9f1f4' },
  { name: '红色', text: '#d44c47', bg: '#fdebec' }
]

const state = reactive({ visible: false, top: 0, left: 0 })
const custom = ref(false)
const fg = ref('#333333')
const bg = ref('#fbf3db')
const panelRef = ref<HTMLElement>()
let target: HTMLElement | null = null

function openFor(code: HTMLElement) {
  target = code
  const r = code.getBoundingClientRect()
  state.top = r.bottom + 6
  state.left = Math.max(8, Math.min(window.innerWidth - 330, r.left))
  state.visible = true
  fg.value = code.style.color || '#333333'
  bg.value = code.style.backgroundColor ? rgb2hex(code.style.backgroundColor) : '#fbf3db'
}
function rgb2hex(rgb: string) {
  const m = /rgba?\((\d+),\s*(\d+),\s*(\d+)/.exec(rgb)
  if (!m) return '#fbf3db'
  return '#' + [m[1], m[2], m[3]].map(v => (+v).toString(16).padStart(2, '0')).join('')
}
function onDocClick(ev: MouseEvent) {
  const t = ev.target as HTMLElement
  if (panelRef.value?.contains(t)) return
  const code = t.closest('code')
  if (code && code.closest('.writable-edit-mode')) {
    openFor(code as HTMLElement)
    return
  }
  close()
}
function onKey(ev: KeyboardEvent) {
  if (ev.key === 'Escape' && state.visible) {
    ev.stopPropagation()
    close()
  }
}
function close() {
  state.visible = false
  target = null
}
function sync() {
  target?.closest('.writable-edit-mode')?.dispatchEvent(new Event('input', { bubbles: true }))
}
// PM：样式写进 code mark attrs（DOM 直改会被渲染回滚）
function applyToPM(cssText: string) {
  const e = getPMEditor()
  if (!e || !target) return false
  try {
    const pos = e.view.posAtDOM(target, 0)
    const $p = e.state.doc.resolve(pos)
    const parent = $p.parent
    // 按覆盖该位置的文本节点找 code mark（marks() 在 mark 起始边界会取空）
    const hit = ((): { mark: any; from: number; to: number } | null => {
      let found: { mark: any; from: number; to: number } | null = null
      parent.forEach((node, p2) => {
        const s = $p.start() + p2
        const epos = s + node.nodeSize
        const m = node.isText && node.marks.find(x => x.type.name === 'code')
        if (m && pos >= s && pos <= epos) found = { mark: m, from: s, to: epos }
      })
      return found
    })()
    if (!hit) return false
    const { mark } = hit
    // 向两侧扩展同 mark 的连续文本（多轮扩张，向左可能不止一个邻接节点）
    const kids: { s: number; e: number; same: boolean }[] = []
    parent.forEach((node, p2) => {
      const s = $p.start() + p2
      kids.push({
        s,
        e: s + node.nodeSize,
        same: !!(node.isText && node.marks.some(m => m.eq(mark)))
      })
    })
    let f = hit.from
    let t = hit.to
    let changed = true
    while (changed) {
      changed = false
      for (const k of kids) {
        if (!k.same) continue
        if (k.e === f) {
          f = k.s
          changed = true
        }
        if (k.s === t) {
          t = k.e
          changed = true
        }
      }
    }
    const range = f < t ? { from: f, to: t } : null
    if (!range) return false
    const attrs = { ...mark.attrs, style: cssText }
    e.view.dispatch(
      e.state.tr
        .removeMark(range.from, range.to, e.state.schema.marks.code)
        .addMark(range.from, range.to, e.state.schema.marks.code.create(attrs))
    )
    return true
  } catch {
    return false
  }
}
function apply(text: string, bgc: string) {
  if (!target) return
  const css = `color:${text || 'inherit'};background:${bgc || 'rgba(0,0,0,0.06)'}`
  if (applyToPM(!text && !bgc ? '' : css)) return
  target.style.color = text
  target.style.background = bgc || 'rgba(0,0,0,0.06)'
  if (!text && !bgc) {
    target.style.color = ''
    target.style.background = ''
  }
  sync()
}
function applyFg() {
  if (!target) return
  const css = target.getAttribute('style') || ''
  const next = css.replace(/color:[^;]+;?/, '') + `color:${fg.value};`
  if (applyToPM(next)) return
  target.style.color = fg.value
  sync()
}
function applyBg() {
  if (!target) return
  const css = target.getAttribute('style') || ''
  const next = css.replace(/background:[^;]+;?/, '') + `background:${bg.value};`
  if (applyToPM(next)) return
  target.style.background = bg.value
  sync()
}
onMounted(() => {
  document.addEventListener('click', onDocClick, true)
  document.addEventListener('keydown', onKey, true)
  document.addEventListener('scroll', close, true)
})
onBeforeUnmount(() => {
  document.removeEventListener('click', onDocClick, true)
  document.removeEventListener('keydown', onKey, true)
  document.removeEventListener('scroll', close, true)
})
</script>

<template>
  <Teleport to="body">
    <Transition name="tag-style-pop">
      <div
        v-if="state.visible"
        ref="panelRef"
        class="tag-style-panel"
        :style="{ top: state.top + 'px', left: state.left + 'px' }"
        @mousedown.stop
      >
        <div class="panel-label">标签样式</div>
        <div class="chips tag-grid">
          <button
            v-for="c in CHIPS"
            :key="c.name"
            type="button"
            class="tag-chip"
            :class="{ 'is-neutral': !(c.text || c.bg) }"
            :title="c.name"
            :style="c.text || c.bg ? { color: c.text, background: c.bg } : undefined"
            @click="apply(c.text, c.bg)"
          >
            {{ c.name }}
          </button>
        </div>
        <button class="custom-toggle" type="button" @click="custom = !custom">
          <span>自定义颜色</span><span class="arrow" :class="{ 'is-open': custom }">›</span>
        </button>
        <div v-if="custom" class="custom-row">
          <label class="custom-item"
            ><span>文字</span><input type="color" v-model="fg" @input="applyFg"
          /></label>
          <label class="custom-item"
            ><span>背景</span><input type="color" v-model="bg" @input="applyBg"
          /></label>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style lang="scss" scoped>
.tag-style-panel {
  position: fixed;
  z-index: 3100;
  background: var(--background);
  border-radius: 10px;
  padding: 8px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.14);
  width: 320px;
  .panel-label {
    font-size: 12px;
    color: #666;
    padding: 2px 4px 6px;
  }
  .chips {
    display: flex;
    flex-wrap: wrap;
    gap: 4px;
  }
  .tag-chip {
    border: none;
    border-radius: 6px;
    padding: 4px 8px;
    font-size: 12px;
    cursor: pointer;
    background: transparent;
    &.is-neutral {
      border: 1px solid rgba(0, 0, 0, 0.1);
      color: var(--font-color);
    }
    &:hover {
      outline: 1px solid rgba(0, 0, 0, 0.15);
    }
  }
  .custom-toggle {
    display: flex;
    align-items: center;
    justify-content: space-between;
    width: 100%;
    border: none;
    background: transparent;
    padding: 6px 4px 2px;
    font-size: 12px;
    color: #666;
    cursor: pointer;
    .arrow {
      transition: transform 0.15s;
      display: inline-block;
      &.is-open {
        transform: rotate(90deg);
      }
    }
  }
  .custom-row {
    display: flex;
    gap: 12px;
    padding: 4px;
    label {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 12px;
      color: var(--font-color);
      input[type='color'] {
        width: 24px;
        height: 24px;
        border: none;
        padding: 0;
        background: transparent;
        cursor: pointer;
      }
    }
  }
}
.tag-style-pop-enter-active,
.tag-style-pop-leave-active {
  transition: opacity 0.15s, transform 0.15s;
}
.tag-style-pop-enter-from,
.tag-style-pop-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}
</style>
