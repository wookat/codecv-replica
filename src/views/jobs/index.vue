<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { ElMessage } from 'element-plus'
import dayjs from 'dayjs'
import { jobPage, jobToday, JobItem } from '@/api/modules/site'
import {
  channelStyle,
  locationStyle,
  PROGRESS_NEXT,
  PROGRESS_STATUSES,
  progressMap,
  ProgressRecord,
  removeProgress,
  splitTags,
  statusColor,
  upsertProgress,
  JobSnapshot,
  ProgressStatus
} from '@/utils/progress'

const loading = ref(false)
const list = ref<JobItem[]>([])
const total = ref(0)
const today = ref(0)
const current = ref(1)
const pageSize = ref(25)

const query = reactive({
  batch: '',
  channel: '',
  title: '',
  company: '',
  workLocation: '',
  industry: '',
  positions: ''
})

const batchOptions = [
  { label: '2025届', value: '2025' },
  { label: '2026届', value: '2026' },
  { label: '2027届', value: '2027' },
  { label: '2028届', value: '2028' }
]
const channelOptions = ['校招', '社招', '日常实习', '暑期实习']

const progress = ref<Record<string, ProgressRecord>>({})

async function loadList() {
  try {
    loading.value = true
    const res = await jobPage({ ...query, current: current.value, pageSize: pageSize.value })
    list.value = res?.data ?? []
    total.value = res?.total ?? 0
  } catch (e) {
    console.error('获取职位列表失败:', e)
    ElMessage.error('获取职位列表失败')
  } finally {
    loading.value = false
  }
}

async function loadToday() {
  try {
    const res = await jobToday()
    today.value = res?.data ?? 0
  } catch (e) {
    console.error('获取今日更新数量失败:', e)
  }
}

function refreshProgress() {
  progress.value = progressMap()
}

function snapshotOf(job: JobItem): JobSnapshot {
  return {
    company: job.company ?? '',
    title: job.title ?? '',
    positions: job.positions ?? '',
    industry: job.industry ?? '',
    channel: job.channel ?? '',
    workLocation: job.workLocation ?? '',
    referralMethod: job.referralMethod ?? '',
    deadline: job.deadline ?? ''
  }
}

/** 收藏/取消收藏（待投递状态） */
function toggleStar(job: JobItem) {
  const id = job._id
  if (!id) return
  const rec = progress.value[id]
  if (!rec) {
    upsertProgress(id, '待投递', snapshotOf(job))
    ElMessage.success('已收藏，可在「我的进度」中统一管理')
  } else if (rec.status === '待投递') {
    removeProgress(id)
    ElMessage.success('已取消收藏')
  }
  refreshProgress()
}

/** 更新投递状态 */
function setStatus(job: JobItem, status: ProgressStatus) {
  const id = job._id
  if (!id) return
  upsertProgress(id, status, snapshotOf(job))
  refreshProgress()
  ElMessage.success(`已更新为「${status}」`)
}

/** 投递：打开投递链接并自动记录已投递 */
function applyJob(job: JobItem) {
  const id = job._id
  if (id) {
    const cur = progress.value[id]?.status
    if (!cur || cur === '待投递') {
      upsertProgress(id, '已投递', snapshotOf(job))
      refreshProgress()
      ElMessage.success('已自动记录投递进度')
    }
  }
  const url = job.referralMethod ?? ''
  if (url) window.open(url, '_blank')
}

function filterByLocation(loc: string) {
  query.workLocation = loc
  search()
}

function search() {
  current.value = 1
  loadList()
}

function reset() {
  Object.assign(query, {
    batch: '',
    channel: '',
    title: '',
    company: '',
    workLocation: '',
    industry: '',
    positions: ''
  })
  current.value = 1
  loadList()
}

function onPageChange(p: number) {
  current.value = p
  loadList()
}

function onSizeChange(s: number) {
  pageSize.value = s
  current.value = 1
  loadList()
}

const fmtDay = (ts?: number) => (ts ? dayjs(ts).format('MM-DD') : '-')
const isToday = (ts?: number) => !!ts && dayjs(ts).isSame(dayjs(), 'day')

