<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import dayjs from 'dayjs'
import {
  PROGRESS_STATUSES,
  ProgressStatus,
  progressMap,
  ProgressRecord,
  removeProgress,
  statusColor,
  upsertProgress,
  JobSnapshot
} from '@/utils/progress'
import { currentUser } from '@/utils/auth'

interface Row extends ProgressRecord {
  job_id: string
}

const user = ref(currentUser())
const loading = ref(false)
const records = ref<Row[]>([])
const keyword = ref('')
const keywordInput = ref('')
const statusFilter = ref('')
const channel = ref('')
const sortField = ref<'time' | 'company'>('time')
const sortOrder = ref<'asc' | 'desc'>('desc')

const channelOptions = ['校招', '社招', '日常实习', '暑期实习']

function load() {
  loading.value = true
  try {
    const m = progressMap()
    records.value = Object.entries(m).map(([job_id, r]) => ({ ...r, job_id }))
  } finally {
    loading.value = false
  }
}

const filtered = computed(() => {
  let rows = records.value
  const kw = keyword.value.trim()
  if (kw) {
    rows = rows.filter(r =>
      [r.snapshot?.title, r.snapshot?.company, r.snapshot?.workLocation, r.snapshot?.channel]
        .filter(Boolean)
        .some(v => String(v).includes(kw))
    )
  }
  if (statusFilter.value) rows = rows.filter(r => r.status === statusFilter.value)
  if (channel.value) rows = rows.filter(r => r.snapshot?.channel === channel.value)
  rows = [...rows].sort((a, b) => {
    if (sortField.value === 'company') {
      const d = String(a.snapshot?.company ?? '').localeCompare(
        String(b.snapshot?.company ?? ''),
        'zh'
      )
      return sortOrder.value === 'asc' ? d : -d
    }
    const d = (a.update_time ?? 0) - (b.update_time ?? 0)
    return sortOrder.value === 'asc' ? d : -d
  })
  return rows
})

const statTiles = computed(() =>
  PROGRESS_STATUSES.map(s => ({
    status: s,
    count: records.value.filter(r => r.status === s).length
  })).filter(t => t.count > 0 || ['已投递', '笔试中', '面试中', 'offer'].includes(t.status))
)

/* ===== 编辑 ===== */
const dialogVisible = ref(false)
const editingId = ref<string | null>(null)
const saving = ref(false)
const form = reactive({
  title: '',
  company: '',
  status: '已投递' as ProgressStatus,
  channel: '',
  workLocation: ''
})

function openEdit(row?: Row) {
  if (row) {
    editingId.value = row.job_id
    form.title = row.snapshot?.title ?? ''
    form.company = row.snapshot?.company ?? ''
    form.status = row.status
    form.channel = row.snapshot?.channel ?? ''
    form.workLocation = row.snapshot?.workLocation ?? ''
  } else {
    editingId.value = null
    form.title = ''
    form.company = ''
    form.status = '已投递'
    form.channel = ''
    form.workLocation = ''
  }
  dialogVisible.value = true
}

function save() {
  if (!form.title.trim() && !form.company.trim()) return ElMessage.warning('职位或公司至少填一项')
  saving.value = true
  const id = editingId.value ?? `local-${Date.now()}`
  const snapshot: JobSnapshot = {
    title: form.title,
    company: form.company,
    channel: form.channel,
    workLocation: form.workLocation,
    positions: form.title,
    industry: '',
    referralMethod: '',
    deadline: ''
  }
  upsertProgress(id, form.status, snapshot)
  saving.value = false
  dialogVisible.value = false
  load()
  ElMessage.success('已保存')
}

async function remove(row: Row) {
  await ElMessageBox.confirm(
    `确定删除「${row.snapshot?.title || row.snapshot?.company || '该记录'}」的投递记录吗？`,
    '删除记录',
    { type: 'warning' }
  )
  removeProgress(row.job_id)
  load()
  ElMessage.success('已删除')
}

function setStatus(row: Row, s: ProgressStatus) {
  upsertProgress(row.job_id, s, row.snapshot)
  load()
}

