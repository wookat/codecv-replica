<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { mianjingList, mianjingMeta, MianjingCompany, MianjingItem } from '@/api/modules/site'
import { localAsset, logoColor } from '@/utils/article'
import { fmtCN } from '@/utils/time'

const loading = ref(false)
const list = ref<MianjingItem[]>([])
const total = ref(0)
const companies = ref<(MianjingCompany & { count?: number })[]>([])
const stats = ref<{
  total?: number
  companyCount?: number
  positionCount?: number
  questionCount?: number
}>({})
const positions = ref<{ slug?: string; name: string }[]>([])

const batch = ref('')
const position = ref('')
const keyword = ref('')
const sort = ref<'new' | 'hot'>('new')
const current = ref(1)
const pageSize = 20

const batchOptions = ['秋招', '春招', '暑期实习', '日常实习', '社招']

const batchLabel = (m: MianjingItem) => {
  const g = m.grade ? `${String(m.grade).slice(2)}届` : ''
  const b =
    {
      qiuzhao: '秋招',
      chunzhao: '春招',
      shuxi: '暑期实习',
      'shuqi-shixi': '暑期实习',
      'richang-shixi': '日常实习',
      shezhao: '社招'
    }[m.batch as string] ?? m.batch
  return `${g}${b}`
}

const resultClass = (r?: string) =>
  r === '已offer' || r === 'offer'
    ? 'mj-chip--green'
    : r === '已挂' || r === '淘汰'
    ? 'mj-chip--gray'
    : 'mj-chip--amber'

// 生产同款无限滚动：哨兵触发 append 加载，筛选变化时重置
const sentinel = ref<HTMLElement | null>(null)
const hasMore = computed(() => list.value.length < total.value)

async function load(append = false) {
  if (loading.value) return
  try {
    loading.value = true
    const res = await mianjingList({
      current: current.value,
      pageSize,
      keyword: keyword.value || undefined,
      batch: batch.value || undefined,
      position: position.value || undefined
    })
    const rows = res?.data ?? []
    list.value = append ? [...list.value, ...rows] : rows
    total.value = res?.total ?? 0
  } catch (e) {
    console.error('获取面经列表失败:', e)
  } finally {
    loading.value = false
  }
}

let observer: IntersectionObserver | null = null
function setupObserver() {
  observer?.disconnect()
  observer = new IntersectionObserver(
    entries => {
      if (entries[0].isIntersecting && hasMore.value && !loading.value) {
        current.value++
        load(true)
      }
    },
    { rootMargin: '200px' }
  )
  if (sentinel.value) observer.observe(sentinel.value)
}

const hotList = computed(() =>
  [...list.value].sort((a, b) => (b.viewCount ?? 0) - (a.viewCount ?? 0)).slice(0, 5)
)
const shown = computed(() =>
  sort.value === 'hot'
    ? [...list.value].sort((a, b) => (b.viewCount ?? 0) - (a.viewCount ?? 0))
    : list.value
)

function pick(key: 'batch' | 'position', v: string) {
  if (key === 'batch') batch.value = batch.value === v ? '' : v
  else position.value = position.value === v ? '' : v
  current.value = 1
  list.value = []
  load()
}

let debounce: ReturnType<typeof setTimeout> | null = null
function onKeyword(v: string) {
  if (debounce) clearTimeout(debounce)
  debounce = setTimeout(() => {
    keyword.value = v
    current.value = 1
    list.value = []
    load()
  }, 300)
}

const fmtTime = (ts?: number) => (ts ? fmtCN(ts) : '')

const companyOf = (m: MianjingItem) => companies.value.find(c => c.slug === m.companySlug)
const isHot = (m: MianjingItem) => (m.viewCount ?? 0) >= 100

