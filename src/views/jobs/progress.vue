<script setup lang="ts">
// 投递进度 — 对齐生产 /progress：云端 /api/progress 为主、未登录落 localStorage；
// 顶部六桶统计卡（全部/待投递/投递中/面试中/Offer/流程终止）、渠道筛选、投递时间排序、
// 状态弹层改状态（待投递→已投递 一键流转）、事件时间线、手动添加表单（生产字段序）
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import dayjs from 'dayjs'
import {
  PROGRESS_STATUSES,
  PROGRESS_NEXT,
  ProgressStatus,
  progressMap,
  ProgressRecord,
  removeProgress,
  statusColor,
  upsertProgress,
  JobSnapshot
} from '@/utils/progress'
import { currentUser } from '@/utils/auth'
import {
  progressPage,
  progressAdd,
  progressEdit,
  progressDelete,
  CloudProgress
} from '@/api/modules/progress'

interface Row {
  job_id: string
  id?: number
  name?: string
  post?: string
  workLocation?: string
  channel?: string
  status: ProgressStatus
  update_time: number
  snapshot?: JobSnapshot
  events?: { status: string; time: number }[]
  link?: string
  mark?: string
  post_time?: number
}

// 云端行 → Row（snapshot JSON 反序列化、status 收窄到枚举）
const cloudToRow = (c: CloudProgress): Row => ({
  id: c.id,
  name: c.name,
  post: c.post,
  workLocation: c.workLocation,
  channel: c.channel,
  link: c.link,
  mark: c.mark,
  job_id: `c-${c.id}`,
  status: c.status as ProgressStatus,
  update_time: c.update_time,
  post_time: c.post_time,
  events: c.events,
  snapshot: (c.snapshot || {}) as unknown as JobSnapshot
})

const user = ref(currentUser())
const loading = ref(false)
const records = ref<Row[]>([])
const keyword = ref('')
const keywordInput = ref('')
const statusFilter = ref('')
const channel = ref('')
const sortOrder = ref<'asc' | 'desc'>('desc')

const channelOptions = ['校招', '社招', '日常实习', '暑期实习']

// 本地快照 → 行
const localToRow = ([job_id, r]: [string, ProgressRecord]): Row => ({
  job_id,
  status: r.status,
  update_time: r.update_time,
  snapshot: r.snapshot
})

async function load() {
  loading.value = true
  try {
    if (user.value) {
      const cloud = await progressPage()
      records.value = cloud.map(cloudToRow)
      // 本地遗留记录 → 上云并清理
      const local = progressMap()
      for (const [job_id, r] of Object.entries(local)) {
        if (!job_id.startsWith('c-')) {
          await progressAdd({
            name: r.snapshot?.company || r.snapshot?.title || '未填写岗位',
            post: r.snapshot?.title || '',
            status: r.status,
            channel: r.snapshot?.channel || '',
            workLocation: r.snapshot?.workLocation || '',
            snapshot: r.snapshot as unknown as Record<string, unknown>,
            post_time: r.update_time || Date.now()
          })
          removeProgress(job_id)
        }
      }
      if (Object.keys(local).some(k => !k.startsWith('c-'))) {
        const again = await progressPage()
        records.value = again.map(cloudToRow)
      }
    } else {
      records.value = Object.entries(progressMap()).map(localToRow)
    }
  } finally {
    loading.value = false
  }
}

// 生产六桶：待投递 / 投递中(已投递+筛选中+笔试) / 面试中(*面) / Offer / 流程终止
const bucketOf = (s: string) =>
  s === '待投递'
    ? 'pending'
    : s === '已投递' || s === '筛选中' || s === '笔试'
    ? 'applied'
    : s.endsWith('面')
    ? 'interviewing'
    : s === 'Offer'
    ? 'offer'
    : s === '流程终止'
    ? 'closed'
    : 'all'

const BUCKETS = [
  { key: '', bucket: 'all', label: '全部', color: '#FF6B3D', from: '#FF9A62', to: '#FF5C38' },
  {
    key: 'pending',
    bucket: 'pending',
    label: '待投递',
    color: '#F7A325',
    from: '#FFC94D',
    to: '#FF9502'
  },
  {
    key: 'applied',
    bucket: 'applied',
    label: '投递中',
    color: '#2F80ED',
    from: '#56CCF2',
    to: '#2F80ED'
  },
  {
    key: 'interviewing',
    bucket: 'interviewing',
    label: '面试中',
    color: '#7C3AED',
    from: '#A78BFA',
    to: '#6D28D9'
  },
  {
    key: 'offer',
    bucket: 'offer',
    label: 'Offer',
    color: '#0F9D77',
    from: '#6EE7B7',
    to: '#0F9D77'
  },
  {
    key: 'closed',
    bucket: 'closed',
    label: '流程终止',
    color: '#E11D48',
    from: '#FB7185',
    to: '#E11D48'
  }
]

