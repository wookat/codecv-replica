<script setup lang="ts">
// 生产同款错别字检查抽屉（1:1 流程对齐）：
// 会员：逐个修改 walker（浮动卡片 prev/next「已经是第一处/最后一处」）+ 批量修正预览（逐项开关）
// 非会员：仅显示计数+模糊样本「疑似错别字，内容已隐藏」+ 升级解锁
// 忽略词管理（本简历不再提示）、点击定位到原文、重新检查、空态文案均对齐生产
import { computed, ref, watch } from 'vue'
import useEditorStore from '@/store/modules/editor'
import { scanContent, ProofreadIssue } from './proofread'
import { successMessage, warningMessage } from '@/common/message'
import { useRoute, useRouter } from 'vue-router'
import { getLocalStorage, setLocalStorage } from '@/common/localstorage'
import { fetchUserInfo } from '@/api/modules/cloudResume'
import { trackProofread } from '@/api/modules/share'
import { ElMessageBox } from 'element-plus'

const props = defineProps<{ modelValue: boolean }>()
const emit = defineEmits(['update:modelValue'])

const editorStore = useEditorStore()
const route = useRoute()
const router = useRouter()
const visible = ref(props.modelValue)
const issues = ref<ProofreadIssue[]>([])
const resolved = ref<ProofreadIssue[]>([])
const member = ref(true)
const ignoreVisible = ref(false)
const checking = ref(false)
const tier = ref<'vip' | 'free'>('vip')
const hiddenCount = ref(0)

// walker（逐个修改浮动卡）
const walkOpen = ref(false)
const walkIndex = ref(0)
// 批量修正预览
const batchOpen = ref(false)
const batchItems = ref<{ issue: ProofreadIssue; off: boolean }[]>([])

const typeKey = computed(() => String(route.query.type || 'default'))
const ignoreKey = computed(() => `proofread-ignore-${typeKey.value}`)
const token = () => (getLocalStorage('TOKEN') as string) || ''

const ignored = ref<string[]>([])
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