const fmtTime = (t?: number) => (t ? dayjs(t).format('MM-DD HH:mm') : '—')

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
      <div class="g-icon">
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" />
          <line x1="4" x2="4" y1="22" y2="15" />
        </svg>
      </div>
      <h2>登录后即可管理你的投递进度</h2>
      <p class="g-desc">
        点击投递自动记录进度，简历准备好后一起投递；微信扫码登录，进度自动同步小程序，换设备不丢失
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
          <p>小程序随查随改，不丢进度</p>
        </div>
      </div>
      <router-link to="/login" class="g-btn">微信扫码登录</router-link>
    </div>
    <template v-else>
      <section class="stats">
        <div
          v-for="t in statTiles"
          :key="t.status"
          class="tile"
          :class="{ active: statusFilter === t.status }"
          :style="{ '--tile-c': statusColor(t.status) }"
          @click="statusFilter = statusFilter === t.status ? '' : t.status"
        >
          <span class="n">{{ t.count }}</span>
          <span class="l">{{ t.status }}</span>
        </div>
        <div class="tile total" :class="{ active: !statusFilter }" @click="statusFilter = ''">
          <span class="n">{{ records.length }}</span>
          <span class="l">全部投递</span>
        </div>
      </section>

      <section class="toolbar">
        <el-input
          v-model="keywordInput"
          class="kw"
          placeholder="搜索公司 / 职位 / 地点"
          clearable
          @keyup.enter="keyword = keywordInput"
          @clear="keyword = ''"
          @change="keyword = keywordInput"
        />
        <el-select v-model="channel" placeholder="渠道" clearable class="ch">
          <el-option v-for="c in channelOptions" :key="c" :label="c" :value="c" />
        </el-select>
        <el-select v-model="sortField" class="sf">
          <el-option label="按时间" value="time" />
          <el-option label="按公司" value="company" />
        </el-select>
        <el-button class="ord" @click="sortOrder = sortOrder === 'asc' ? 'desc' : 'asc'">
          {{ sortOrder === 'asc' ? '↑ 升序' : '↓ 降序' }}
        </el-button>
        <button class="add-btn" @click="openEdit()">+ 手动记录</button>
      </section>

      <section v-if="filtered.length" class="list" v-loading="loading">
        <div v-for="r in filtered" :key="r.job_id" class="row">
          <div class="main">
            <p class="t">{{ r.snapshot?.title || '未命名职位' }}</p>
            <p class="meta">
              <span v-if="r.snapshot?.company">{{ r.snapshot.company }}</span>
              <span v-if="r.snapshot?.workLocation">· {{ r.snapshot.workLocation }}</span>
              <span v-if="r.snapshot?.channel" class="chip">{{ r.snapshot.channel }}</span>
            </p>
          </div>
          <div class="side">
            <el-dropdown
              trigger="click"
              @command="(s: string) => setStatus(r, s as ProgressStatus)"
            >
              <span class="status" :style="{ background: statusColor(r.status) }">{{
                r.status
              }}</span>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item v-for="s in PROGRESS_STATUSES" :key="s" :command="s">{{
                    s
                  }}</el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
            <span class="time">{{ fmtTime(r.update_time) }}</span>
            <div class="ops">
              <button class="op" @click="openEdit(r)">编辑</button>
              <button class="op danger" @click="remove(r)">删除</button>
            </div>
          </div>
        </div>
      </section>

      <div v-else class="empty-card">
        <div class="empty-icon">
          <svg
            class="ic-lg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="1.5"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
            <path d="M6 12v5c3 3 9 3 12 0v-5" />
          </svg>
        </div>
        <h2>还没有投递记录</h2>
        <p>在校招信息列表点「投递记录」，或手动添加一条</p>
        <div class="empty-acts">
          <router-link to="/jobs" class="b primary">去逛校招信息</router-link>
          <button class="b" @click="openEdit()">手动记录</button>
        </div>
      </div>
    </template>

    <el-dialog
      v-model="dialogVisible"
      :title="editingId ? '编辑投递记录' : '手动记录投递'"
      width="480px"
    >
      <el-form label-position="top">
        <el-form-item label="职位名称">
          <el-input v-model="form.title" placeholder="如：前端开发工程师" />
        </el-form-item>
        <el-form-item label="公司">
          <el-input v-model="form.company" placeholder="如：字节跳动" />
        </el-form-item>
        <el-form-item label="进度">
          <el-select v-model="form.status" class="w-full">
            <el-option v-for="s in PROGRESS_STATUSES" :key="s" :label="s" :value="s" />
          </el-select>
        </el-form-item>
        <el-form-item label="渠道">
          <el-select v-model="form.channel" class="w-full" clearable>
            <el-option v-for="c in channelOptions" :key="c" :label="c" :value="c" />
          </el-select>
        </el-form-item>
        <el-form-item label="工作地点">
          <el-input v-model="form.workLocation" placeholder="如：北京" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="saving" @click="save">保存</el-button>
      </template>
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
    margin-top: 6px;
    font-size: 14px;
    color: #888;
    .sub-link {
      color: var(--theme);
      text-decoration: none;
      margin: 0 2px;
    }
  }
  .ph-tip {
    color: #aaa;
    font-size: 13px;
    white-space: nowrap;
  }
}
.guest-card {
  background: var(--background);
  border-radius: 16px;
  padding: 48px 24px 40px;
  text-align: center;
  .g-icon {
    width: 56px;
    height: 56px;
    margin: 0 auto;
    border-radius: 14px;
    background: rgba(255, 116, 73, 0.1);
    color: var(--theme);
    display: flex;
    align-items: center;
    justify-content: center;
    svg {
      width: 28px;
      height: 28px;
    }
  }
  h2 {
    margin-top: 16px;
    font-size: 20px;
    font-weight: 700;
  }
  .g-desc {
    margin: 10px auto 0;
    max-width: 460px;
    font-size: 14px;
    color: #999;
    line-height: 1.8;
  }
  .g-feats {
    margin: 28px auto 0;
    display: flex;
    gap: 12px;
    justify-content: center;
    flex-wrap: wrap;
    .gf {
      width: 160px;
      background: var(--body-background);
      border-radius: 12px;
      padding: 18px 12px;
      .gfi {
        font-size: 18px;
        color: var(--theme);
      }
      b {
        display: block;
        margin-top: 6px;
        font-size: 14px;
      }
      p {
        margin: 4px 0 0;
        font-size: 12px;
        color: #999;
      }
    }
  }
  .g-btn {
    display: inline-block;
    margin-top: 24px;
    background: var(--theme);
    color: #fff;
    font-size: 14px;
    padding: 9px 26px;
    border-radius: 8px;
    text-decoration: none;
    &:hover {
      opacity: 0.9;
    }
  }
}
.stats {
  display: grid;
  gap: 12px;
  grid-template-columns: repeat(2, 1fr);
  @media (min-width: 768px) {
    grid-template-columns: repeat(4, 1fr);
  }
  @media (min-width: 1024px) {
    grid-template-columns: repeat(6, 1fr);
  }
}
.tile {
  background: var(--background);
  border-radius: 12px;
  padding: 16px;
  text-align: center;
  cursor: pointer;
  border: 2px solid transparent;
  transition: all 0.2s;
  .n {
    display: block;
    font-size: 24px;
    font-weight: 700;
    color: var(--tile-c, var(--font-color));
  }
  .l {
    display: block;
    margin-top: 4px;
    font-size: 12px;
    color: #888;
  }
  &.active {
    border-color: var(--tile-c, var(--theme));
  }
  &.total .n {
    color: var(--theme);
  }
}
.toolbar {
  margin: 20px 0 16px;
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
  .kw {
    width: 220px;
  }
  .ch {
    width: 140px;
  }
  .sf {
    width: 110px;
  }
  .add-btn {
    margin-left: auto;
    border: none;
    border-radius: 999px;
    background: var(--theme);
    color: #fff;
    font-size: 13px;
    padding: 0 18px;
    cursor: pointer;
  }
}
.list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.row {
  background: var(--background);
  border-radius: 12px;
  padding: 16px 20px;
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  .main {
    flex: 1;
    min-width: 0;
  }
  .t {
    font-size: 15px;
    font-weight: 600;
    margin: 0;
  }
  .meta {
    margin-top: 6px;
    font-size: 13px;
    color: #888;
    .chip {
      display: inline-flex;
      margin-left: 6px;
      padding: 1px 8px;
      border-radius: 999px;
      background: rgba(0, 0, 0, 0.05);
      font-size: 12px;
    }
  }
  .side {
    display: flex;
    align-items: center;
    gap: 14px;
    flex-shrink: 0;
  }
  .status {
    padding: 4px 12px;
    border-radius: 999px;
    color: #fff;
    font-size: 12px;
    font-weight: 500;
    cursor: pointer;
    white-space: nowrap;
  }
  .time {
    font-size: 12px;
    color: #bbb;
    white-space: nowrap;
  }
  .ops {
    display: flex;
    gap: 6px;
    .op {
      border: none;
      background: rgba(0, 0, 0, 0.05);
      color: var(--font-color);
      font-size: 12px;
      border-radius: 6px;
      padding: 5px 10px;
      cursor: pointer;
      &:hover {
        color: var(--theme);
      }
      &.danger {
        color: #f56c6c;
      }
    }
  }
}
.empty-card {
  background: var(--background);
  border-radius: 16px;
  padding: 56px 24px;
  text-align: center;
  .empty-icon {
    width: 64px;
    height: 64px;
    border-radius: 16px;
    margin: 0 auto;
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--theme);
    background: color-mix(in srgb, var(--theme) 10%, transparent);
    .ic-lg {
      width: 32px;
      height: 32px;
    }
  }
  h2 {
    margin-top: 20px;
    font-size: 20px;
    font-weight: 700;
  }
  p {
    margin-top: 10px;
    font-size: 14px;
    color: #888;
  }
  .empty-acts {
    margin-top: 24px;
    display: flex;
    gap: 12px;
    justify-content: center;
    .b {
      padding: 10px 24px;
      border-radius: 999px;
      font-size: 14px;
      text-decoration: none;
      color: var(--theme);
      border: 1px solid var(--theme);
      background: transparent;
      cursor: pointer;
      &.primary {
        background: var(--theme);
        color: #fff;
      }
    }
  }
}
.w-full {
  width: 100%;
}
</style>