const bucketCounts = computed(() => {
  const m: Record<string, number> = {
    all: 0,
    pending: 0,
    applied: 0,
    interviewing: 0,
    offer: 0,
    closed: 0
  }
  for (const r of records.value) {
    m.all++
    const b = bucketOf(r.status)
    if (b !== 'all') m[b]++
  }
  return m
})

const companyOf = (r: Row) => r.snapshot?.company || r.name || '未填写岗位'
const postOf = (r: Row) => r.post || r.snapshot?.title || ''

const filtered = computed(() => {
  let rows = records.value
  const kw = keyword.value.trim()
  if (kw) {
    rows = rows.filter(r =>
      [postOf(r), companyOf(r), r.snapshot?.workLocation, r.snapshot?.channel, r.mark]
        .filter(Boolean)
        .some(v => String(v).includes(kw))
    )
  }
  if (statusFilter.value) rows = rows.filter(r => bucketOf(r.status) === statusFilter.value)
  if (channel.value) rows = rows.filter(r => (r.snapshot?.channel || r.channel) === channel.value)
  rows = [...rows].sort((a, b) => {
    const d = (a.post_time ?? a.update_time ?? 0) - (b.post_time ?? b.update_time ?? 0)
    return sortOrder.value === 'asc' ? d : -d
  })
  return rows
})

const filterLabel = computed(() => {
  const parts: string[] = []
  if (keyword.value) parts.push(`搜索「${keyword.value}」`)
  if (statusFilter.value)
    parts.push(`「${BUCKETS.find(b => b.bucket === statusFilter.value)?.label}」`)
  if (channel.value) parts.push(`「${channel.value}」`)
  return parts.length ? `${parts.join(' · ')}筛选结果` : ''
})

/* ===== 表单（生产字段序：公司名/岗位/工作地点/当前状态/类型/投递时间/备注） ===== */
const dialogVisible = ref(false)
const editingId = ref<string | null>(null)
const saving = ref(false)
const form = reactive({
  name: '',
  post: '',
  workLocation: '',
  status: '已投递' as ProgressStatus,
  channel: '',
  post_time: Date.now(),
  mark: ''
})

function openEdit(row?: Row) {
  if (row) {
    editingId.value = row.job_id
    form.name = companyOf(row) === '未填写岗位' ? '' : companyOf(row)
    form.post = postOf(row)
    form.workLocation = row.snapshot?.workLocation || row.workLocation || ''
    form.status = row.status
    form.channel = row.snapshot?.channel || row.channel || ''
    form.post_time = row.post_time || row.update_time || Date.now()
    form.mark = row.mark || ''
  } else {
    editingId.value = null
    Object.assign(form, {
      name: '',
      post: '',
      workLocation: '',
      status: '已投递',
      channel: '',
      post_time: Date.now(),
      mark: ''
    })
  }
  dialogVisible.value = true
}

async function save() {
  if (!form.name.trim()) return ElMessage.warning('请填写公司名')
  saving.value = true
  try {
    const body = { ...form, post_time: +form.post_time || Date.now() }
    if (user.value) {
      const res = editingId.value?.startsWith('c-')
        ? await progressEdit({ id: +editingId.value.slice(2), ...body })
        : await progressAdd(body)
      if (res.code !== 200) throw new Error(res.msg || '保存失败')
    } else {
      const id = editingId.value ?? `local-${Date.now()}`
      const snapshot: JobSnapshot = {
        title: form.post,
        company: form.name,
        channel: form.channel,
        workLocation: form.workLocation,
        positions: form.post,
        industry: '',
        referralMethod: '',
        deadline: ''
      }
      upsertProgress(id, form.status, snapshot)
    }
    dialogVisible.value = false
    await load()
    ElMessage.success('已保存')
  } catch (e) {
    ElMessage.error((e as Error).message || '保存失败，请重试')
  } finally {
    saving.value = false
  }
}