const favCount = computed(
  () => Object.values(progress.value).filter(r => r.status !== '待投递').length
)

const faqs = [
  {
    question: '如何快速筛选到适合自己的岗位？',
    answer:
      '顶部搜索栏支持按公司名称、岗位、工作地点、行业等多维度筛选。你也可以直接点击表格中的城市标签快速筛选该地区的所有岗位。'
  },
  {
    question: '岗位信息多久更新一次？',
    answer: '每天持续更新，页面顶部会展示今日新增岗位数和累计岗位总数，方便你判断信息的时效性。'
  },
  {
    question: '支持哪些招聘类型？',
    answer:
      '涵盖校招、秋招、春招、暑期实习、日常实习、社招等多种类型，覆盖28届、27届、26届等各届次的求职需求。'
  }
]

onMounted(() => {
  refreshProgress()
  loadList()
  loadToday()
})
</script>

<template>
  <div class="jobs-page">
    <nav aria-label="面包屑" class="crumb">
      <ol class="flex">
        <li><router-link to="/">首页</router-link></li>
        <li class="sep">/</li>
        <li class="cur">校招信息汇总</li>
      </ol>
    </nav>

    <header class="jobs-header">
      <div class="intro-card">
        <h1>2027校招信息汇总表-秋招春招岗位大全，每日更新</h1>
        <p>
          每日实时更新央企、国企、互联网、银行、研究所、外企等行业校招与实习岗位信息，涵盖全国各地，点击一键投递
        </p>
      </div>
      <div class="stat-cards">
        <div class="stat-card">
          <div class="stat-label">今日更新岗位数</div>
          <div class="stat-num blue">{{ today }}</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">已更新岗位数</div>
          <div class="stat-num green">{{ total }}</div>
        </div>
      </div>
    </header>

    <main>
      <section aria-label="搜索筛选">
        <div class="filter-card">
          <div class="filter-grid">
            <el-select v-model="query.batch" placeholder="招聘批次" clearable>
              <el-option
                v-for="o in batchOptions"
                :key="o.value"
                :label="o.label"
                :value="o.value"
              />
            </el-select>
            <el-select v-model="query.channel" placeholder="招聘类型" clearable>
              <el-option v-for="c in channelOptions" :key="c" :label="c" :value="c" />
            </el-select>
            <el-input
              v-model="query.positions"
              placeholder="请输入岗位"
              clearable
              @keyup.enter="search"
            />
            <el-input
              v-model="query.company"
              placeholder="请输入公司名称"
              clearable
              @keyup.enter="search"
            />
            <el-input
              v-model="query.title"
              placeholder="输入招聘标题（如26实习）"
              clearable
              @keyup.enter="search"
            />
            <el-input
              v-model="query.workLocation"
              placeholder="请输入工作地点"
              clearable
              @keyup.enter="search"
            />
            <el-input
              v-model="query.industry"
              placeholder="请输入行业"
              clearable
              @keyup.enter="search"
            />
            <div class="flex-align-center flex">
              <el-button type="primary" :loading="loading" @click="search"> 搜索 </el-button>
              <el-button @click="reset"> 重置 </el-button>
            </div>
          </div>
        </div>

        <div class="ad-row">
          <router-link
            to="/mianjing"
            target="_blank"
            class="ad-link"
            aria-label="进入面经广场，查看面试笔经"
          >
            <img
              src="/ads/mianjing.webp"
              alt="面经广场：投完递，先看看这家公司的面经——笔试面试真实记录，免费看面经"
              loading="lazy"
              draggable="false"
            />
          </router-link>
          <router-link to="/template" target="_blank" class="ad-link" aria-label="在线免费制作简历">
            <img
              src="/ads/codecv.webp"
              alt="简历制作工具——在线免费制作，200+ 校招模板即套即用，支持导出 PDF"
              loading="lazy"
              draggable="false"
            />
          </router-link>
        </div>
      </section>

      <section aria-label="校招岗位列表">
        <div class="list-head">
          <h2 class="sec-title"><span class="bar"></span> 校招岗位每日更新</h2>
          <router-link to="/progress" class="progress-link">
            <svg
              class="icon"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
              />
            </svg>
            查看我的投递进度
            <span v-if="favCount > 0" class="prog-badge">{{
              favCount > 99 ? '99+' : favCount
            }}</span>
          </router-link>
        </div>

        <div class="table-card">
          <el-table
            :data="list"
            :loading="loading"
            empty-text="暂无职位信息"
            class="w-full"
            :default-sort="{ prop: 'createTime', order: 'descending' }"
          >
            <el-table-column prop="createTime" width="110" label="更新时间">
              <template #default="{ row }">
                <el-badge
                  v-if="isToday(row.createTime)"
                  type="primary"
                  :offset="[-3, -5]"
                  value="新"
                >
                  <div class="fw">{{ fmtDay(row.createTime) }}</div>
                </el-badge>
                <div v-else class="fw line-1">{{ fmtDay(row.createTime) }}</div>
              </template>
            </el-table-column>
            <el-table-column prop="title" label="招聘标题" min-width="200">
              <template #default="{ row }">
                <el-tooltip :content="row.title" placement="top">
                  <div class="fw line-2">{{ row.title || '-' }}</div>
                </el-tooltip>
              </template>
            </el-table-column>
            <el-table-column prop="company" label="公司" min-width="150">
              <template #default="{ row }">
                <el-tooltip :content="row.company" placement="top">
                  <div class="fw line-2">{{ row.company || '-' }}</div>
                </el-tooltip>
              </template>
            </el-table-column>
            <el-table-column prop="workLocation" label="工作地点" width="150">
              <template #default="{ row }">
                <div v-if="row.workLocation && row.workLocation !== '-'" class="loc-wrap">
                  <div class="loc-chips">
                    <template v-for="(loc, i) in splitTags(row.workLocation)" :key="i">
                      <el-tooltip v-if="i < 2" :content="loc" placement="top">
                        <span
                          class="loc-chip"
                          :style="locationStyle(loc)"
                          :title="`点击筛选 ${loc} 的岗位`"
                          @click="filterByLocation(loc)"
                          >{{ loc }}</span
                        >
                      </el-tooltip>
                    </template>
                    <div v-if="splitTags(row.workLocation).length > 2" class="loc-more">
                      <el-tooltip :content="row.workLocation" placement="top">
                        +{{ splitTags(row.workLocation).length - 2 }}
                      </el-tooltip>
                    </div>
                  </div>
                </div>
                <div v-else class="muted">-</div>
              </template>
            </el-table-column>
            <el-table-column prop="industry" label="行业" width="150">
              <template #default="{ row }">
                <div class="line-2">{{ row.industry || '-' }}</div>
              </template>
            </el-table-column>
            <el-table-column prop="positions" label="岗位" width="240">
              <template #default="{ row }">
                <el-tooltip :content="row.positions" placement="top">
                  <div class="line-2">
                    {{ row.positions === '多岗位' ? '岗位较多，点击投递查看' : row.positions }}
                  </div>
                </el-tooltip>
              </template>
            </el-table-column>
            <el-table-column prop="channel" label="招聘类型" width="100">
              <template #default="{ row }">
                <span v-if="row.channel" class="channel-pill" :style="channelStyle(row.channel)">{{
                  row.channel
                }}</span>
                <span v-else class="muted">-</span>
              </template>
            </el-table-column>
            <el-table-column label="投递进度" width="150">
              <template #default="{ row }">
                <div v-if="row._id" class="prog-cell">
                  <el-tooltip
                    v-if="!progress[row._id] || progress[row._id].status === '待投递'"
                    :content="progress[row._id] ? '取消收藏' : '先收藏，简历准备好后一起投递'"
                    placement="top"
                  >
                    <span class="star" @click="toggleStar(row)">
                      <svg
                        class="star-icon"
                        viewBox="0 0 24 24"
                        :fill="progress[row._id] ? '#f7ba2a' : 'none'"
                        stroke="#f7ba2a"
                        stroke-width="1.6"
                        stroke-linejoin="round"
                      >
                        <path
                          d="M12 2.5l2.95 5.98 6.6.96-4.78 4.66 1.13 6.57L12 17.56l-5.9 3.11 1.13-6.57L2.45 9.44l6.6-.96L12 2.5z"
                        />
                      </svg>
                    </span>
                  </el-tooltip>
                  <el-select
                    v-if="progress[row._id]"
                    :model-value="progress[row._id].status"
                    size="small"
                    class="prog-select"
                    :title="
                      progress[row._id].update_time
                        ? `最近更新：${fmtDay(progress[row._id].update_time)}`
                        : '选择更新投递状态'
                    "
                    @change="(s: ProgressStatus) => setStatus(row, s)"
                  >
                    <el-option
                      v-for="s in progress[row._id].status === '待投递'
                        ? PROGRESS_STATUSES
                        : PROGRESS_NEXT"
                      :key="s"
                      :label="s"
                      :value="s"
                    >
                      <span class="opt"
                        ><span class="dot" :style="{ background: statusColor(s) }"></span>
                        {{ s }}</span
                      >
                    </el-option>
                    <template #label="{ value }">
                      <span class="opt"
                        ><span class="dot" :style="{ background: statusColor(value) }"></span>
                        {{ value }}</span
                      >
                    </template>
                  </el-select>
                </div>
              </template>
            </el-table-column>
            <el-table-column prop="deadline" label="截止时间" width="120">
              <template #default> 尽快投递 </template>
            </el-table-column>
            <el-table-column label="操作" width="75" fixed="right">
              <template #default="{ row }">
                <el-button type="primary" size="small" @click="applyJob(row)"> 投递 </el-button>
              </template>
            </el-table-column>
          </el-table>
        </div>

        <div class="pager">
          <el-pagination
            v-model:current-page="current"
            v-model:page-size="pageSize"
            :total="total"
            :page-sizes="[10, 20, 50, 100]"
            background
            layout="prev, pager, next"
            class="pagination-mobile"
            @current-change="onPageChange"
            @size-change="onSizeChange"
          />
        </div>
      </section>

      <section class="faq" aria-label="常见问题">
        <h2 class="sec-title"><span class="bar"></span> 常见问题</h2>
        <div class="faq-card">
          <details v-for="(f, i) in faqs" :key="i" class="group" :open="i === 0">
            <summary class="faq-q">
              <span>{{ f.question }}</span>
              <svg class="chev" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </summary>
            <div class="faq-a">{{ f.answer }}</div>
          </details>
        </div>
      </section>
    </main>
  </div>
