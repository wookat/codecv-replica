<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { mianjingList, mianjingMeta, MianjingCompany, MianjingItem } from '@/api/modules/site'
import { localAsset, logoColor } from '@/utils/article'
import { fmtCN } from '@/utils/time'

const route = useRoute()
const slug = computed(() => (route.params.slug ?? route.params.companySlug) as string)
const combo = computed(() => route.params.combo as string | undefined)

const company = ref<MianjingCompany | null>(null)
const list = ref<MianjingItem[]>([])
const all = ref<MianjingItem[]>([])
const loading = ref(false)
const keyword = ref('')
const position = ref('')
const sort = ref<'new' | 'hot'>('new')

const batchLabel = (m: MianjingItem) => {
  const g = m.grade ? `${String(m.grade).slice(2)}届` : ''
  const b =
    {
      qiuzhao: '秋招',
      chunzhao: '春招',
      shuxi: '暑期实习',
      shuqi: '暑期实习',
      'shuqi-shixi': '暑期实习',
      'richang-shixi': '日常实习',
      richang: '日常实习',
      shezhao: '社招'
    }[m.batch as string] ?? m.batch
  return `${g}${b}`
}
const batchKey = (m: MianjingItem) => `${m.batch}-${m.grade}`
const resultClass = (r?: string) =>
  r === '已offer' || r === 'offer'
    ? 'mj-chip--green'
    : r === '已挂' || r === '淘汰'
    ? 'mj-chip--gray'
    : 'mj-chip--amber'

const combos = computed(() => {
  const m = new Map<string, { key: string; label: string; count: number }>()
  for (const it of all.value) {
    const k = batchKey(it)
    const e = m.get(k) ?? { key: k, label: batchLabel(it), count: 0 }
    e.count++
    m.set(k, e)
  }
  return [...m.values()]
})

const positions = computed(() => {
  const m = new Map<string, { slug: string; name: string; count: number }>()
  for (const it of all.value) {
    const k = it.positionSlug || it.positionName
    const e = m.get(k) ?? { slug: k, name: it.positionName, count: 0 }
    e.count++
    m.set(k, e)
  }
  return [...m.values()]
})

const shown = computed(() => {
  let rows = list.value
  if (combo.value) rows = rows.filter(r => batchKey(r) === combo.value)
  if (position.value)
    rows = rows.filter(r => r.positionSlug === position.value || r.positionName === position.value)
  const kw = keyword.value.trim().toLowerCase()
  if (kw)
    rows = rows.filter(r =>
      [r.title, r.summary, r.positionName, r.round].some(v => v?.toLowerCase?.().includes(kw))
    )
  return sort.value === 'hot'
    ? [...rows].sort((a, b) => (b.viewCount ?? 0) - (a.viewCount ?? 0))
    : rows
})

const questionTotal = computed(() =>
  all.value.reduce((s, m) => s + ((m as any).questionCount ?? 0), 0)
)
const hotList = computed(() =>
  [...all.value].sort((a, b) => (b.viewCount ?? 0) - (a.viewCount ?? 0)).slice(0, 5)
)
const isHot = (m: MianjingItem) => (m.viewCount ?? 0) >= 100
const fmtTime = (ts?: number) => (ts ? fmtCN(ts) : '')

async function load() {
  loading.value = true
  try {
    const res = await mianjingList({ current: 1, pageSize: 200, company: slug.value })
    all.value = res?.data ?? []
    list.value = all.value
    // 生产标题形态：字节跳动面经 - 6篇 | CodeCV简历；异步返回时须确认仍在公司页，否则覆盖新路由标题
    if (String(route.name).startsWith('mianjing-company'))
      document.title = `${company.value?.name ?? slug.value}面经 - ${
        all.value.length
      }篇 | CodeCV简历`
  } catch (e) {
    console.error('获取公司面经失败:', e)
  } finally {
    loading.value = false
  }
}

watch(slug, load)
watch([company, all], () => {
  if (all.value.length && String(route.name).startsWith('mianjing-company'))
    document.title = `${company.value?.name ?? slug.value}面经 - ${all.value.length}篇 | CodeCV简历`
})

onMounted(async () => {
  load()
  try {
    const cs = await mianjingMeta('companies')
    company.value = (cs?.data ?? []).find((c: MianjingCompany) => c.slug === slug.value) ?? null
  } catch {
    /* ignore */
  }
})
</script>

