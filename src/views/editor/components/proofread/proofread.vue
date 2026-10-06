<script setup lang="ts">
// 生产同款错别字检查：抽屉(模块分组/del→ins/定位|忽略|修正) + 编辑器波浪线标注(proofread-mark)
// + 点击标注弹出修正卡片(proofread-card) + 底部居中胶囊 walker(‹ 第n/N处 › ✕)
// + 批量修正预览(逐项勾选) + 忽略词管理 + 免费档模糊样本+升级解锁
import { computed, nextTick, onBeforeUnmount, ref, watch } from 'vue'
import useEditorStore from '@/store/modules/editor'
import { scanContent, ProofreadIssue, proofreadState } from './proofread'
import { successMessage, warningMessage } from '@/common/message'
import { useRoute, useRouter } from 'vue-router'
import { getLocalStorage, setLocalStorage } from '@/common/localstorage'
import { fetchUserInfo } from '@/api/modules/cloudResume'
import { trackProofread } from '@/api/modules/share'
import { ElMessageBox } from 'element-plus'

const props = defineProps<{ modelValue: boolean }>()
const emit = defineEmits(['update:modelValue'])

const UNLOCATED = '未能定位'
const editorStore = useEditorStore()
const route = useRoute()
const router = useRouter()

const drawerOpen = ref(props.modelValue)
const issues = ref<ProofreadIssue[]>([])
const hiddenCount = ref(0)
const tier = ref<'vip' | 'free'>('vip')
const status = ref<'idle' | 'checking' | 'done'>('idle')
const ignored = ref<string[]>([])
const ignoreOpen = ref(false)
const showIgnored = ref(false)

// mark ↔ issue 关联
const markMap = new WeakMap<HTMLElement, ProofreadIssue>()
const issueMark = new Map<ProofreadIssue, HTMLElement>()

// 修正卡片
const cardIssue = ref<ProofreadIssue | null>(null)
const cardStyle = ref<Record<string, string>>({})

// 逐个修改 walker
const walkerOpen = ref(false)
const walkerIndex = ref(0)
const walkerStyle = ref<Record<string, string>>({})

// 批量修正预览
const batchOpen = ref(false)
const batchItems = ref<{ issue: ProofreadIssue; off: boolean }[]>([])
const batchAll = ref(true)

const typeKey = computed(() => String(route.query.type || 'default'))
const ignoreKey = computed(() => `proofread-ignore-${typeKey.value}`)
const token = () => (getLocalStorage('TOKEN') as string) || ''

function loadIgnored() {
  try {
    ignored.value = JSON.parse((getLocalStorage(ignoreKey.value) as string) || '[]')
  } catch {
    ignored.value = []
  }
}
function persistIgnored() {
  setLocalStorage(ignoreKey.value, JSON.stringify(ignored.value))
}