// 模块分组：按 issue 所在章节推断
function moduleOf(i: ProofreadIssue) {
  const md = editorStore.MDContent || ''
  const head = md.slice(0, i.index)
  const m = head.match(/##\s*[^\n]+/g)
  return m ? m[m.length - 1].replace(/^##\s*/, '').trim() : '基本信息'
}

// 扫描：登录用户走 AI 检查（更准），游客走本地词典
async function rescan() {
  checking.value = true
  issues.value = []
  resolved.value = []
  hiddenCount.value = 0
  const md = editorStore.MDContent || ''
  try {
    if (token() && md.trim()) {
      const res = await fetch('/api/ai/proofread', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token()}` },
        body: JSON.stringify({ content: md })
      }).then(r => r.json())
      if (res?.code === 200) {
        const raw: any[] = res.result?.issues || []
        let all = raw
          .map((it): ProofreadIssue | null => {
            const idx = md.indexOf(it.original || '')
            if (idx === -1) return null
            return {
              index: idx,
              wrong: it.original,
              right: it.suggestion || '',
              ctx: md
                .slice(Math.max(0, idx - 12), idx + String(it.original).length + 12)
                .replace(/\n/g, ' '),
              kind: it.type === '语病' || it.type === '格式' ? 'format' : 'typo',
              msg: it.reason || `「${it.original}」应为「${it.suggestion}」`,
              severity: it.severity === 'low' ? 'low' : 'high'
            } as ProofreadIssue
          })
          .filter((x): x is ProofreadIssue => !!x)
        all = all.filter(i => !ignored.value.includes(i.wrong))
        tier.value = res.result?.tier === 'vip' ? 'vip' : member.value ? 'vip' : 'free'
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
  } finally {
    checking.value = false
    trackProofread(typeKey.value, issues.value.length + hiddenCount.value)
  }
}

function localScan(md: string) {
  return scanContent(md).filter(i => !ignored.value.includes(i.wrong))
}

watch(
  () => props.modelValue,
  async v => {
    visible.value = v
    ignoreVisible.value = false
    walkOpen.value = false
    batchOpen.value = false
    if (v) {
      loadIgnored()
      const info = await fetchUserInfo()
      member.value = info ? (info.member_expires || 0) > Date.now() : false
      await rescan()
      tier.value = member.value ? 'vip' : 'free'
    }
  }
)
watch(visible, v => emit('update:modelValue', v))

const totalCount = computed(() => issues.value.length + hiddenCount.value)
const fixableCount = computed(
  () => issues.value.filter(i => i.right && i.severity !== 'low').length
)
const byModule = computed(() => {
  const map = new Map<string, ProofreadIssue[]>()
  for (const i of issues.value) {
    const m = moduleOf(i)
    if (!map.has(m)) map.set(m, [])
    map.get(m)?.push(i)
  }
  return [...map.entries()]
})

// 定位到原文：预览面板内高亮闪烁
function locate(issue: ProofreadIssue) {
  const dom = document.querySelector('.reference-dom')
  if (!dom) return
  const els: HTMLElement[] = Array.from(dom.querySelectorAll('p,li,h1,h2,h3,h4,h5,h6,td,span'))
  for (const el of els) {
    if ((el.textContent || '').includes(issue.wrong)) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' })
      el.classList.add('proofread-flash')
      setTimeout(() => el.classList.remove('proofread-flash'), 1600)
      return
    }
  }
  warningMessage('该问题已无法在预览中定位（内容可能已变更）')
}

// 单个修正
function fix(issue: ProofreadIssue) {
  if (!issue.right) return
  const md = editorStore.MDContent
  const idx = md.indexOf(issue.wrong, issue.index)
  const at = idx === -1 ? md.indexOf(issue.wrong) : idx
  if (at === -1) {
    issues.value = issues.value.filter(i => i !== issue)
    warningMessage('该问题已无法定位（内容已变更），已从列表移除，可重新检查')
    return
  }
  editorStore.setMDContent(
    md.slice(0, at) + issue.right + md.slice(at + issue.wrong.length),
    typeKey.value
  )
  issues.value = issues.value.filter(i => i !== issue)
  resolved.value.push(issue)
  if (walkOpen.value) {
    if (walkIndex.value >= issues.value.length)
      walkIndex.value = Math.max(0, issues.value.length - 1)
    if (!issues.value.length) walkOpen.value = false
  }
  successMessage('已替换')
}

// 逐个修改 walker
function startWalk() {
  if (!issues.value.length) {
    warningMessage('没有待处理的问题')
    return
  }
  walkIndex.value = 0
  walkOpen.value = true
  locate(issues.value[0])
}
function walkTo(d: number) {
  const ni = walkIndex.value + d
  if (ni < 0) {
    warningMessage('已经是第一处')
    return
  }
  if (ni >= issues.value.length) {
    warningMessage('已经是最后一处')
    return
  }
  walkIndex.value = ni
  locate(issues.value[ni])
}

// 批量修正预览（仅高危+可替换）
function openBatch() {
  const list = issues.value.filter(i => i.right && i.severity !== 'low')
  if (!list.length) {
    warningMessage('没有可批量修正的问题：确定错误需能在编辑器中定位到')
    return
  }
  batchItems.value = list.map(issue => ({ issue, off: false }))
  batchOpen.value = true
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
  resolved.value.push(...sel)
  batchOpen.value = false
  successMessage(`已批量修正 ${n} 处，Ctrl+Z 可整体撤销`)
}

// 忽略词
function ignore(issue: ProofreadIssue) {
  if (!ignored.value.includes(issue.wrong)) ignored.value.push(issue.wrong)
  persistIgnored()
  issues.value = issues.value.filter(i => i !== issue)
}
function unignore(w: string) {
  ignored.value = ignored.value.filter(x => x !== w)
  persistIgnored()
  rescan()
}
function unignoreAll() {
  ignored.value = []
  persistIgnored()
  rescan()
}

// 非会员升级提示（生产文案）
function upgrade() {
  ElMessageBox.alert(
    `你的简历有 ${totalCount.value} 处疑似错别字，升级会员立即查看并一键修正`,
    '升级会员解锁修正',
    { confirmButtonText: '去升级', callback: () => router.push('/member') }
  ).catch(() => undefined)
}

const noContent = computed(() => !(editorStore.MDContent || '').trim())
</script>

<template>
  <el-drawer
    v-model="visible"
    title="错别字检查"
    size="400px"
    class="proofread-drawer"
    append-to-body
  >
    <!-- 非会员：样本 + 模糊隐藏 + 升级解锁（生产同款） -->
    <template v-if="tier === 'free'">
      <p class="free-tip">你的简历有 {{ totalCount }} 处疑似错别字，升级会员立即查看并一键修正</p>
      <div v-for="(issue, i) in issues" :key="i" class="issue" @click="locate(issue)">
        <div class="issue-msg">
          <span class="sev" :class="'sev--' + (issue.severity || 'high')">{{
            issue.severity === 'low' ? '轻微' : '确定'
          }}</span>
          {{ issue.msg }}
        </div>
        <div class="issue-ctx">…{{ issue.ctx }}…</div>
        <div class="issue-ops">
          <button class="fix lock" @click.stop="upgrade">🔒 修正</button>
          <button class="ignore" @click.stop="ignore(issue)">忽略</button>
        </div>
      </div>
      <div v-for="i in hiddenCount" :key="'h' + i" class="issue blurred">
        <div class="issue-msg">疑似错别字，内容已隐藏</div>
        <div class="issue-ops">
          <button class="fix lock" @click="upgrade">🔒 修正</button>
        </div>
      </div>
      <button class="mg-btn" @click="upgrade">升级会员解锁修正</button>
    </template>

    <template v-else>
      <div class="topbar">
        <span class="cnt">共 {{ totalCount }} 处</span>
        <div class="ops">
          <button
            v-if="issues.length"
            class="walk"
            title="按顺序逐条定位到原文修改"
            @click="startWalk"
          >
            逐个修改 {{ issues.length }} 处
          </button>
          <button
            v-if="fixableCount"
            class="fix-all"
            title="逐条 diff 预览确认后一次性替换，可整体撤销"
            @click="openBatch"
          >
            批量修正 {{ fixableCount }} 处
          </button>
          <button class="ig-btn" @click="ignoreVisible = !ignoreVisible">
            已忽略({{ ignored.length }})
          </button>
          <button class="re-btn" :disabled="checking" @click="rescan">重新检查</button>
        </div>
      </div>

      <div v-if="ignoreVisible" class="ignore-panel">
        <p class="ig-tip">被忽略的词在本简历内不再提示</p>
        <div v-if="ignored.length" class="ig-list">
          <span
            v-for="w in ignored"
            :key="w"
            class="ig-tag"
            :title="`恢复「${w}」的检查提示`"
            @click="unignore(w)"
          >
            {{ w }}<i>✕</i>
          </span>
        </div>
        <p v-else class="ig-empty">暂无忽略词</p>
        <button v-if="ignored.length" class="ig-all" @click="unignoreAll">全部恢复</button>
      </div>

      <div v-if="checking" class="empty">检查中…</div>
      <div v-else-if="noContent" class="empty">简历中还没有内容 可以先写点东西</div>
      <div v-else-if="!issues.length" class="empty">未发现问题，简历用词规范</div>

      <div v-for="[mod, list] in byModule" :key="mod" class="module">
        <p class="mod-name">{{ mod }}</p>
        <div v-for="(issue, i) in list" :key="i" class="issue" @click="locate(issue)">
          <div class="issue-msg">
            <span class="sev" :class="'sev--' + (issue.severity || 'high')">{{
              issue.severity === 'low' ? '轻微' : '确定'
            }}</span>
            {{ issue.msg }}
          </div>
          <div class="issue-ctx">…{{ issue.ctx }}…</div>
          <div class="issue-ops">
            <button v-if="issue.right" class="fix" @click.stop="fix(issue)">替换为建议文本</button>
            <button class="ignore" @click.stop="ignore(issue)">忽略</button>
          </div>
        </div>
      </div>
    </template>
  </el-drawer>

  <!-- 逐个修改浮动卡（walker） -->
  <div v-if="walkOpen && issues.length" class="proofread-walker">
    <div class="w-head">
      <span>{{ walkIndex + 1 }} / {{ issues.length }}</span>
      <span class="w-close" @click="walkOpen = false">退出逐个修改</span>
    </div>
    <div class="w-body">
      <p class="w-msg">{{ issues[walkIndex].msg }}</p>
      <p class="w-ctx">…{{ issues[walkIndex].ctx }}…</p>
    </div>
    <div class="w-ops">
      <button class="w-nav" @click="walkTo(-1)">上一处</button>
      <button v-if="issues[walkIndex].right" class="w-fix" @click="fix(issues[walkIndex])">
        修正
      </button>
      <button class="w-ig" @click="ignore(issues[walkIndex])">忽略</button>
      <button class="w-nav" @click="walkTo(1)">下一处</button>
    </div>
  </div>

  <!-- 批量修正预览 -->
  <el-dialog v-model="batchOpen" title="批量修正预览" width="560px" class="batch-dialog">
    <p class="bd-tip">逐条确认后再应用，可整体撤销</p>
    <div class="bd-list">
      <div
        v-for="(b, i) in batchItems"
        :key="i"
        class="bd-item"
        :class="{ off: b.off }"
        @click="b.off = !b.off"
      >
        <span class="bd-check">{{ b.off ? '○' : '●' }}</span>
        <span class="bd-wrong">{{ b.issue.wrong }}</span>
        <span class="bd-arrow">→</span>
        <span class="bd-right">{{ b.issue.right }}</span>
        <span class="bd-ctx">…{{ b.issue.ctx }}…</span>
      </div>
    </div>
    <div class="bd-ops">
      <button class="b primary" @click="applyBatch">
        最高权重应用（{{ batchItems.filter(b => !b.off).length }} 处）
      </button>
      <button class="b ghost" @click="batchOpen = false">取消</button>
    </div>
  </el-dialog>
</template>

<style lang="scss">
// 非 scoped：walker flash 高亮需要作用到预览 DOM
.proofread-flash {
  outline: 2px solid #f56c6c;
  outline-offset: 2px;
  border-radius: 3px;
  transition: outline-color 0.3s;
}
.proofread-walker {
  position: fixed;
  right: 24px;
  bottom: 96px;
  z-index: 2100;
  width: 320px;
  background: #fff;
  border-radius: 10px;
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.18);
  padding: 12px 14px;
  .w-head {
    display: flex;
    justify-content: space-between;
    font-size: 12px;
    color: #909399;
    .w-close {
      cursor: pointer;
      color: var(--theme);
    }
  }
  .w-msg {
    font-size: 13px;
    font-weight: 600;
    color: #e64545;
    margin: 8px 0 4px;
  }
  .w-ctx {
    font-size: 12px;
    color: #909399;
    margin: 0 0 10px;
    word-break: break-all;
  }
  .w-ops {
    display: flex;
    gap: 8px;
    button {
      flex: 1;
      border: 1px solid #ddd;
      background: #fff;
      border-radius: 6px;
      padding: 5px 0;
      font-size: 12px;
      cursor: pointer;
      &.w-fix {
        background: var(--theme);
        border-color: var(--theme);
        color: #fff;
      }
    }
  }
}
</style>

<style lang="scss" scoped>
.empty {
  color: #909399;
  text-align: center;
  margin-top: 40px;
}
.free-tip {
  font-size: 14px;
  line-height: 1.7;
  background: #fff7ed;
  border: 1px solid #fed7aa;
  border-radius: 8px;
  padding: 10px 12px;
  color: #c2410c;
}
.mg-btn {
  display: block;
  margin: 16px auto 0;
  border: none;
  background: var(--theme);
  color: #fff;
  border-radius: 999px;
  padding: 9px 26px;
  font-size: 14px;
  cursor: pointer;
}
.topbar {
  padding-bottom: 10px;
  border-bottom: 1px solid #eee;
  .cnt {
    font-size: 13px;
    color: #909399;
    display: block;
    margin-bottom: 8px;
  }
  .ops {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }
  .fix-all {
    border: none;
    background: var(--theme);
    color: #fff;
    border-radius: 6px;
    padding: 4px 12px;
    font-size: 12px;
    cursor: pointer;
  }
  .walk {
    border: 1px solid var(--theme);
    background: #fff;
    color: var(--theme);
    border-radius: 6px;
    padding: 4px 12px;
    font-size: 12px;
    cursor: pointer;
  }
  .ig-btn,
  .re-btn {
    border: 1px solid #ddd;
    background: #fff;
    border-radius: 6px;
    padding: 4px 12px;
    font-size: 12px;
    cursor: pointer;
    color: #606266;
  }
}
.ignore-panel {
  background: #f8f8f8;
  border-radius: 8px;
  padding: 10px 12px;
  margin-top: 10px;
  .ig-tip {
    font-size: 12px;
    color: #909399;
    margin: 0 0 8px;
  }
  .ig-list {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
  }
  .ig-tag {
    font-size: 12px;
    background: #fff;
    border: 1px solid #e2e4e9;
    border-radius: 999px;
    padding: 3px 8px;
    cursor: pointer;
    i {
      font-style: normal;
      margin-left: 4px;
      color: #f56c6c;
    }
  }
  .ig-empty {
    font-size: 12px;
    color: #c0c4cc;
    margin: 0;
  }
  .ig-all {
    margin-top: 8px;
    border: none;
    background: none;
    color: var(--theme);
    font-size: 12px;
    cursor: pointer;
    padding: 0;
  }
}
.module {
  .mod-name {
    font-size: 12px;
    color: #909399;
    margin: 14px 0 0;
    padding-bottom: 4px;
    border-bottom: 1px dashed #eee;
  }
}
.issue {
  border-bottom: 1px solid #eee;
  padding: 12px 0;
  cursor: pointer;
  &.blurred .issue-msg {
    filter: blur(3px);
    user-select: none;
  }
  .issue-msg {
    color: #e64545;
    font-size: 13px;
    font-weight: 600;
    .sev {
      display: inline-block;
      font-size: 11px;
      font-weight: 500;
      border-radius: 4px;
      padding: 0 6px;
      margin-right: 6px;
      &.sev--high {
        background: #fef0f0;
        color: #f56c6c;
      }
      &.sev--low {
        background: #f4f4f5;
        color: #909399;
      }
    }
  }
  .issue-ctx {
    color: #909399;
    font-size: 12px;
    margin: 6px 0;
    word-break: break-all;
  }
  .issue-ops {
    display: flex;
    gap: 8px;
    button {
      border: 1px solid #ddd;
      background: #fff;
      border-radius: 4px;
      padding: 3px 10px;
      font-size: 12px;
      cursor: pointer;
      &.fix {
        color: var(--theme);
        border-color: var(--theme);
        &.lock {
          color: #909399;
          border-color: #ddd;
        }
      }
      &.ignore {
        color: #909399;
      }
    }
  }
}
</style>