async function remove(row: Row) {
  await ElMessageBox.confirm(`确定删除「${companyOf(row)}」的投递记录吗？`, '删除记录', {
    type: 'warning'
  })
  if (user.value && row.job_id.startsWith('c-')) {
    const res = await progressDelete(+row.job_id.slice(2))
    if (res.code !== 200) return ElMessage.error(res.msg || '删除失败')
  } else {
    removeProgress(row.job_id)
  }
  await load()
  ElMessage.success('已删除')
}

async function setStatus(row: Row, s: ProgressStatus) {
  if (user.value && row.job_id.startsWith('c-')) {
    const res = await progressEdit({ id: +row.job_id.slice(2), status: s })
    if (res.code !== 200) return ElMessage.error(res.msg || '更新失败，请重试')
  } else {
    upsertProgress(row.job_id, s, row.snapshot)
  }
  await load()
}

// 投递链接：待投递状态点击图标 → 一键转已投递并打开链接（对齐生产）
function openLink(row: Row) {
  const url = row.link || row.snapshot?.referralMethod || ''
  if (row.status === '待投递') setStatus(row, '已投递')
  if (url) window.open(/^https?:/.test(url) ? url : `https://${url}`, '_blank')
}

/* ===== 事件时间线 ===== */
const timelineRow = ref<Row | null>(null)

// 头像底色：公司名哈希（对照生产 me 数组）
const AV_COLORS = [
  '#5B8DEF',
  '#00B578',
  '#FF9F43',
  '#8E7CF4',
  '#F97316',
  '#0EA5E9',
  '#EC4899',
  '#10B981'
]
function avatarBg(name: string) {
  let h = 0
  for (const ch of name) h = (h * 31 + ch.charCodeAt(0)) | 0
  return AV_COLORS[Math.abs(h) % AV_COLORS.length]
}
const avatarChar = (r: Row) => (companyOf(r)[0] || '职').toUpperCase()

const fmtTime = (t?: number) => (t ? dayjs(+t).format('MM-DD HH:mm') : '—')
const fmtDate = (t?: number) => (t ? dayjs(+t).format('YYYY-MM-DD') : '—')

watch(keywordInput, v => {
  // 300ms 防抖（对照生产）
  setTimeout(() => {
    if (keywordInput.value === v) keyword.value = v.trim()
  }, 300)
})

onMounted(load)
</script>