// 模块分组：按 issue 所在章节推断（prod：定位不到归「未能定位」）
function moduleOf(i: ProofreadIssue) {
  const md = editorStore.MDContent || ''
  const head = md.slice(0, i.index)
  const m = head.match(/##\s*[^\n]+/g)
  return m ? m[m.length - 1].replace(/^##\s*/, '').trim() : UNLOCATED
}
const groups = computed(() => {
  const map = new Map<string, ProofreadIssue[]>()
  for (const i of issues.value) {
    const mod = i.module || UNLOCATED
    const arr = map.get(mod) ?? []
    arr.push(i)
    map.set(mod, arr)
  }
  return [...map.entries()]
    .map(([module, items]) => ({ module, items }))
    .sort((a, b) => (a.module === UNLOCATED ? 1 : b.module === UNLOCATED ? -1 : 0))
})
const highCount = computed(() => issues.value.filter(i => i.severity !== 'low').length)
const lowCount = computed(() => issues.value.length - highCount.value)
const fixableCount = computed(() =>
  tier.value !== 'vip' ? 0 : issues.value.filter(i => i.right && i.severity !== 'low').length
)
const teaserShown = computed(() => Math.min(hiddenCount.value, 3))
const teaserMore = computed(() => hiddenCount.value - teaserShown.value)
const isEmpty = computed(() => issues.value.length === 0 && hiddenCount.value === 0)

function tailCtx(i: ProofreadIssue) {
  return i.ctx.length > 32 ? `…${i.ctx.slice(-32)}` : i.ctx
}
function issueType(i: ProofreadIssue) {
  return i.type || (i.kind === 'format' ? '格式' : '错别字')
}
function issueReason(i: ProofreadIssue) {
  return i.reason || i.msg
}
function metaLine(i: ProofreadIssue) {
  return `${issueType(i)}${i.severity === 'low' ? ' · 疑似' : ''} · ${issueReason(i)}`
}

/* ---------- 编辑器内波浪线标注 ---------- */
function editDom(): HTMLElement | null {
  return (
    document.querySelector<HTMLElement>('.writable-edit-mode') ||
    document.querySelector<HTMLElement>('.reference-dom')
  )
}
function clearMarks() {
  const dom = editDom()
  if (!dom) return
  for (const el of Array.from(dom.querySelectorAll('span.proofread-mark'))) {
    const p = el.parentNode
    if (!p) continue
    p.replaceChild(document.createTextNode(el.textContent || ''), el)
    ;(p as HTMLElement).normalize?.()
  }
  issueMark.clear()
}
function markIssue(issue: ProofreadIssue) {
  const dom = editDom()
  if (!dom) return
  const walker = document.createTreeWalker(dom, NodeFilter.SHOW_TEXT)
  let n = walker.nextNode()
  while (n) {
    const t = n as Text
    const i = t.data.indexOf(issue.wrong)
    if (i !== -1 && !t.parentElement?.closest('.proofread-mark')) {
      const after = t.splitText(i)
      after.splitText(issue.wrong.length)
      const span = document.createElement('span')
      span.className =
        'proofread-mark proofread-mark--new' +
        (issue.severity === 'low' ? ' proofread-mark--low' : '')
      span.textContent = issue.wrong
      t.parentNode?.replaceChild(span, after)
      markMap.set(span, issue)
      issueMark.set(issue, span)
      return
    }
    n = walker.nextNode()
  }
}
function applyMarks() {
  clearMarks()
  for (const i of issues.value) markIssue(i)
}
function removeMark(issue: ProofreadIssue) {
  const el = issueMark.get(issue)
  if (el && el.parentNode) {
    el.parentNode.replaceChild(document.createTextNode(el.textContent || ''), el)
    issueMark.delete(issue)
  }
}

/* ---------- 修正卡片（点击标注弹出） ---------- */
function openCard(issue: ProofreadIssue) {
  const el = issueMark.get(issue)
  if (!el) {
    warningMessage('该问题已无法在编辑器中定位（内容可能已变更）')
    return
  }
  cardIssue.value = issue
  anchorCard(el)
}
function anchorCard(el?: HTMLElement) {
  const m = el || (cardIssue.value ? issueMark.get(cardIssue.value) : undefined)
  if (!m || !document.contains(m)) {
    cardIssue.value = null
    return
  }
  const r = m.getBoundingClientRect()
  const w = 320
  const left = Math.max(8, Math.min(r.left, window.innerWidth - w - 8))
  const top = Math.min(r.bottom + 8, window.innerHeight - 210)
  cardStyle.value = { top: `${top}px`, left: `${left}px`, width: `${w}px` }
}
let cardTimer: ReturnType<typeof setTimeout> | undefined
let scrollBound = false
function onScrollReanchor() {
  if (cardTimer) clearTimeout(cardTimer)
  cardTimer = setTimeout(() => anchorCard(), 120)
}
function bindReanchor() {
  if (scrollBound) return
  window.addEventListener('scroll', onScrollReanchor, true)
  window.addEventListener('resize', onScrollReanchor)
  scrollBound = true
}
function unbindReanchor() {
  window.removeEventListener('scroll', onScrollReanchor, true)
  window.removeEventListener('resize', onScrollReanchor)
  scrollBound = false
}
function onMarkClick(e: MouseEvent) {
  const el = (e.target as HTMLElement)?.closest?.('.proofread-mark') as HTMLElement | null
  if (!el) return
  const issue = markMap.get(el)
  if (issue) openCard(issue)
}

/* ---------- 定位 ---------- */
function focusIssue(issue: ProofreadIssue) {
  const el = issueMark.get(issue)
  if (!el || !document.contains(el)) {
    warningMessage('该问题已无法在编辑器中定位（内容可能已变更）')
    return false
  }
  el.scrollIntoView({ behavior: 'smooth', block: 'center' })
  el.classList.remove('proofread-flash--focus')
  void el.offsetWidth
  el.classList.add('proofread-flash--focus')
  return true
}

/* ---------- 修正 ---------- */
function applyFix(issue: ProofreadIssue) {
  if (!issue.right) return
  const md = editorStore.MDContent
  const idx = md.indexOf(issue.wrong, issue.index)
  const at = idx === -1 ? md.indexOf(issue.wrong) : idx
  if (at === -1) {
    removeIssue(issue)
    warningMessage('该问题已无法定位（内容已变更），已从列表移除，可重新检查')
    return
  }
  editorStore.setMDContent(
    md.slice(0, at) + issue.right + md.slice(at + issue.wrong.length),
    typeKey.value
  )
  removeIssue(issue)
  if (cardIssue.value === issue) cardIssue.value = null
  if (walkerOpen.value) {
    if (walkerIndex.value >= issues.value.length)
      walkerIndex.value = Math.max(0, issues.value.length - 1)
    if (!issues.value.length) {
      walkerOpen.value = false
      successMessage('全部问题已处理完毕')
    }
  }
  nextTick(() => {
    applyMarks()
    flashFixed(issue.right)
  })
  successMessage('已替换')
}
function removeIssue(issue: ProofreadIssue) {
  removeMark(issue)
  issues.value = issues.value.filter(i => i !== issue)
}
// 替换后在新文本上闪绿
function flashFixed(text: string) {
  const dom = editDom()
  if (!dom) return
  const els: HTMLElement[] = Array.from(dom.querySelectorAll('p,li,h1,h2,h3,h4,h5,h6,td,span'))
  for (const el of els) {
    if ((el.textContent || '').includes(text)) {
      el.classList.add('proofread-flash--success')
      setTimeout(() => el.classList.remove('proofread-flash--success'), 700)
      return
    }
  }
}
function requestFix(issue: ProofreadIssue) {
  if (tier.value === 'free') {
    upgrade()
    return
  }
  applyFix(issue)
}
function cardIgnore() {
  const i = cardIssue.value
  if (i) ignore(i)
}
function cardFix() {
  const i = cardIssue.value
  if (i) applyFix(i)
}

/* ---------- walker ---------- */
function startWalker() {
  if (!issues.value.length) {
    warningMessage('没有待处理的问题')
    return
  }
  walkerIndex.value = 0
  walkerOpen.value = true
  anchorWalker()
  anchorStep(issues.value[0])
}
function anchorWalker() {
  const pane =
    document.querySelector<HTMLElement>('.writable-edit-mode') ||
    document.querySelector<HTMLElement>('.reference-dom')
  const r = pane?.getBoundingClientRect()
  if (r && r.width > 40) {
    walkerStyle.value = {
      left: `${r.left + r.width / 2}px`,
      top: `${Math.min(r.bottom - 54, window.innerHeight - 54)}px`
    }
  } else {
    walkerStyle.value = { left: '50%', bottom: '16px' }
  }
}
function anchorStep(issue?: ProofreadIssue) {
  if (!issue) return
  if (cardIssue.value === issue) return
  cardIssue.value = null
  focusIssue(issue)
  if (cardTimer) clearTimeout(cardTimer)
  cardTimer = setTimeout(() => openCard(issue), 250)
}
function walkPrev() {
  if (walkerIndex.value <= 0) {
    warningMessage('已经是第一处')
    return
  }
  walkerIndex.value -= 1
  anchorStep(issues.value[walkerIndex.value])
}
function walkNext() {
  if (walkerIndex.value >= issues.value.length - 1) {
    warningMessage('已经是最后一处')
    return
  }
  walkerIndex.value += 1
  anchorStep(issues.value[walkerIndex.value])
}
function closeWalker() {
  walkerOpen.value = false
  cardIssue.value = null
}
watch(
  () => issues.value.length,
  n => {
    if (walkerOpen.value && n === 0) {
      closeWalker()
      successMessage('全部问题已处理完毕')
    }
  }
)

/* ---------- 批量修正预览 ---------- */
function openBatch() {
  const list = issues.value.filter(i => i.right && i.severity !== 'low')
  if (!list.length) {
    warningMessage('没有可批量修正的问题：确定错误需能在编辑器中定位到')
    return
  }
  batchItems.value = list.map(issue => ({ issue, off: false }))
  batchAll.value = true
  batchOpen.value = true
}
function toggleBatchAll(v: boolean) {
  batchAll.value = v
  batchItems.value.forEach(b => (b.off = !v))
}
function applyBatch() {
  const sel = batchItems.value.filter(b => !b.off).map(b => b.issue)
  if (!sel.length) {
    warningMessage('未选择任何修正项')
    return
  }
  let md = editorStore.MDContent
  const sorted = [...sel].sort((a, b) => b.index - a.index)
  let n = 0
  for (const i of sorted) {
    const at = md.lastIndexOf(i.wrong, i.index)
    const pos = at === -1 ? md.lastIndexOf(i.wrong) : at
    if (pos === -1) continue
    md = md.slice(0, pos) + i.right + md.slice(pos + i.wrong.length)
    n++
  }
  if (!n) {
    warningMessage('内容已变更，无法定位所选问题，请重新检查')
    return
  }
  editorStore.setMDContent(md, typeKey.value)
  const done = new Set(sel)
  issues.value = issues.value.filter(i => !done.has(i))
  cardIssue.value = null
  batchOpen.value = false
  nextTick(applyMarks)
  successMessage(`已批量修正 ${n} 处，Ctrl+Z 可整体撤销`)
}

/* ---------- 忽略词 ---------- */
function ignore(issue: ProofreadIssue) {
  if (!ignored.value.includes(issue.wrong)) ignored.value.push(issue.wrong)
  persistIgnored()
  removeIssue(issue)
  if (cardIssue.value === issue) cardIssue.value = null
}
function restoreWord(w: string) {
  ignored.value = ignored.value.filter(x => x !== w)
  persistIgnored()
  rescan()
}
function restoreAll() {
  ignored.value = []
  persistIgnored()
  rescan()
}

function upgrade() {
  ElMessageBox.alert(
    `你的简历有 ${
      issues.value.length + hiddenCount.value
    } 处疑似错别字，升级会员立即查看并一键修正`,
    '升级会员解锁修正',
    { confirmButtonText: '去升级', callback: () => router.push('/member') }
  ).catch(() => undefined)
}

/* ---------- 扫描 ---------- */
async function rescan() {
  status.value = 'checking'
  proofreadState.value = { status: 'checking', found: 0 }
  issues.value = []
  hiddenCount.value = 0
  cardIssue.value = null
  const md = editorStore.MDContent || ''
  try {
    if (token() && md.trim()) {
      const res = await fetch('/api/ai/proofread', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token()}` },
        body: JSON.stringify({ content: md })
      }).then(r => r.json())
      if (res?.code === 200) {
        const raw: {
          original?: string
          suggestion?: string
          type?: string
          reason?: string
          severity?: string
        }[] = res.result?.issues || []
        let all = raw
          .map((it): ProofreadIssue | null => {
            const original = it.original || ''
            const idx = md.indexOf(original)
            if (idx === -1) return null
            return {
              index: idx,
              wrong: original,
              right: it.suggestion || '',
              ctx: md.slice(Math.max(0, idx - 12), idx + original.length + 12).replace(/\n/g, ' '),
              kind: it.type === '语病' || it.type === '格式' ? 'format' : 'typo',
              msg: it.reason || `「${original}」应为「${it.suggestion}」`,
              severity: it.severity === 'low' ? 'low' : 'high',
              type: it.type || '错别字',
              reason: it.reason || ''
            }
          })
          .filter((x): x is ProofreadIssue => !!x)
        all = all.filter(i => !ignored.value.includes(i.wrong))
        tier.value = res.result?.tier === 'vip' ? 'vip' : 'free'
        if (tier.value === 'free' && all.length > 2) {
          hiddenCount.value = all.length - 2
          all = all.slice(0, 2)
        }
        issues.value = all
      } else {
        issues.value = localScan(md)
      }
    } else {
      issues.value = localScan(md)
    }
  } catch {
    issues.value = localScan(md)
  }
  for (const i of issues.value) i.module = moduleOf(i)
  status.value = 'done'
  proofreadState.value = { status: 'done', found: issues.value.length + hiddenCount.value }
  trackProofread(typeKey.value, issues.value.length + hiddenCount.value)
  nextTick(applyMarks)
}
function localScan(md: string) {
  const list = scanContent(md).filter(i => !ignored.value.includes(i.wrong))
  return list
}

/* ---------- 抽屉生命周期 ---------- */
function onOutside(e: MouseEvent) {
  if (!drawerOpen.value) return
  const t = e.target as HTMLElement
  if (
    t?.closest?.(
      '.proofread-drawer, .proofread-card, .proofread-walker, .proofread-tool-btn, .el-message-box'
    )
  )
    return
  drawerOpen.value = false
}
function onKey(e: KeyboardEvent) {
  if (e.key === 'Escape' && walkerOpen.value) closeWalker()
}
watch(
  () => props.modelValue,
  async v => {
    drawerOpen.value = v
    cardIssue.value = null
    walkerOpen.value = false
    batchOpen.value = false
    if (v) {
      loadIgnored()
      showIgnored.value = false
      ignoreOpen.value = false
      bindReanchor()
      document.addEventListener('mousedown', onOutside, true)
      document.addEventListener('keydown', onKey)
      const info = await fetchUserInfo()
      const isVip = info ? (info.member_expires || 0) > Date.now() : false
      tier.value = isVip ? 'vip' : 'free'
      await rescan()
      if (tier.value !== 'free') tier.value = isVip ? 'vip' : 'free'
      const dom = editDom()
      dom?.addEventListener('click', onMarkClick)
    } else {
      unbindReanchor()
      clearMarks()
      document.removeEventListener('mousedown', onOutside, true)
      document.removeEventListener('keydown', onKey)
      editDom()?.removeEventListener('click', onMarkClick)
    }
  }
)
watch(drawerOpen, v => {
  emit('update:modelValue', v)
  if (!v) {
    unbindReanchor()
    clearMarks()
    cardIssue.value = null
    walkerOpen.value = false
    document.removeEventListener('mousedown', onOutside, true)
    document.removeEventListener('keydown', onKey)
    editDom()?.removeEventListener('click', onMarkClick)
  }
})
onBeforeUnmount(() => {
  unbindReanchor()
  clearMarks()
  document.removeEventListener('mousedown', onOutside, true)
  document.removeEventListener('keydown', onKey)
})
</script>

<template>
  <el-drawer
    v-model="drawerOpen"
    :with-header="false"
    :modal="false"
    size="min(400px, 92vw)"
    append-to-body
    class="proofread-drawer"
  >
    <div class="proofread-drawer__body">
      <header class="proofread-drawer__header">
        <div class="proofread-drawer__heading">
          <h3 class="proofread-drawer__title">错别字检查</h3>
          <p v-if="issues.length + hiddenCount > 0" class="proofread-drawer__summary">
            共发现 {{ issues.length + hiddenCount }} 处问题
            <span v-if="highCount" class="proofread-drawer__chip proofread-drawer__chip--high"
              >{{ highCount }} 错误</span
            >
            <span v-if="lowCount" class="proofread-drawer__chip proofread-drawer__chip--low"
              >{{ lowCount }} 疑似</span
            >
          </p>
          <p v-else class="proofread-drawer__summary proofread-drawer__summary--ok">
            {{ status === 'checking' ? '正在检查…' : '检查完成' }}
          </p>
        </div>
        <button class="proofread-drawer__close" aria-label="关闭" @click="drawerOpen = false">
          ✕
        </button>
      </header>

      <!-- 空态：检查中 / 全部干净 -->
      <template v-if="isEmpty">
        <div v-if="status === 'checking'" class="proofread-drawer__checking">
          <span class="proofread-drawer__checking-spinner"></span>
          <h4 class="proofread-drawer__checking-title">正在检查错别字…</h4>
          <p class="proofread-drawer__checking-sub">发现的问题会实时标注到编辑器中</p>
        </div>
        <div v-else class="proofread-drawer__empty">
          <div class="proofread-drawer__empty-badge">✓</div>
          <h4 class="proofread-drawer__empty-title">未发现错别字</h4>
          <p class="proofread-drawer__empty-sub">简历文字很干净，放心投递</p>
          <button class="proofread-drawer__empty-recheck" @click="rescan">重新检查</button>
          <button
            v-if="ignored.length"
            class="proofread-drawer__empty-ignored"
            @click="showIgnored = !showIgnored"
          >
            已忽略 {{ ignored.length }} 个词，点击管理
          </button>
        </div>
      </template>

      <template v-else>
        <el-scrollbar class="proofread-drawer__scroll">
          <section v-for="g in groups" :key="g.module" class="proofread-drawer__group">
            <h4 class="proofread-drawer__module">
              {{ g.module }}
              <span class="proofread-drawer__module-count">{{ g.items.length }}</span>
            </h4>
            <article
              v-for="(issue, i) in g.items"
              :key="`${issue.ctx}${issue.wrong}${i}`"
              class="proofread-drawer__item"
            >
              <p class="proofread-drawer__context">{{ tailCtx(issue) }}</p>
              <p class="proofread-drawer__diff">
                <span
                  class="proofread-drawer__sev"
                  :class="{ 'proofread-drawer__sev--low': issue.severity === 'low' }"
                ></span>
                <del>{{ issue.wrong }}</del>
                <span class="proofread-drawer__arrow">→</span>
                <ins :title="issue.right">{{ issue.right || '—' }}</ins>
              </p>
              <p class="proofread-drawer__meta">{{ metaLine(issue) }}</p>
              <div class="proofread-drawer__item-actions">
                <button
                  class="proofread-drawer__action"
                  title="定位到原文"
                  :disabled="g.module === UNLOCATED"
                  @click="focusIssue(issue)"
                >
                  定位
                </button>
                <button
                  class="proofread-drawer__action"
                  title="不再提示这个词（本简历内该词不再报）"
                  @click="ignore(issue)"
                >
                  忽略
                </button>
                <button
                  class="proofread-drawer__action proofread-drawer__action--primary"
                  :title="tier === 'free' ? '升级会员解锁修正' : '替换为建议文本'"
                  :disabled="!issue.right"
                  @click="requestFix(issue)"
                >
                  {{ tier === 'free' ? '🔒 修正' : '修正' }}
                </button>
              </div>
            </article>
          </section>

          <!-- 免费档：模糊样本 + 升级解锁 -->
          <section v-if="tier === 'free' && hiddenCount > 0" class="proofread-drawer__teaser">
            <div v-for="i in teaserShown" :key="i" class="proofread-drawer__blurred">
              <span class="proofread-drawer__blurred-text">疑似错别字，内容已隐藏</span>
            </div>
            <p v-if="teaserMore > 0" class="proofread-drawer__teaser-more">
              还有 {{ teaserMore }} 处问题已隐藏
            </p>
            <button class="proofread-drawer__upgrade" @click="upgrade">
              升级会员，查看全部并一键修正
            </button>
          </section>
        </el-scrollbar>

        <!-- 已忽略词管理 -->
        <section v-if="showIgnored && ignored.length" class="proofread-drawer__ignored">
          <p class="proofread-drawer__ignored-tip">已忽略的词（本简历内不再提示），点 ✕ 恢复</p>
          <div class="proofread-drawer__ignored-words">
            <span
              v-for="w in ignored"
              :key="w"
              class="proofread-drawer__ignored-chip"
              :title="`恢复「${w}」的检查提示`"
            >
              {{ w }}
              <button
                class="proofread-drawer__ignored-remove"
                :aria-label="`恢复 ${w}`"
                @click="restoreWord(w)"
              >
                ✕
              </button>
            </span>
          </div>
          <button class="proofread-drawer__ignored-clear" @click="restoreAll">全部恢复</button>
        </section>

        <footer class="proofread-drawer__footer">
          <div class="proofread-drawer__footer-row">
            <button
              v-if="issues.length"
              class="proofread-drawer__walk"
              title="按顺序逐条定位到原文修改"
              @click="startWalker"
            >
              逐个修改 {{ issues.length }} 处
              <span v-if="tier === 'free'" class="proofread-drawer__vip-tag">VIP</span>
            </button>
            <button
              v-if="fixableCount > 0"
              class="proofread-drawer__batch"
              title="逐条 diff 预览确认后一次性替换，可整体撤销"
              @click="openBatch"
            >
              批量修正 {{ fixableCount }} 处
            </button>
          </div>
          <button
            class="proofread-drawer__recheck"
            :disabled="status === 'checking'"
            @click="rescan"
          >
            {{ status === 'checking' ? '检查中…' : '重新检查' }}
          </button>
          <button
            v-if="ignored.length"
            class="proofread-drawer__ignored-toggle"
            @click="showIgnored = !showIgnored"
          >
            已忽略 {{ ignored.length }} 个词 {{ showIgnored ? '▴' : '▾' }}
          </button>
        </footer>
      </template>
    </div>
  </el-drawer>

  <!-- 点击波浪线标注弹出的修正卡片 -->
  <teleport to="body">
    <transition name="proofread-card">
      <div v-if="cardIssue" class="proofread-card" :style="cardStyle">
        <header class="proofread-card__header">
          <span
            class="proofread-card__tag"
            :class="{ 'proofread-card__tag--low': cardIssue.severity === 'low' }"
            >{{ issueType(cardIssue) }}{{ cardIssue.severity === 'low' ? ' · 疑似' : '' }}</span
          >
          <button class="proofread-card__close" aria-label="关闭" @click="cardIssue = null">
            ✕
          </button>
        </header>
        <div class="proofread-card__body">
          <p class="proofread-card__context">{{ cardIssue.ctx }}</p>
          <p class="proofread-card__diff">
            <del>{{ cardIssue.wrong }}</del>
            <span class="proofread-card__arrow">→</span>
            <ins :title="cardIssue.right">{{ cardIssue.right || '—' }}</ins>
          </p>
          <p class="proofread-card__reason">{{ issueReason(cardIssue) }}</p>
        </div>
        <footer class="proofread-card__footer">
          <button
            class="proofread-card__btn proofread-card__btn--ghost"
            title="不再提示这个词（本简历内该词不再报）"
            @click="cardIgnore"
          >
            忽略
          </button>
          <button
            v-if="tier === 'free'"
            class="proofread-card__btn proofread-card__btn--vip"
            title="升级会员解锁修正"
            @click="upgrade"
          >
            🔒 升级会员解锁修正
          </button>
          <button
            v-else
            class="proofread-card__btn proofread-card__btn--primary"
            :title="`替换为「${cardIssue.right}」`"
            @click="cardFix"
          >
            替换为「{{ cardIssue.right }}」
          </button>
        </footer>
      </div>
    </transition>
  </teleport>

  <!-- 底部居中逐个修改胶囊 -->
  <teleport to="body">
    <transition name="proofread-walk">
      <div
        v-if="walkerOpen && status === 'done' && issues.length"
        class="proofread-walker"
        :style="walkerStyle"
      >
        <button class="proofread-walker__nav" :disabled="walkerIndex <= 0" @click="walkPrev">
          ‹
        </button>
        <span class="proofread-walker__label">
          第 <b>{{ walkerIndex + 1 }}</b> / {{ issues.length }} 处
        </span>
        <span v-if="tier === 'free'" class="proofread-walker__vip">VIP</span>
        <button
          class="proofread-walker__nav"
          :disabled="walkerIndex >= issues.length - 1"
          @click="walkNext"
        >
          ›
        </button>
        <span class="proofread-walker__divider"></span>
        <button class="proofread-walker__close" aria-label="退出逐个修改" @click="closeWalker">
          ✕
        </button>
      </div>
    </transition>
  </teleport>

  <!-- 批量修正预览（逐项勾选） -->
  <el-dialog v-model="batchOpen" width="560px" class="proofread-batch" append-to-body>
    <template #header>
      <div class="proofread-batch__header">
        <div>
          <h3 class="proofread-batch__title">批量修正预览</h3>
          <p class="proofread-batch__subtitle">逐条确认后再应用，可整体撤销</p>
        </div>
        <div class="proofread-batch__actions"></div>
      </div>
    </template>
    <div class="proofread-batch__all">
      <el-checkbox :model-value="batchAll" @change="v => toggleBatchAll(v === true)"
        >全选（{{ batchItems.filter(b => !b.off).length }}/{{ batchItems.length }}）</el-checkbox
      >
    </div>
    <div class="proofread-batch__list">
      <label
        v-for="(b, i) in batchItems"
        :key="i"
        class="proofread-batch__item"
        :class="{ off: b.off }"
      >
        <el-checkbox :model-value="!b.off" @change="() => (b.off = !b.off)" @click.stop />
        <span class="proofread-batch__diff">
          <span class="proofread-batch__row">
            <del>{{ b.issue.wrong }}</del>
            <span class="proofread-batch__arrow">→</span>
            <ins :title="b.issue.right">{{ b.issue.right }}</ins>
            <span class="proofread-batch__type">{{ issueType(b.issue) }}</span>
          </span>
          <span class="proofread-batch__ctx">{{ b.issue.ctx }}</span>
          <span class="proofread-batch__reason">{{ issueReason(b.issue) }}</span>
        </span>
      </label>
    </div>
    <template #footer>
      <button class="proofread-batch__apply" @click="applyBatch">
        应用修正（{{ batchItems.filter(b => !b.off).length }} 处）
      </button>
      <button class="proofread-batch__cancel" @click="batchOpen = false">取消</button>
    </template>
  </el-dialog>
</template>

<style lang="scss">
/* 编辑器内波浪线标注 + 闪烁反馈（全局：作用于 .writable-edit-mode / .reference-dom） */
.proofread-mark {
  background-color: #f56c6f24;
  background-image: url("data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' preserveAspectRatio='none' viewBox='0 0 7 4'%3E%3Cpath fill='none' stroke='%23f56c6f' stroke-width='1.4' d='m0 3 1.75-2L3.5 3l1.75-2L7 3'/%3E%3C/svg%3E");
  background-position: 0 100%;
  background-repeat: repeat-x;
  background-size: 7px 4px;
  border-radius: 2px;
  -webkit-box-decoration-break: clone;
  box-decoration-break: clone;
  cursor: pointer;
  padding-bottom: 2px;
}
.proofread-mark:hover {
  background-color: #f56c6f3d;
}
.proofread-mark--low {
  background-color: #e6a23c24;
  background-image: url("data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' preserveAspectRatio='none' viewBox='0 0 7 4'%3E%3Cpath fill='none' stroke='%23e6a23c' stroke-width='1.4' d='m0 3 1.75-2L3.5 3l1.75-2L7 3'/%3E%3C/svg%3E");
}
.proofread-mark--low:hover {
  background-color: #e6a23c3d;
}
.proofread-mark--new {
  animation: proofread-mark-pop 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) both;
}
.proofread-mark--low.proofread-mark--new {
  animation-name: proofread-mark-pop-low;
}
@keyframes proofread-mark-pop {
  0% {
    background-size: 7px 0;
    box-shadow: 0 0 #f56c6f80;
  }
  45% {
    box-shadow: 0 0 0 7px #f56c6f00;
  }
  60% {
    background-size: 7px 6px;
  }
  to {
    background-size: 7px 4px;
    box-shadow: 0 0 0 8px #f56c6f00;
  }
}
@keyframes proofread-mark-pop-low {
  0% {
    background-size: 7px 0;
    box-shadow: 0 0 #e6a23c80;
  }
  45% {
    box-shadow: 0 0 0 7px #e6a23c00;
  }
  60% {
    background-size: 7px 6px;
  }
  to {
    background-size: 7px 4px;
    box-shadow: 0 0 0 8px #e6a23c00;
  }
}
.proofread-flash--success {
  animation: proofread-flash-success 0.65s ease-out both;
  border-radius: 2px;
}
.proofread-flash--focus {
  animation: proofread-flash-focus 0.7s ease-in-out both;
  border-radius: 2px;
}
@keyframes proofread-flash-success {
  0% {
    background-color: #67c23a73;
  }
  60% {
    background-color: #67c23a2e;
  }
  to {
    background-color: transparent;
  }
}
@keyframes proofread-flash-focus {
  0%,
  to {
    background-color: transparent;
  }
  30%,
  70% {
    background-color: #e6a23c4d;
  }
}

/* 底部居中逐个修改胶囊 */
.proofread-walker {
  align-items: center;
  background: var(--el-bg-color, #fff);
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 999px;
  bottom: 16px;
  box-shadow: 0 8px 24px #0f172a24;
  display: flex;
  gap: 4px;
  padding: 6px 8px;
  position: fixed;
  transform: translateX(-50%);
  user-select: none;
  z-index: 3200;
}
.proofread-walker__nav {
  background: transparent;
  border: none;
  border-radius: 50%;
  color: var(--el-text-color-regular);
  cursor: pointer;
  font-size: 16px;
  height: 26px;
  line-height: 1;
  width: 26px;
}
.proofread-walker__nav:hover:not(:disabled) {
  background: var(--el-fill-color-light);
  color: var(--el-text-color-primary);
}
.proofread-walker__nav:disabled {
  cursor: not-allowed;
  opacity: 0.35;
}
.proofread-walker__label {
  color: var(--el-text-color-secondary);
  font-size: 12px;
  padding: 0 4px;
  white-space: nowrap;
}
.proofread-walker__label b {
  color: var(--theme, var(--el-color-primary));
  font-weight: 600;
}
.proofread-walker__vip {
  background: linear-gradient(135deg, #f7b500, #f59e0b);
  border-radius: 4px;
  color: #fff;
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.5px;
  line-height: 14px;
  padding: 1px 5px;
}
.proofread-walker__divider {
  background: var(--el-border-color-lighter);
  height: 14px;
  width: 1px;
}
.proofread-walker__close {
  background: transparent;
  border: none;
  border-radius: 4px;
  color: var(--el-text-color-secondary);
  cursor: pointer;
  font-size: 12px;
  padding: 2px 4px;
}
.proofread-walker__close:hover {
  background: var(--el-fill-color-light);
  color: var(--el-text-color-primary);
}
.proofread-walk-enter-active,
.proofread-walk-leave-active {
  transition: opacity 0.18s ease, transform 0.18s ease;
}
.proofread-walk-enter-from,
.proofread-walk-leave-to {
  opacity: 0;
  transform: translateX(-50%) translateY(8px);
}

/* 点击标注弹出的修正卡片 */
.proofread-card {
  background: var(--background, #fff);
  border: none;
  border-radius: 12px;
  box-shadow: 0 2px 6px #0f0f0f0f, 0 6px 16px #0f0f0f1a;
  padding: 12px 14px;
  position: fixed;
  user-select: none;
  z-index: 3200;
}
.proofread-card__header {
  align-items: center;
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
}
.proofread-card__tag {
  background: #f56c6f1a;
  border-radius: 4px;
  color: var(--el-color-danger, #f56c6f);
  font-size: 11px;
  padding: 2px 8px;
}
.proofread-card__tag--low {
  background: #e6a23c1a;
  color: var(--el-color-warning, #e6a23c);
}
.proofread-card__close {
  background: transparent;
  border: none;
  border-radius: 4px;
  color: var(--el-text-color-secondary);
  cursor: pointer;
  font-size: 12px;
  padding: 2px 4px;
}
.proofread-card__close:hover {
  background: var(--el-fill-color-light);
  color: var(--el-text-color-primary);
}
.proofread-card__body {
  margin-bottom: 10px;
}
.proofread-card__context {
  color: var(--el-text-color-regular);
  display: -webkit-box;
  font-size: 12px;
  line-height: 1.6;
  margin: 0 0 6px;
  word-break: break-all;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
.proofread-card__diff {
  align-items: baseline;
  display: flex;
  flex-wrap: wrap;
  font-size: 14px;
  gap: 8px;
  margin: 0 0 6px;
}
.proofread-card__diff del {
  color: var(--el-color-danger, #f56c6f);
}
.proofread-card__diff ins {
  color: var(--el-color-success, #67c23a);
  font-weight: 600;
  text-decoration: none;
}
.proofread-card__arrow,
.proofread-card__reason {
  color: var(--el-text-color-secondary);
  font-size: 12px;
}
.proofread-card__reason {
  margin: 0;
}
.proofread-card__footer {
  align-items: center;
  display: flex;
  gap: 8px;
  justify-content: flex-end;
}
.proofread-card__btn {
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 13px;
  padding: 6px 12px;
  transition: transform 0.15s ease, box-shadow 0.15s ease;
}
.proofread-card__btn:active {
  transform: scale(0.96);
}
.proofread-card__btn--ghost {
  background: #0000000a;
  color: var(--el-text-color-secondary);
}
.proofread-card__btn--ghost:hover {
  background: #00000014;
  color: var(--el-text-color-primary);
}
.proofread-card__btn--primary {
  background: var(--theme, var(--el-color-primary));
  color: #fff;
  font-weight: 600;
}
.proofread-card__btn--primary:hover {
  box-shadow: 0 3px 10px #409eff59;
}
.proofread-card__btn--vip {
  background: linear-gradient(135deg, #f7b500, #f59e0b);
  color: #7a4e00;
  font-weight: 600;
}
.proofread-card__btn--vip:hover {
  box-shadow: 0 3px 10px #f59e0b66;
}
.proofread-card-enter-active {
  transition: opacity 0.15s cubic-bezier(0.16, 1, 0.3, 1),
    transform 0.15s cubic-bezier(0.16, 1, 0.3, 1);
}
.proofread-card-leave-active {
  transition: opacity 0.1s ease-in;
}
.proofread-card-enter-from {
  opacity: 0;
  transform: scale(0.92) translateY(-4px);
}
.proofread-card-leave-to {
  opacity: 0;
}

/* 工具按钮状态（tabbar 上「错别字检查」） */
.proofread-tool-btn {
  position: relative;
}
.proofread-tool-btn:disabled {
  cursor: wait;
  opacity: 0.65;
}
.proofread-tool-btn--found {
  background-color: #f56c6f0f !important;
  border-color: #f56c6f99 !important;
  color: #f56c6f !important;
}
.proofread-tool-btn--ok {
  background-color: #67c23a0f !important;
  border-color: #67c23a99 !important;
  color: #67c23a !important;
}
.proofread-btn-spinner {
  animation: proofread-spin 0.7s linear infinite;
  border: 1.5px solid;
  border-radius: 50%;
  border-top: 1.5px solid transparent;
  display: inline-block;
  height: 11px;
  margin-right: 5px;
  vertical-align: -1px;
  width: 11px;
}
@keyframes proofread-spin {
  to {
    transform: rotate(1turn);
  }
}

/* 抽屉（全局类，append-to-body） */
.proofread-drawer .el-drawer__body {
  padding: 0;
}
.proofread-drawer__body {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0;
}
.proofread-drawer__header {
  align-items: flex-start;
  border-bottom: 1px solid #0000000a;
  display: flex;
  justify-content: space-between;
  padding: 16px 20px 12px;
}
.proofread-drawer__heading {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.proofread-drawer__title {
  color: var(--el-text-color-primary);
  font-size: 18px;
  font-weight: 600;
  margin: 0;
}
.proofread-drawer__summary {
  align-items: center;
  color: var(--el-text-color-secondary);
  display: flex;
  font-size: 12px;
  gap: 8px;
  margin: 0;
}
.proofread-drawer__summary--ok {
  color: var(--el-text-color-secondary);
}
.proofread-drawer__chip {
  border-radius: 4px;
  font-size: 11px;
  padding: 1px 6px;
}
.proofread-drawer__chip--high {
  background: #f56c6f1a;
  color: #f56c6f;
}
.proofread-drawer__chip--low {
  background: #e6a23c1a;
  color: #e6a23c;
}
.proofread-drawer__close {
  background: transparent;
  border: none;
  border-radius: 6px;
  color: var(--el-text-color-secondary);
  cursor: pointer;
  font-size: 14px;
  padding: 4px 6px;
}
.proofread-drawer__close:hover {
  background: #0000000d;
  color: var(--el-text-color-primary);
}
.proofread-drawer__scroll {
  flex: 1;
  min-height: 0;
  padding: 8px 20px;
}
.proofread-drawer__group {
  margin-bottom: 4px;
}
.proofread-drawer__module {
  align-items: center;
  color: var(--el-text-color-primary);
  display: flex;
  font-size: 13px;
  font-weight: 600;
  gap: 6px;
  margin: 14px 0 8px;
}
.proofread-drawer__module-count {
  background: #0000000d;
  border-radius: 999px;
  color: var(--el-text-color-secondary);
  font-size: 11px;
  font-weight: 400;
  padding: 1px 8px;
}
.proofread-drawer__item {
  background: #0000000d;
  border-radius: 10px;
  margin-bottom: 8px;
  padding: 10px 12px;
  transition: background-color 0.15s ease;
}
.proofread-drawer__item:hover {
  background: #00000017;
}
.proofread-drawer__context {
  color: var(--el-text-color-secondary);
  display: -webkit-box;
  font-size: 12px;
  line-height: 1.5;
  margin: 0 0 6px;
  word-break: break-all;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
.proofread-drawer__diff {
  align-items: baseline;
  display: flex;
  flex-wrap: wrap;
  font-size: 14px;
  gap: 7px;
  margin: 0 0 6px;
}
.proofread-drawer__diff del {
  color: #f56c6f;
  text-decoration-color: #f56c6f80;
}
.proofread-drawer__diff ins {
  color: var(--el-color-success);
  font-weight: 600;
  text-decoration: none;
}
.proofread-drawer__sev {
  align-self: center;
  background: #f56c6f;
  border-radius: 50%;
  flex-shrink: 0;
  height: 7px;
  width: 7px;
}
.proofread-drawer__sev--low {
  background: #e6a23c;
  opacity: 0.75;
}
.proofread-drawer__arrow {
  color: var(--el-text-color-secondary);
  font-size: 12px;
}
.proofread-drawer__meta {
  color: var(--el-text-color-secondary);
  font-size: 11px;
  line-height: 1.5;
  margin: 0 0 8px;
  word-break: break-all;
}
.proofread-drawer__item-actions {
  align-items: center;
  display: flex;
  gap: 6px;
}
.proofread-drawer__action {
  background: #0000000a;
  border: none;
  border-radius: 7px;
  color: var(--el-text-color-regular);
  cursor: pointer;
  font-size: 12px;
  padding: 4px 10px;
  transition: background-color 0.15s ease, color 0.15s ease, transform 0.15s ease;
}
.proofread-drawer__action:hover:not(:disabled) {
  background: #00000014;
  color: var(--el-text-color-primary);
}
.proofread-drawer__action:active:not(:disabled) {
  transform: scale(0.96);
}
.proofread-drawer__action:disabled {
  cursor: not-allowed;
  opacity: 0.35;
}
.proofread-drawer__action--primary {
  background: var(--el-color-primary-light-9);
  color: var(--theme, var(--el-color-primary));
  font-weight: 600;
  margin-left: auto;
}
.proofread-drawer__action--primary:hover:not(:disabled) {
  background: var(--el-color-primary-light-8);
  color: var(--theme, var(--el-color-primary));
}
.proofread-drawer__teaser {
  background: #0000000d;
  border-radius: 10px;
  margin: 6px 20px 14px;
  padding: 12px;
}
.proofread-drawer__blurred {
  background: #0000000d;
  border-radius: 8px;
  margin-bottom: 8px;
  padding: 8px 10px;
  user-select: none;
}
.proofread-drawer__blurred-text {
  color: var(--el-text-color-regular);
  display: inline-block;
  filter: blur(3px);
  font-size: 12px;
}
.proofread-drawer__teaser-more {
  color: var(--el-text-color-secondary);
  font-size: 12px;
  margin: 0 0 8px;
}
.proofread-drawer__upgrade {
  background: linear-gradient(135deg, #f7b500, #f56c6f);
  border: none;
  border-radius: 8px;
  color: #fff;
  cursor: pointer;
  font-size: 13px;
  font-weight: 600;
  padding: 8px 0;
  transition: transform 0.15s ease, box-shadow 0.15s ease;
  width: 100%;
}
.proofread-drawer__upgrade:hover {
  box-shadow: 0 4px 12px #f56c6f59;
}
.proofread-drawer__footer {
  border-top: 1px solid #0000000d;
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 12px 20px 16px;
}
.proofread-drawer__footer-row {
  display: flex;
  gap: 8px;
}
.proofread-drawer__walk {
  background: var(--el-color-primary-light-9);
  border: none;
  border-radius: 8px;
  color: var(--theme, var(--el-color-primary));
  cursor: pointer;
  flex: 1;
  font-size: 13px;
  font-weight: 600;
  padding: 8px 0;
  transition: background-color 0.15s ease;
}
.proofread-drawer__walk:hover {
  background: var(--el-color-primary-light-8);
}
.proofread-drawer__batch {
  background: var(--theme, var(--el-color-primary));
  border: none;
  border-radius: 8px;
  color: #fff;
  cursor: pointer;
  flex: 1;
  font-size: 13px;
  font-weight: 600;
  padding: 8px 0;
  transition: transform 0.15s ease, box-shadow 0.15s ease;
}
.proofread-drawer__batch:hover {
  box-shadow: 0 3px 10px #409eff4d;
}
.proofread-drawer__recheck {
  background: #0000000a;
  border: none;
  border-radius: 8px;
  color: var(--el-text-color-regular);
  cursor: pointer;
  font-size: 13px;
  padding: 8px 0;
  transition: background-color 0.15s ease;
}
.proofread-drawer__recheck:hover:not(:disabled) {
  background: #00000014;
  color: var(--el-text-color-primary);
}
.proofread-drawer__recheck:disabled {
  cursor: not-allowed;
  opacity: 0.5;
}
.proofread-drawer__checking {
  align-items: center;
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: 6px;
  justify-content: center;
  min-height: 0;
  padding: 24px 28px;
  text-align: center;
}
.proofread-drawer__checking-spinner {
  animation: proofread-spin 0.8s linear infinite;
  border: 3px solid #00000014;
  border-radius: 50%;
  border-top: 3px solid var(--theme, var(--el-color-primary));
  height: 30px;
  margin-bottom: 6px;
  width: 30px;
}
.proofread-drawer__checking-title {
  color: var(--el-text-color-primary);
  font-size: 15px;
  font-weight: 600;
  margin: 0;
}
.proofread-drawer__checking-sub {
  color: var(--el-text-color-secondary);
  font-size: 12px;
  margin: 0;
}
.proofread-drawer__empty {
  align-items: center;
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: 6px;
  justify-content: center;
  min-height: 0;
  padding: 24px 28px;
  text-align: center;
}
.proofread-drawer__empty-badge {
  align-items: center;
  background: #67c23a1f;
  border-radius: 50%;
  color: var(--el-color-success);
  display: flex;
  font-size: 26px;
  font-weight: 600;
  height: 52px;
  justify-content: center;
  margin-bottom: 6px;
  width: 52px;
}
.proofread-drawer__empty-title {
  color: var(--el-text-color-primary);
  font-size: 15px;
  font-weight: 600;
  margin: 0;
}
.proofread-drawer__empty-sub {
  color: var(--el-text-color-secondary);
  font-size: 12px;
  margin: 0;
}
.proofread-drawer__empty-recheck {
  background: var(--el-color-success);
  border: none;
  border-radius: 8px;
  color: #fff;
  cursor: pointer;
  font-size: 13px;
  font-weight: 600;
  margin-top: 14px;
  padding: 8px 26px;
  transition: transform 0.15s ease, box-shadow 0.15s ease;
}
.proofread-drawer__empty-recheck:hover:not(:disabled) {
  box-shadow: 0 3px 10px #67c23a59;
}
.proofread-drawer__empty-recheck:disabled {
  cursor: not-allowed;
  opacity: 0.5;
}
.proofread-drawer__empty-ignored {
  background: transparent;
  border: none;
  color: var(--el-text-color-secondary);
  cursor: pointer;
  font-size: 12px;
  margin-top: 4px;
  padding: 2px 0;
}
.proofread-drawer__empty-ignored:hover {
  color: var(--theme, var(--el-color-primary));
}
.proofread-drawer__ignored {
  background: #0000000d;
  border-radius: 10px;
  margin: 0 20px 14px;
  padding: 12px;
}
.proofread-drawer__ignored-tip {
  color: var(--el-text-color-secondary);
  font-size: 12px;
  margin: 0 0 8px;
}
.proofread-drawer__ignored-words {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-bottom: 8px;
}
.proofread-drawer__ignored-chip {
  align-items: center;
  background: #0000000d;
  border-radius: 999px;
  color: var(--el-text-color-regular);
  display: inline-flex;
  font-size: 12px;
  gap: 4px;
  padding: 3px 8px;
}
.proofread-drawer__ignored-remove {
  background: transparent;
  border: none;
  border-radius: 50%;
  color: var(--el-text-color-secondary);
  cursor: pointer;
  font-size: 10px;
  padding: 0 2px;
}
.proofread-drawer__ignored-remove:hover {
  color: var(--el-color-danger);
}
.proofread-drawer__ignored-clear {
  background: transparent;
  border: none;
  color: var(--el-text-color-secondary);
  cursor: pointer;
  font-size: 12px;
  padding: 2px 0;
}
.proofread-drawer__ignored-clear:hover {
  color: var(--el-text-color-primary);
}
.proofread-drawer__vip-tag {
  background: linear-gradient(135deg, #f7b500, #f59e0b);
  border-radius: 4px;
  color: #fff;
  display: inline-block;
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.5px;
  line-height: 14px;
  margin-left: 4px;
  padding: 1px 5px;
  vertical-align: 1px;
}
.proofread-drawer__ignored-toggle {
  background: transparent;
  border: none;
  color: var(--el-text-color-secondary);
  cursor: pointer;
  font-size: 12px;
  padding: 0;
}
.proofread-drawer__ignored-toggle:hover {
  color: var(--el-text-color-primary);
}

/* 批量修正预览 */
.proofread-batch__all {
  margin-bottom: 8px;
}
.proofread-batch__list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  max-height: 50vh;
  overflow-y: auto;
}
.proofread-batch__item {
  align-items: flex-start;
  background: #00000008;
  border-radius: 10px;
  cursor: pointer;
  display: flex;
  gap: 10px;
  padding: 10px 12px;
}
.proofread-batch__item.off .proofread-batch__diff {
  opacity: 0.45;
}
.proofread-batch__diff {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
}
.proofread-batch__row {
  align-items: baseline;
  display: flex;
  flex-wrap: wrap;
  font-size: 14px;
  gap: 8px;
}
.proofread-batch__row del {
  color: #f56c6f;
}
.proofread-batch__row ins {
  color: var(--el-color-success);
  font-weight: 600;
  text-decoration: none;
}
.proofread-batch__arrow,
.proofread-batch__type,
.proofread-batch__ctx,
.proofread-batch__reason {
  color: var(--el-text-color-secondary);
  font-size: 12px;
}
.proofread-batch__ctx,
.proofread-batch__reason {
  word-break: break-all;
}
.proofread-batch__apply {
  background: var(--theme, var(--el-color-primary));
  border: none;
  border-radius: 8px;
  color: #fff;
  cursor: pointer;
  font-size: 13px;
  font-weight: 600;
  padding: 8px 18px;
}
.proofread-batch__cancel {
  background: #0000000a;
  border: none;
  border-radius: 8px;
  color: var(--el-text-color-regular);
  cursor: pointer;
  font-size: 13px;
  padding: 8px 18px;
}
</style>