</template>

<style lang="scss" scoped>
.jobs-page {
  max-width: var(--max-width);
  margin: 0 auto;
  padding: 0 20px 40px;
  font-family: var(--font-noto-sans-sc);
  color: var(--font-color);
}

.crumb {
  padding: 16px 0;
  ol {
    list-style: none;
    margin: 0;
    padding: 0;
    font-size: 14px;
    li + li {
      margin-left: 8px;
    }
    a {
      color: var(--font-color);
      text-decoration: none;
      &:hover {
        color: var(--theme);
      }
    }
    .sep {
      color: #bbb;
    }
    .cur {
      color: var(--theme);
      font-weight: 500;
    }
  }
}

.jobs-header {
  display: flex;
  gap: 16px;
  margin-bottom: 16px;
  flex-wrap: wrap;

  .intro-card {
    flex: 2;
    background: var(--background);
    border-radius: 6px;
    padding: 24px;
    h1 {
      font-size: 24px;
      font-weight: 700;
      margin: 0;
    }
    p {
      margin-top: 8px;
      line-height: 1.7;
    }
  }

  .stat-cards {
    flex: 1;
    min-width: 280px;
    display: flex;
    gap: 16px;
  }
  .stat-card {
    flex: 1;
    background: var(--background);
    border-radius: 8px;
    padding: 24px;
    text-align: center;
    .stat-label {
      font-size: 14px;
      margin-bottom: 8px;
    }
    .stat-num {
      font-size: 30px;
      font-weight: 700;
      &.blue {
        color: #3b82f6;
      }
      &.green {
        color: #22c55e;
      }
    }
  }
}