onMounted(async () => {
  load().then(setupObserver)
  try {
    const [cs, st, ps, all] = await Promise.all([
      mianjingMeta('companies'),
      mianjingMeta('stats'),
      mianjingMeta('positions'),
      mianjingList({ current: 1, pageSize: 100 }).catch(() => null)
    ])
    stats.value = st?.data ?? {}
    // 生产只展示有内容的岗位/公司（岗位5个/公司9家），按面经数排序
    const allItems: MianjingItem[] = all?.data ?? []
    const pCount: Record<string, number> = {}
    const cCount: Record<string, number> = {}
    allItems.forEach(i => {
      if (i.positionSlug) pCount[i.positionSlug] = (pCount[i.positionSlug] ?? 0) + 1
      if (i.positionName) pCount[i.positionName] = (pCount[i.positionName] ?? 0) + 1
      if (i.companySlug) cCount[i.companySlug] = (cCount[i.companySlug] ?? 0) + 1
      if (i.companyName) cCount[i.companyName] = (cCount[i.companyName] ?? 0) + 1
    })
    positions.value = (Array.isArray(ps?.data) ? ps.data : []).filter(
      (p: any) => (pCount[p.slug] ?? pCount[p.name] ?? 0) > 0
    )
    companies.value = (Array.isArray(cs?.data) ? cs.data : [])
      .map((c: any) => ({ ...c, count: cCount[c.slug] ?? cCount[c.name] ?? 0 }))
      .filter(c => c.count > 0)
      .sort((a, b) => b.count - a.count)
  } catch (e) {
    console.error('获取面经元数据失败:', e)
  }
})

onUnmounted(() => observer?.disconnect())
</script>