<template>
  <div class="pg-page">
    <h1 class="sr-only">投递进度_校招进度管理_求职进度追踪</h1>
    <header class="ph">
      <div>
        <h1>我的投递进度</h1>
        <p class="ph-sub">
          在<router-link to="/jobs" class="sub-link">校招信息汇总</router-link
          >点击投递自动记录，收藏的岗位统一管理，全程追踪到 Offer
        </p>
      </div>
      <span class="ph-tip">📱 手机上也能管理</span>
    </header>

    <!-- 未登录：生产同款引导卡 -->
    <div v-if="!user" class="guest-card">
      <h2>登录后即可管理你的投递进度</h2>
      <p class="g-desc">
        点击投递自动记录进度，简历准备好后一起投递；登录后进度云端同步，换设备不丢失
      </p>
      <div class="g-feats">
        <div class="gf">
          <span class="gfi">⚡</span><b>投递自动记录</b>
          <p>站内点击投递，进度自动生成</p>
        </div>
        <div class="gf">
          <span class="gfi">☰</span><b>全流程可视</b>
          <p>投递、面试、Offer 一眼看全</p>
        </div>
        <div class="gf">
          <span class="gfi">📱</span><b>多端同步</b>
          <p>云端随查随改，不丢进度</p>
        </div>
      </div>
      <router-link to="/login" class="g-btn">去登录</router-link>
    </div>

    <template v-else>
      <!-- 六桶统计卡（对照生产渐变卡） -->
      <section class="stats6">
        <div
          v-for="b in BUCKETS"
          :key="b.key"
          class="bkt"
          :class="{ active: statusFilter === b.bucket || (!statusFilter && b.bucket === 'all') }"
          :style="{ background: `linear-gradient(135deg, ${b.from}, ${b.to})` }"
          @click="
            statusFilter = statusFilter === b.bucket ? '' : b.bucket === 'all' ? '' : b.bucket
          "
        >
          <span class="bn">{{ bucketCounts[b.bucket] }}</span>
          <span class="bl">{{ b.label }}</span>
        </div>
      </section>

      <section class="toolbar">
        <el-input
          v-model="keywordInput"
          class="kw"
          placeholder="搜索公司 / 职位 / 备注"
          clearable
          @clear="keyword = ''"
        />
        <el-select v-model="channel" placeholder="全部类型" clearable class="ch">
          <el-option v-for="c in channelOptions" :key="c" :label="c" :value="c" />
        </el-select>
        <el-button class="ord" @click="sortOrder = sortOrder === 'asc' ? 'desc' : 'asc'">
          {{ sortOrder === 'asc' ? '最早投递在前' : '最近投递在前' }}
        </el-button>
        <button class="add-btn" @click="openEdit()">+ 手动添加投递记录</button>
      </section>

      <p v-if="filterLabel" class="filter-label">
        {{ filterLabel }}
        <span
          class="clear"
          @click=";(keyword = ''), (keywordInput = ''), (statusFilter = ''), (channel = '')"
          >清除</span
        >
      </p>

      <section v-if="filtered.length" class="list" v-loading="loading">
        <div v-for="r in filtered" :key="r.job_id" class="row">
          <span class="avatar" :style="{ background: avatarBg(companyOf(r)) }">
            {{ avatarChar(r) }}
          </span>
          <div class="main">
            <p class="t">
              {{ companyOf(r) }}
              <span v-if="postOf(r)" class="post">{{ postOf(r) }}</span>
            </p>
            <p class="meta">
              <span v-if="r.snapshot?.workLocation || r.workLocation">
                {{ r.snapshot?.workLocation || r.workLocation }}
              </span>
              <span v-if="r.snapshot?.channel || r.channel" class="chip">
                {{ r.snapshot?.channel || r.channel }}
              </span>
              <span class="ptime">投递时间 {{ fmtDate(r.post_time || r.update_time) }}</span>
              <span v-if="r.mark" class="mark">备注：{{ r.mark }}</span>
            </p>
          </div>
          <div class="side">
            <button
              v-if="r.link || r.snapshot?.referralMethod"
              class="op link-op"
              :title="r.status === '待投递' ? '去投递（转为已投递）' : '打开投递链接'"
              @click="openLink(r)"
            >
              🔗
            </button>
            <el-popover
              trigger="click"
              :width="150"
              popper-class="status-pop"
              placement="bottom-start"
            >
              <template #reference>
                <span
                  class="status"
                  data-status-trigger
                  :style="{
                    background: statusColor(r.status) + '1a',
                    color: statusColor(r.status)
                  }"
                >
                  <i class="dot" :style="{ background: statusColor(r.status) }"></i>
                  {{ r.status }}
                </span>
              </template>
              <div class="sp-list">
                <button
                  v-for="s in PROGRESS_NEXT"
                  :key="s"
                  class="sp-item"
                  :class="{ on: r.status === s }"
                  @click="setStatus(r, s)"
                >
                  <i class="dot" :style="{ background: statusColor(s) }"></i>{{ s }}
                </button>
              </div>
            </el-popover>
            <span class="time" @click="timelineRow = r" :class="{ 'has-tl': r.events?.length }"
              >最近更新 {{ fmtTime(r.update_time) }}</span
            >
            <div class="ops">
              <button class="op" @click="openEdit(r)">编辑</button>
              <button class="op danger" @click="remove(r)">删除</button>
            </div>
          </div>
        </div>
      </section>

      <div v-else class="empty-card">
        <h2>{{ filterLabel ? '当前筛选条件下暂无投递记录' : '还没有投递记录' }}</h2>
        <p>在校招信息列表点「投递记录」，或手动添加一条</p>
        <div class="empty-acts">
          <router-link to="/jobs" class="b primary">去逛校招信息</router-link>
          <button class="b" @click="openEdit()">手动记录</button>
        </div>
      </div>
    </template>

    <!-- 添加/编辑弹层（生产字段序） -->
    <el-dialog
      v-model="dialogVisible"
      :title="editingId ? '编辑投递记录' : '手动添加投递记录'"
      width="440px"
    >
      <el-form label-position="top">
        <el-form-item label="公司名" required>
          <el-input v-model="form.name" placeholder="如：字节跳动" maxlength="50" />
        </el-form-item>
        <el-form-item label="岗位">
          <el-input v-model="form.post" placeholder="如：后端开发（可选）" maxlength="50" />
        </el-form-item>
        <el-form-item label="工作地点">
          <el-input
            v-model="form.workLocation"
            placeholder="如：北京、上海（可选，多个用顿号分隔）"
            maxlength="50"
          />
        </el-form-item>
        <div class="form-row">
          <el-form-item label="当前状态" class="half">
            <el-select v-model="form.status" class="w-full">
              <el-option v-for="s in PROGRESS_STATUSES" :key="s" :label="s" :value="s">
                <span class="st-opt">
                  <i class="dot" :style="{ background: statusColor(s) }"></i>{{ s }}
                </span>
              </el-option>
            </el-select>
          </el-form-item>
          <el-form-item label="类型" class="half">
            <el-select v-model="form.channel" class="w-full" clearable placeholder="可选">
              <el-option v-for="c in channelOptions" :key="c" :label="c" :value="c" />
            </el-select>
          </el-form-item>
        </div>
        <el-form-item label="投递时间">
          <el-date-picker
            v-model="form.post_time"
            type="date"
            class="w-full"
            value-format="x"
            placeholder="选择日期"
          />
        </el-form-item>
        <el-form-item label="备注">
          <el-input
            v-model="form.mark"
            type="textarea"
            :rows="2"
            maxlength="100"
            placeholder="可选，如：内推码、薪资、面试评价等"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="saving" @click="save">保存</el-button>
      </template>
    </el-dialog>

    <!-- 状态弹层（独立，复用 popover 逻辑由 popover 内部承载；这里做时间线查看） -->
    <el-dialog
      :model-value="!!timelineRow"
      title="状态时间线"
      width="380px"
      @close="timelineRow = null"
    >
      <el-timeline v-if="timelineRow?.events?.length">
        <el-timeline-item
          v-for="(ev, i) in timelineRow.events"
          :key="i"
          :timestamp="fmtTime(ev.time)"
          :color="statusColor(ev.status)"
        >
          {{ ev.status }}
        </el-timeline-item>
      </el-timeline>
      <p v-else class="no-tl">暂无状态变更记录</p>
    </el-dialog>
  </div>