.filter-card {
  background: var(--background);
  border-radius: 8px;
  padding: 24px;
  margin-bottom: 16px;
}
.filter-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
  @media (min-width: 1024px) {
    grid-template-columns: repeat(4, 1fr);
  }
}

.ad-row {
  display: grid;
  gap: 12px;
  margin-bottom: 16px;
  @media (min-width: 768px) {
    grid-template-columns: 1fr 1fr;
    gap: 16px;
  }
  .ad-link {
    display: block;
    overflow: hidden;
    border-radius: 8px;
    img {
      width: 100%;
      aspect-ratio: 12 / 5;
      object-fit: cover;
      display: block;
    }
  }
}

.sec-title {
  font-size: 16px;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 0;
  .bar {
    width: 4px;
    height: 20px;
    background: var(--theme);
    border-radius: 999px;
    display: inline-block;
  }
}

.list-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
}
.progress-link {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 14px;
  font-weight: 500;
  color: var(--theme);
  text-decoration: none;
  .icon {
    width: 16px;
    height: 16px;
  }
  &:hover {
    color: #f97316;
  }
  .prog-badge {
    min-width: 18px;
    height: 18px;
    padding: 0 4px;
    border-radius: 999px;
    background: var(--theme);
    color: #fff;
    font-size: 12px;
    font-weight: 700;
    line-height: 18px;
    text-align: center;
  }
}

