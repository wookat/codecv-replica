<script setup lang="ts">
import TabBar from '../tabbar/tabbar.vue'
import { useRenderHTML, useResumeType } from '../../hook'
import { useThemeConfig } from '@/common/global'
import { step, pageSize, fitStepToWidth } from '../tabbar/hook'
import { onMounted, onUnmounted, ref } from 'vue'
import { getPickerFile } from '@/utils/uploader'
import { getLocalStorage, setLocalStorage, removeLocalStorage } from '@/common/localstorage'
import { refreshOverlays } from '@/utils/moduleCombine'
import { successMessage } from '@/common/message'
import { TOKEN } from '@/store/modules/user'

defineEmits(['upload-avatar', 'html-convert'])

const { resumeType } = useResumeType()
const { isDark } = useThemeConfig()
const { renderDOM } = useRenderHTML(resumeType)

const outerEl = ref<HTMLElement>()
let ro: ResizeObserver | undefined
onMounted(() => {
  if (!outerEl.value) return
  fitStepToWidth(outerEl.value.clientWidth)
  ro = new ResizeObserver(entries => fitStepToWidth(entries[0].contentRect.width))
  ro.observe(outerEl.value)
})
onUnmounted(() => ro?.disconnect())

// ===== 生产同款：点击预览模块 → 广播 index/line 让编辑器/MD 滚动到同模块 =====
const scrollChannel = new BroadcastChannel('resume-module-scroll')
onUnmounted(() => scrollChannel.close())
function onPreviewClick(e: MouseEvent) {
  const root = e.currentTarget as HTMLElement
  let d = e.target as HTMLElement | null
  while (d && !d.classList.contains('resume-module') && !d.classList.contains('re-render'))
    d = d.parentElement
  if (!d || !d.classList.contains('resume-module')) return
  const all = Array.from(root.querySelectorAll('.resume-module'))
  // 生产同款取模：分页克隆会重复模块，用 reference-dom（整档）模块数归一
  const t = document.querySelectorAll('.reference-dom .resume-module').length || 1
  // md 端定位：携模块 h2 文本，接收方找 `## …标题` 行
  const title = (d as HTMLElement).querySelector('h2')?.textContent?.trim() || null
  scrollChannel.postMessage({ index: all.indexOf(d as Element) % t, title })
}

// ===== 生产同款：预览图片右键菜单（更换/重置位置/重置尺寸/删除/取消） =====
const ctxMenu = ref<{ open: boolean; x: number; y: number; kind: 'avatar' | 'badge' | null }>({
  open: false,
  x: 0,
  y: 0,
  kind: null
})
function onContextMenu(e: MouseEvent) {
  const img = (e.target as HTMLElement).closest?.(
    '.cv-avatar-overlay,.cv-badge-overlay'
  ) as HTMLElement | null
  if (!img) return
  e.preventDefault()
  ctxMenu.value = {
    open: true,
    x: e.clientX,
    y: e.clientY,
    kind: img.classList.contains('cv-badge-overlay') ? 'badge' : 'avatar'
  }
}
function closeCtx() {
  ctxMenu.value.open = false
}
onMounted(() => document.addEventListener('click', closeCtx))
onUnmounted(() => document.removeEventListener('click', closeCtx))
const ctxKey = () =>
  ctxMenu.value.kind === 'badge'
    ? `badge_config-${resumeType.value}`
    : `avatar-cfg-${resumeType.value}`
const readCfg = () => {
  try {
    const raw = getLocalStorage(ctxKey()) as string | null
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}
async function ctxAction(act: 'replace' | 'reset-position' | 'reset-size' | 'delete') {
  const kind = ctxMenu.value.kind
  closeCtx()
  if (!kind) return
  const key = ctxKey()
  if (act === 'replace') {
    const file = await getPickerFile({ multiple: false, accept: '.png,.jpg,.jpeg,.webp' })
    if (!file) return
    const token = (getLocalStorage(TOKEN) as string) || ''
    let url = ''
    try {
      const fd = new FormData()
      fd.append('file', file)
      const res = await fetch('/api/upload', {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        body: fd
      })
      if (res.ok) {
        const d = await res.json()
        if (d.code === 200) url = d.url
      }
    } catch {
      /* fall back dataURL */
    }
    if (!url) {
      url = await new Promise<string>((res, rej) => {
        const fr = new FileReader()
        fr.onload = () => res(String(fr.result))
        fr.onerror = rej
        fr.readAsDataURL(file)
      })
    }
    const prev = readCfg() || {}
    setLocalStorage(
      key,
      JSON.stringify({
        url,
        top: prev.top ?? (kind === 'avatar' ? 30 : 10),
        left: prev.left ?? (kind === 'avatar' ? 660 : 10),
        width: prev.width,
        shape: prev.shape || 'square'
      })
    )
    refreshOverlays(resumeType.value)
    successMessage(kind === 'avatar' ? '证件照已更换' : '校徽已更换')
    return
  }
  const cfg = readCfg()
  if (act === 'delete') {
    removeLocalStorage(key)
    refreshOverlays(resumeType.value)
    successMessage('已删除')
    return
  }
  if (!cfg) return
  if (act === 'reset-position') {
    cfg.top = kind === 'avatar' ? 30 : 10
    cfg.left = kind === 'avatar' ? 660 : 10
  } else if (act === 'reset-size') {
    delete cfg.width
  }
  setLocalStorage(key, JSON.stringify(cfg))
  refreshOverlays(resumeType.value)
  successMessage(act === 'reset-position' ? '已重置位置' : '已重置尺寸')
}
</script>

<template>
  <div ref="outerEl" class="outer" :style="{ background: isDark ? '#282c34' : 'var(--bg-theme)' }">
    <TabBar
      @html-convert="cnt => $emit('html-convert', cnt)"
      @upload-avatar="path => $emit('upload-avatar', path)"
    />
    <div ref="renderDOM" class="markdown-transform-html jufe reference-dom"></div>
    <!-- 分页渲染区域 -->
    <div
      class="re-render"
      :style="{
        transform: `translateY(-${((100 - step) / 100) * 1123 * (pageSize / 2)}px) scale(${
          step / 100
        })`
      }"
      @click="onPreviewClick"
      @contextmenu="onContextMenu"
    ></div>
    <Teleport to="body">
      <div
        v-if="ctxMenu.open"
        class="resume-image-context-menu"
        :style="{ left: ctxMenu.x + 'px', top: ctxMenu.y + 'px' }"
      >
        <button type="button" @click="ctxAction('replace')">
          {{ ctxMenu.kind === 'avatar' ? '更换证件照' : '更换新校徽' }}
        </button>
        <button type="button" @click="ctxAction('reset-position')">重置位置</button>
        <button type="button" @click="ctxAction('reset-size')">重置尺寸</button>
        <button
          type="button"
          class="resume-image-context-menu__delete"
          @click="ctxAction('delete')"
        >
          删除
        </button>
        <button type="button" class="resume-image-context-menu__cancel" @click="closeCtx">
          取消
        </button>
      </div>
    </Teleport>
  </div>
</template>

<style lang="scss" scoped>
.outer {
  height: 100vh;
  overflow: auto;
  background: var(--bg-theme);

  .re-render {
    transition: transform 0.3s;
  }
}

.jufe {
  position: absolute;
  left: -9990px;
  top: -9990px;
}
</style>