</template>

<style lang="scss" scoped>
.pg-page {
  max-width: var(--max-width);
  margin: 0 auto;
  padding: 0 20px 40px;
  font-family: var(--font-noto-sans-sc);
  color: var(--font-color);
}
.ph {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  padding: 24px 0 16px;
  h1 {
    font-size: 24px;
    font-weight: 700;
    margin: 0;
  }
  .ph-sub {
    font-size: 13px;
    color: #909399;
    margin: 6px 0 0;
    .sub-link {
      color: var(--theme);
    }
  }
  .ph-tip {
    font-size: 12px;
    color: #909399;
    background: rgba(0, 0, 0, 0.04);
    border-radius: 999px;
    padding: 4px 12px;
  }
}
.guest-card {
  text-align: center;
  padding: 60px 20px;
  border: 1px solid #eee;
  border-radius: 14px;
  margin-top: 10px;
  h2 {
    font-size: 20px;
  }
  .g-desc {
    color: #909399;
    font-size: 13px;
    margin: 10px 0 30px;
  }
  .g-feats {
    display: flex;
    justify-content: center;
    gap: 40px;
    margin-bottom: 34px;
    .gf {
      width: 180px;
      .gfi {
        font-size: 26px;
      }
      b {
        display: block;
        margin: 8px 0 4px;
      }
      p {
        font-size: 12px;
        color: #909399;
      }
    }
  }
  .g-btn {
    display: inline-block;
    background: var(--theme);
    color: #fff;
    border-radius: 8px;
    padding: 10px 40px;
    font-size: 15px;
  }
}
/* 六桶渐变统计卡（对齐生产） */
.stats6 {
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  gap: 12px;
  .bkt {
    border-radius: 12px;
    padding: 16px 14px;
    color: #fff;
    cursor: pointer;
    display: flex;
    flex-direction: column;
    gap: 2px;
    transition: transform 0.15s, box-shadow 0.15s;
    &:hover {
      transform: translateY(-2px);
    }
    &.active {
      box-shadow: 0 0 0 2px var(--background), 0 0 0 4px var(--theme);
    }
    .bn {
      font-size: 26px;
      font-weight: 700;
      line-height: 1.2;
    }
    .bl {
      font-size: 13px;
      opacity: 0.95;
    }
  }
}
.toolbar {
  display: flex;
  gap: 10px;
  margin: 16px 0 4px;
  flex-wrap: wrap;
  .kw {
    flex: 1;
    min-width: 220px;
  }
  .ch {
    width: 140px;
  }
  .ord {
    margin-left: 0;
  }
  .add-btn {
    border: none;
    background: var(--theme);
    color: #fff;
    border-radius: 8px;
    padding: 0 16px;
    font-size: 14px;
    cursor: pointer;
  }
}
.filter-label {
  font-size: 12px;
  color: #909399;
  margin: 8px 0;
  .clear {
    color: var(--theme);
    cursor: pointer;
    margin-left: 8px;
  }
}
.list {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-top: 6px;
}
.row {
  display: flex;
  align-items: center;
  gap: 14px;
  border: 1px solid #eee;
  border-radius: 12px;
  padding: 14px 16px;
  background: var(--background);
  &:hover {
    border-color: #ddd;
  }
  .avatar {
    width: 40px;
    height: 40px;
    border-radius: 10px;
    color: #fff;
    font-weight: 700;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    font-size: 16px;
  }
  .main {
    flex: 1;
    min-width: 0;
    .t {
      font-weight: 600;
      margin: 0;
      .post {
        font-weight: 400;
        color: #606266;
        margin-left: 8px;
        font-size: 13px;
      }
    }
    .meta {
      font-size: 12px;
      color: #909399;
      margin: 5px 0 0;
      display: flex;
      gap: 8px;
      flex-wrap: wrap;
      .chip {
        background: rgba(0, 0, 0, 0.05);
        border-radius: 4px;
        padding: 1px 6px;
      }
      .mark {
        color: #b5b8bf;
      }
    }
  }
  .side {
    display: flex;
    align-items: center;
    gap: 10px;
    flex-shrink: 0;
    .status {
      border-radius: 999px;
      padding: 4px 12px;
      font-size: 12px;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      gap: 5px;
      .dot {
        width: 6px;
        height: 6px;
        border-radius: 50%;
      }
    }
    .time {
      font-size: 12px;
      color: #c0c4cc;
      &.has-tl {
        color: var(--theme);
        cursor: pointer;
        &:hover {
          text-decoration: underline;
        }
      }
    }
    .ops {
      display: flex;
      gap: 6px;
    }
    .op {
      border: none;
      background: transparent;
      color: #909399;
      font-size: 13px;
      cursor: pointer;
      padding: 4px 6px;
      border-radius: 6px;
      &:hover {
        color: var(--theme);
        background: rgba(0, 0, 0, 0.04);
      }
      &.danger:hover {
        color: #f56c6c;
      }
      &.link-op {
        font-size: 15px;
      }
    }
  }
}
.sp-list {
  display: flex;
  flex-direction: column;
  .sp-item {
    display: flex;
    align-items: center;
    gap: 8px;
    border: none;
    background: transparent;
    padding: 7px 10px;
    border-radius: 6px;
    font-size: 13px;
    cursor: pointer;
    color: var(--font-color);
    text-align: left;
    &:hover {
      background: rgba(0, 0, 0, 0.05);
    }
    &.on {
      color: var(--theme);
      font-weight: 600;
    }
    .dot {
      width: 6px;
      height: 6px;
      border-radius: 50%;
    }
  }
}
.form-row {
  display: flex;
  gap: 12px;
  .half {
    flex: 1;
  }
}
.w-full {
  width: 100%;
}
.st-opt {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  .dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    display: inline-block;
  }
}
.empty-card {
  text-align: center;
  padding: 50px 20px;
  border: 1px dashed #ddd;
  border-radius: 14px;
  margin-top: 16px;
  h2 {
    font-size: 17px;
    margin-bottom: 8px;
  }
  p {
    color: #909399;
    font-size: 13px;
    margin: 0 0 20px;
  }
  .empty-acts {
    display: flex;
    justify-content: center;
    gap: 12px;
    .b {
      border: 1px solid #ddd;
      border-radius: 8px;
      padding: 8px 22px;
      font-size: 14px;
      cursor: pointer;
      background: #fff;
      color: var(--font-color);
      &.primary {
        background: var(--theme);
        color: #fff;
        border-color: var(--theme);
      }
    }
  }
}
.no-tl {
  color: #909399;
  text-align: center;
  font-size: 13px;
}
@media (max-width: 860px) {
  .stats6 {
    grid-template-columns: repeat(3, 1fr);
  }
  .row {
    flex-wrap: wrap;
    .side {
      width: 100%;
      justify-content: flex-end;
    }
  }
}
</style>