.table-card {
  border-radius: 8px;
  overflow: hidden;
}

.fw {
  font-weight: 500;
}
.muted {
  color: #9ca3af;
}

.loc-wrap {
  max-width: 100%;
}
.loc-chips {
  display: flex;
  max-width: 100%;
  gap: 4px;
  align-items: center;
  flex-wrap: wrap;
  overflow: hidden;
}
.loc-chip {
  display: inline-block;
  max-width: 100%;
  min-width: 0;
  cursor: pointer;
  border-radius: 999px;
  padding: 4px 8px;
  font-size: 12px;
  font-weight: 500;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  transition: opacity 0.2s;
  &:hover {
    opacity: 0.8;
  }
}
.loc-more {
  font-size: 12px;
  color: #111;
  font-weight: 500;
  background: rgba(0, 0, 0, 0.05);
  padding: 4px 8px;
  border-radius: 999px;
  cursor: pointer;
}

.channel-pill {
  display: inline-block;
  border-radius: 999px;
  padding: 2px 10px;
  font-size: 12px;
  font-weight: 500;
}

.prog-cell {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: nowrap;
}
.star {
  cursor: pointer;
  user-select: none;
  flex-shrink: 0;
  transition: transform 0.2s;
  &:hover {
    transform: scale(1.1);
  }
  .star-icon {
    width: 18px;
    height: 18px;
    display: block;
  }
}
.prog-select {
  width: 100px;
}
.opt {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  .dot {
    width: 6px;
    height: 6px;
    border-radius: 999px;
    flex-shrink: 0;
  }
}

.pager {
  margin-top: 16px;
  display: flex;
  justify-content: center;
}

.faq {
  margin-top: 32px;
  .faq-card {
    margin-top: 16px;
    background: var(--background);
    border-radius: 8px;
    details {
      border-bottom: 1px solid rgba(0, 0, 0, 0.05);
      &:last-child {
        border-bottom: none;
      }
    }
    summary {
      cursor: pointer;
      list-style: none;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      padding: 14px 20px;
      font-size: 14px;
      font-weight: 500;
      transition: background 0.2s;
      &::-webkit-details-marker {
        display: none;
      }
      &:hover {
        background: rgba(0, 0, 0, 0.02);
      }
      .chev {
        width: 16px;
        height: 16px;
        flex-shrink: 0;
        color: #999;
        transition: transform 0.2s;
      }
    }
    details[open] summary {
      color: var(--theme);
      .chev {
        transform: rotate(180deg);
        color: var(--theme);
      }
    }
    .faq-a {
      padding: 0 20px 14px;
      font-size: 14px;
      line-height: 1.8;
      color: var(--writable-font-color);
    }
  }
}
</style>