<template>
  <div class="mj-page">
    <header class="mj-head">
      <div>
        <h1>面经大全</h1>
        <p class="mj-stats">
          <b>{{ stats.total ?? total }}</b> 篇面经 · 覆盖
          {{ stats.companyCount ?? companies.length }} 家公司 ·
          {{ stats.positionCount ?? positions.length }} 个岗位方向 ·
          {{ stats.questionCount ?? '-' }} 道面试题
        </p>
      </div>
      <div class="mj-head-right">
        <div class="mj-search">
          <svg
            class="ic"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <path d="m21 21-4.34-4.34" />
            <circle cx="11" cy="11" r="8" />
          </svg>
          <input
            type="text"
            placeholder="搜公司、岗位或关键词"
            @input="onKeyword(($event.target as HTMLInputElement).value)"
          />
        </div>
        <router-link to="/mianjing/write" class="mj-btn">
          <svg
            class="ic"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <path d="M13 21h8" />
            <path d="m15 5 4 4" />
            <path
              d="M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z"
            />
          </svg>
          投稿面经
        </router-link>
      </div>
    </header>

    <section class="mj-card filters">
      <div class="frow">
        <span class="flabel">批次</span>
        <div class="pills">
          <button class="mj-pill" :class="{ active: !batch }" @click="pick('batch', '')">
            全部
          </button>
          <button
            v-for="b in batchOptions"
            :key="b"
            class="mj-pill"
            :class="{ active: batch === b }"
            @click="pick('batch', b)"
          >
            {{ b }}
          </button>
        </div>
      </div>
      <div class="frow">
        <span class="flabel">岗位</span>
        <div class="pills">
          <button class="mj-pill" :class="{ active: !position }" @click="pick('position', '')">
            全部
          </button>
          <button
            v-for="p in positions"
            :key="p.slug ?? p.name"
            class="mj-pill"
            :class="{ active: position === (p.slug ?? p.name) }"
            @click="pick('position', p.slug ?? p.name)"
          >
            {{ p.name }}
          </button>
        </div>
      </div>
      <div class="frow">
        <span class="flabel">公司</span>
        <div class="comps">
          <router-link
            v-for="c in companies"
            :key="c.slug"
            :to="`/mianjing/c/${c.slug}`"
            class="comp-pill"
            :title="c.name"
          >
            <span class="mj-logo" :style="{ '--mj-logo-bg': logoColor(c.slug) } as any">
              <img
                v-if="c.logo"
                :src="localAsset(c.logo)"
                :alt="c.name"
                class="mj-logo-img"
                draggable="false"
              />
              <template v-else>{{ c.name?.[0] }}</template>
            </span>
            <span class="cn">{{ c.name }}</span>
            <span class="cc">{{ c.count ?? '' }}</span>
          </router-link>
        </div>
      </div>
    </section>

    <div class="mj-main">
      <main class="mj-list">
        <div class="list-head">
          <h2>最新面经</h2>
          <div class="sort-pills">
            <button class="mj-pill sm" :class="{ active: sort === 'new' }" @click="sort = 'new'">
              最新
            </button>
            <button class="mj-pill sm" :class="{ active: sort === 'hot' }" @click="sort = 'hot'">
              最热
            </button>
          </div>
        </div>
        <div v-loading="loading" class="items">
          <router-link v-for="m in shown" :key="m._id" :to="`/mianjing/p/${m._id}`" class="mj-item">
            <div class="item-top">
              <span
                class="mj-logo lg"
                :style="{ '--mj-logo-bg': logoColor(m.companySlug || m.companyName || '') } as any"
              >
                <img
                  v-if="companyOf(m)?.logo"
                  :src="localAsset(companyOf(m)!.logo)"
                  :alt="m.companyName"
                  class="mj-logo-img"
                  draggable="false"
                />
                <template v-else>{{ (m.companyName || '?')[0] }}</template>
              </span>
              <div class="item-head">
                <div class="item-title-row">
                  <h3>{{ m.title }}</h3>
                  <span v-if="isHot(m)" class="hot-badge">
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      stroke-width="2"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                    >
                      <path
                        d="M12 3q1 4 4 6.5t3 5.5a1 1 0 0 1-14 0 5 5 0 0 1 1-3 1 1 0 0 0 5 0c0-2-1.5-3-1.5-5q0-2 2.5-4"
                      />
                    </svg>
                    HOT
                  </span>
                </div>
                <div class="item-chips">
                  <span class="mj-chip mj-chip--gray">{{ batchLabel(m) }}</span>
                  <span class="mj-chip mj-chip--gray">{{ m.round }}</span>
                  <span class="mj-chip" :class="resultClass(m.result)">{{ m.result }}</span>
                  <span class="pos">{{ m.positionName }}</span>
                </div>
              </div>
            </div>
            <p class="item-sum">{{ m.summary }}</p>
            <div class="item-foot">
              <span class="f-ic"
                ><svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                >
                  <circle cx="12" cy="12" r="10" />
                  <path d="M12 6v6h4" /></svg
                >{{ fmtTime(m.publishTime) }}</span
              >
              <span class="f-ic grow"></span>
              <span class="f-ic"
                ><svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                >
                  <path
                    d="M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0"
                  />
                  <circle cx="12" cy="12" r="3" /></svg
                >{{ m.viewCount ?? 0 }}</span
              >
              <span v-if="m.likeCount" class="f-ic"
                ><svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                >
                  <path
                    d="M7 10v12M15 5.88 14 10h5.83a2 2 0 0 1 1.92 2.56l-2.33 8A2 2 0 0 1 17.5 22H4a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2h2.76a2 2 0 0 0 1.79-1.11L12 2a3.13 3.13 0 0 1 3 3.88"
                  /></svg
                >{{ m.likeCount }}</span
              >
              <span v-if="m.commentCount" class="f-ic"
                ><svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                >
                  <path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z" /></svg
                >{{ m.commentCount }}</span
              >
            </div>
          </router-link>
          <el-empty v-if="!loading && !shown.length" description="暂无面经" />
        </div>
        <div v-if="hasMore" ref="sentinel" class="scroll-sentinel">
          <span v-if="loading" class="sentinel-loading">加载中…</span>
        </div>
        <p v-else-if="list.length" class="scroll-end">已加载全部 {{ total }} 篇</p>
      </main>

      <aside class="mj-aside">
        <div class="aside-card">
          <strong class="aside-title">热门面经</strong>
          <ul>
            <li v-for="(m, i) in hotList" :key="m._id">
              <router-link :to="`/mianjing/p/${m._id}`" class="hot-row">
                <span class="rank" :class="{ top: i < 3 }">{{ i + 1 }}</span>
                <span class="t">{{ m.title }}</span>
                <span class="v">
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  >
                    <path
                      d="M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0"
                    />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                  {{ m.viewCount ?? 0 }}
                </span>
              </router-link>
            </li>
          </ul>
        </div>
        <div class="aside-card share-card">
          <strong class="aside-title">分享你的面经</strong>
          <p class="sc-line">记录真实面试问题与流程，帮下一届少走弯路</p>
          <p class="sc-line">同一家公司可按轮次（一面/二面/HR面）拆分多篇</p>
          <p class="sc-line">支持关联你的投递记录，把面试进程串成一条线</p>
          <router-link to="/mianjing/write" class="mj-btn sc-btn">立即投稿</router-link>
        </div>
      </aside>
    </div>
  </div>
</template>

<style lang="scss">
@import './mianjing.scss';
</style>