<template>
  <div class="mj-page mj-company">
    <nav class="crumb" aria-label="面包屑">
      <router-link to="/mianjing">面经</router-link>
      <svg
        class="sep"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
      >
        <path d="m9 18 6-6-6-6" />
      </svg>
      <span>{{ company?.name ?? slug }}</span>
    </nav>

    <header class="mj-card hero">
      <div class="hero-blob" :style="{ background: logoColor(slug) }"></div>
      <div class="hero-in">
        <span class="mj-logo xl" :style="{ '--mj-logo-bg': logoColor(slug) } as any">
          <img
            v-if="company?.logo"
            :src="localAsset(company.logo)"
            :alt="company.name"
            class="mj-logo-img"
            draggable="false"
          />
          <template v-else>{{ (company?.name ?? slug)[0] }}</template>
        </span>
        <div class="flex-1 min-w-0">
          <h1>{{ company?.name ?? slug }}面经</h1>
          <p class="hs">
            <b>{{ all.length }}</b> 篇面经
            <template v-if="questionTotal"> · {{ questionTotal }} 道面试题</template>
            <template v-if="company?.industry"> · {{ company.industry }}</template>
          </p>
        </div>
        <div class="hero-right">
          <div class="mj-search on-card">
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
            <input v-model="keyword" type="text" placeholder="搜岗位、轮次或关键词" />
          </div>
          <router-link to="/mianjing/write" class="mj-btn sm">
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
      </div>
    </header>

    <section class="mj-card filters">
      <div class="frow">
        <span class="flabel">批次</span>
        <div class="pills">
          <router-link :to="`/mianjing/c/${slug}`" class="mj-pill" :class="{ active: !combo }">
            全部 <span class="n">{{ all.length }} 篇</span>
          </router-link>
          <router-link
            v-for="c in combos"
            :key="c.key"
            :to="`/mianjing/c/${slug}/${c.key}`"
            class="mj-pill"
            :class="{ active: combo === c.key }"
          >
            {{ c.label }} <span class="n">{{ c.count }} 篇</span>
          </router-link>
        </div>
      </div>
      <div class="frow">
        <span class="flabel">岗位</span>
        <div class="pills">
          <button class="mj-pill" :class="{ active: !position }" @click="position = ''">
            全部
          </button>
          <button
            v-for="p in positions"
            :key="p.slug"
            class="mj-pill"
            :class="{ active: position === p.slug }"
            @click="position = position === p.slug ? '' : p.slug"
          >
            {{ p.name }} <span class="n">{{ p.count }} 篇</span>
          </button>
        </div>
      </div>
    </section>

    <div class="mj-main mj-cols">
      <main class="mj-list">
        <div class="list-head">
          <h2>{{ company?.name ?? slug }}最新面经</h2>
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
              <span class="f-ic"
                ><svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                >
                  <path d="M13 5h8" />
                  <path d="M13 12h8" />
                  <path d="M13 19h8" />
                  <path d="m3 17 2 2 4-4" />
                  <path d="m3 7 2 2 4-4" /></svg
                >{{ (m as any).questionCount ?? '—' }} 题</span
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
            </div>
          </router-link>
          <el-empty v-if="!loading && !shown.length" description="暂无面经" />
        </div>
      </main>
      <aside class="mj-rail">
        <div class="mj-card rail-card">
          <h4>{{ company?.name ?? slug }}热门面经</h4>
          <router-link
            v-for="(m, i) in hotList"
            :key="m._id"
            :to="`/mianjing/p/${m._id}`"
            class="hot-row"
          >
            <span class="rk" :class="{ top: i < 3 }">{{ i + 1 }}</span>
            <span class="t">{{ m.title }}</span>
            <span class="v">👁 {{ m.viewCount ?? 0 }}</span>
          </router-link>
        </div>
        <div class="mj-card rail-card share-card">
          <h4>分享你的面经</h4>
          <p>
            记录真实面试问题与流程，帮下一届少走弯路，同一家公司可按轮次（一面/二面/HR面）拆多篇
          </p>
          <p>支持关联你的投递记录，把面试过程串成一条线</p>
          <router-link to="/mianjing/write" class="mj-btn block">立即投稿</router-link>
        </div>
      </aside>
    </div>
  </div>
</template>

<style lang="scss">
@import './mianjing.scss';

.mj-company {
  .crumb {
    display: flex;
    align-items: center;
    gap: 4px;
    font-size: 13px;
    opacity: 0.55;
    margin-bottom: 12px;
    a {
      color: var(--font-color);
      text-decoration: none;
      &:hover {
        color: var(--theme);
      }
    }
    .sep {
      width: 14px;
      height: 14px;
    }
  }
  .hero {
    position: relative;
    overflow: hidden;
    padding: 16px;
  }
  .hero-blob {
    position: absolute;
    top: -96px;
    right: -64px;
    width: 224px;
    height: 224px;
    border-radius: 999px;
    filter: blur(48px);
    opacity: 0.25;
    pointer-events: none;
  }
  .hero-in {
    position: relative;
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 16px 20px;
    h1 {
      font-size: 24px;
      font-weight: 700;
      margin: 0;
    }
    .hs {
      margin-top: 6px;
      font-size: 13px;
      opacity: 0.6;
      b {
        color: var(--theme);
        font-weight: 600;
      }
    }
  }
  .hero-right {
    display: flex;
    align-items: center;
    gap: 12px;
    width: 100%;
    @media (min-width: 640px) {
      width: auto;
    }
    .mj-btn.sm {
      padding: 10px 16px;
      font-size: 13px;
      white-space: nowrap;
    }
  }
  .mj-logo.xl {
    width: 64px;
    height: 64px;
    border-radius: 16px;
    font-size: 30px;
  }
  .mj-pill .n {
    opacity: 0.6;
    font-size: 12px;
  }
  .mj-cols {
    display: flex;
    gap: 20px;
    align-items: flex-start;
    .mj-list {
      flex: 1;
      min-width: 0;
    }
  }
  .mj-rail {
    width: 260px;
    flex-shrink: 0;
    display: flex;
    flex-direction: column;
    gap: 16px;
    @media (max-width: 900px) {
      display: none;
    }
    .rail-card {
      padding: 16px;
      h4 {
        margin: 0 0 12px;
        font-size: 14px;
        font-weight: 700;
        color: var(--theme);
      }
      .hot-row {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 6px 0;
        font-size: 13px;
        color: var(--font-color);
        text-decoration: none;
        .rk {
          width: 16px;
          font-size: 12px;
          color: #999;
          &.top {
            color: var(--theme);
            font-weight: 700;
          }
        }
        .t {
          flex: 1;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .v {
          font-size: 12px;
          color: #bbb;
        }
        &:hover .t {
          color: var(--theme);
        }
      }
      &.share-card p {
        font-size: 13px;
        color: #888;
        line-height: 1.7;
        margin: 0 0 8px;
      }
      .mj-btn.block {
        display: block;
        text-align: center;
        margin-top: 8px;
      }
    }
  }
}
</style>
