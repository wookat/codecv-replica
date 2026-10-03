<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import { mianjingDetail, mianjingMeta, MianjingCompany, MianjingItem } from '@/api/modules/site'
import { extractToc, localAsset, logoColor, renderArticle, TocItem } from '@/utils/article'

const route = useRoute()
const doc = ref<MianjingItem | null>(null)
const company = ref<MianjingCompany | null>(null)
const toc = ref<TocItem[]>([])
const html = ref('')
const loading = ref(true)
const progress = ref(0)
const liked = ref(false)
const fav = ref(false)

const batchLabel = computed(() => {
  const m = doc.value
  if (!m) return ''
  const g = m.grade ? `${String(m.grade).slice(2)}届` : ''
  const b =
    { qiuzhao: '秋招', chunzhao: '春招', shuqi: '暑期实习', richang: '日常实习', shezhao: '社招' }[
      m.batch as string
    ] ?? m.batch
  return `${g}${b}`
})

const readMins = computed(() => Math.max(1, Math.round((doc.value?.contentMd?.length ?? 0) / 500)))

function onScroll() {
  const el = document.documentElement
  const h = el.scrollHeight - el.clientHeight
  progress.value = h > 0 ? Math.min(1, el.scrollTop / h) : 0
}

function scrollTo(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })
}

function copyLink() {
  navigator.clipboard?.writeText(location.href).then(() => ElMessage.success('链接已复制'))
}

onMounted(async () => {
  window.addEventListener('scroll', onScroll, { passive: true })
  const id = route.params.docId as string
  try {
    const res = await mianjingDetail(id)
    doc.value = res?.data ?? null
    if (doc.value?.contentMd) {
      html.value = renderArticle(doc.value.contentMd as string)
      toc.value = extractToc(doc.value.contentMd as string)
    }
    const companySlug = doc.value?.companySlug
    if (companySlug) {
      const cs = await mianjingMeta('companies')
      company.value = (cs?.data ?? []).find((c: MianjingCompany) => c.slug === companySlug) ?? null
    }
  } catch (e) {
    console.error('获取面经详情失败:', e)
  } finally {
    loading.value = false
  }
})

onUnmounted(() => window.removeEventListener('scroll', onScroll))
</script>

<template>
  <div class="mj-page mj-detail">
    <div class="read-progress" :style="{ transform: `scaleX(${progress})` }"></div>

    <div class="dock">
      <button class="dock-btn" :class="{ on: liked }" aria-label="点赞" @click="liked = !liked">
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <path
            d="M15 5.88 14 10h5.83a2 2 0 0 1 1.92 2.56l-2.33 8A2 2 0 0 1 17.5 22H4a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2h2.76a2 2 0 0 0 1.79-1.11L12 2a3.13 3.13 0 0 1 3 3.88Z"
          />
          <path d="M7 10v12" />
        </svg>
      </button>
      <button class="dock-btn" aria-label="收藏" :class="{ on: fav }" @click="fav = !fav">
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <path
            d="M11.525 2.295a.53.53 0 0 1 .95 0l2.31 4.679a2.123 2.123 0 0 0 1.595 1.16l5.166.756a.53.53 0 0 1 .294.904l-3.736 3.638a2.123 2.123 0 0 0-.611 1.878l.882 5.14a.53.53 0 0 1-.771.56l-4.618-2.428a2.122 2.122 0 0 0-1.973 0L6.396 21.01a.53.53 0 0 1-.77-.56l.881-5.139a2.122 2.122 0 0 0-.611-1.879L2.16 9.795a.53.53 0 0 1 .294-.906l5.165-.755a2.122 2.122 0 0 0 1.597-1.16z"
          />
        </svg>
      </button>
      <button class="dock-btn" aria-label="复制链接分享" @click="copyLink">
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <circle cx="18" cy="5" r="3" />
          <circle cx="6" cy="12" r="3" />
          <circle cx="18" cy="19" r="3" />
          <line x1="8.59" x2="15.42" y1="13.51" y2="17.49" />
          <line x1="15.41" x2="8.59" y1="6.51" y2="10.49" />
        </svg>
      </button>
    </div>

    <div v-loading="loading">
      <template v-if="doc">
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
          <router-link :to="`/mianjing/c/${doc.companySlug}`">{{ doc.companyName }}</router-link>
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
          <span>{{ batchLabel }}</span>
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
          <span>{{ doc.positionName }}</span>
        </nav>

        <div class="mj-main">
          <article class="flex-1 min-w-0">
            <div class="d-card">
              <div class="author-card">
                <img :src="doc.author?.avatar || '/static/png/avatar.png'" alt="" loading="lazy" />
                <div class="flex-1 min-w-0">
                  <p class="an">{{ doc.author?.nickName || '匿名投稿' }}</p>
                  <p class="am">
                    发布于
                    {{ doc.publishTime ? new Date(doc.publishTime).toLocaleDateString() : '' }}
                    <template v-if="doc.author?.school"> · {{ doc.author.school }}</template>
                    <template v-if="doc.author?.major"> · {{ doc.author.major }}</template>
                  </p>
                </div>
              </div>

              <h1 class="d-title">{{ doc.title }}</h1>

              <div class="meta-strip">
                <span class="mj-chip mj-chip--amber">{{ doc.result }}</span>
                <span
                  ><span class="mlabel">批次</span
                  ><router-link
                    class="mlink"
                    :to="`/mianjing/c/${doc.companySlug}/${doc.batch}-${doc.grade}`"
                    >{{ batchLabel }}</router-link
                  ></span
                >
                <span
                  ><span class="mlabel">岗位</span
                  ><router-link class="mlink" :to="`/mianjing?position=${doc.positionSlug}`">{{
                    doc.positionName
                  }}</router-link></span
                >
                <span
                  ><span class="mlabel">轮次</span><span class="mlink">{{ doc.round }}</span></span
                >
                <span class="tail"
                  >{{ doc.questionCount ?? '—' }} 道真题 · 约 {{ readMins }} 分钟读完</span
                >
              </div>

              <details v-if="toc.length" class="mtoc">
                <summary>
                  <svg
                    class="ic"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  >
                    <path d="M8 5h13" />
                    <path d="M13 12h8" />
                    <path d="M13 19h8" />
                    <path d="M3 10a2 2 0 0 0 2 2h3" />
                    <path d="M3 5v12a2 2 0 0 0 2 2h3" />
                  </svg>
                  <span>本篇目录（{{ toc.length }} 节）</span>
                </summary>
                <div class="mtoc-list">
                  <button
                    v-for="t in toc"
                    :key="t.id"
                    class="toc-item"
                    :class="{ h3: t.level === 3 }"
                    @click="scrollTo(t.id)"
                  >
                    {{ t.text }}
                  </button>
                </div>
              </details>

              <div class="mj-article" v-html="html"></div>
            </div>
          </article>

          <aside class="mj-aside">
            <div v-if="toc.length" class="aside-card toc-card">
              <strong class="aside-title">本篇目录</strong>
              <a
                v-for="t in toc"
                :key="t.id"
                class="toc-item"
                :class="{ h3: t.level === 3 }"
                @click="scrollTo(t.id)"
                >{{ t.text }}</a
              >
            </div>
            <div v-if="doc.related?.length" class="aside-card">
              <strong class="aside-title">相关面经</strong>
              <router-link
                v-for="r in doc.related"
                :key="r._id"
                :to="`/mianjing/p/${r._id}`"
                class="hot-row"
              >
                <span class="t">{{ r.title }}</span>
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
                  {{ r.viewCount ?? 0 }}
                </span>
              </router-link>
            </div>
            <div v-if="company" class="aside-card">
              <router-link :to="`/mianjing/c/${company.slug}`" class="comp-card">
                <span
                  class="mj-logo lg"
                  :style="{ '--mj-logo-bg': logoColor(company.slug) } as any"
                >
                  <img
                    v-if="company.logo"
                    :src="localAsset(company.logo)"
                    :alt="company.name"
                    class="mj-logo-img"
                  />
                  <template v-else>{{ company.name[0] }}</template>
                </span>
                <span>
                  <b>{{ company.name }}面经</b>
                  <p class="cc-sub">{{ company.industry }}</p>
                </span>
              </router-link>
            </div>
          </aside>
        </div>
      </template>
      <el-empty v-else-if="!loading" description="面经不存在或已删除" />
    </div>
  </div>
</template>

<style lang="scss">
@import './mianjing.scss';

.mtoc {
  margin-top: 20px;
  border-radius: 12px;
  background: rgba(0, 0, 0, 0.04);
  summary {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 12px 16px;
    font-size: 13px;
    cursor: pointer;
    list-style: none;
    &::-webkit-details-marker {
      display: none;
    }
    .ic {
      width: 16px;
      height: 16px;
    }
  }
  .mtoc-list {
    padding: 0 12px 12px;
    .toc-item {
      display: block;
      width: 100%;
      text-align: left;
      border: none;
      background: transparent;
      padding: 5px 10px 5px 28px;
      font-size: 13px;
      color: var(--font-color);
      opacity: 0.65;
      cursor: pointer;
      border-radius: 8px;
      &.h3 {
        padding-left: 44px;
      }
      &:hover {
        color: var(--theme);
        opacity: 1;
      }
    }
  }
  @media (min-width: 1024px) {
    display: none;
  }
}
.comp-card {
  display: flex;
  align-items: center;
  gap: 12px;
  text-decoration: none;
  color: var(--font-color);
  .cc-sub {
    font-size: 12px;
    opacity: 0.5;
    margin-top: 2px;
  }
}
</style>
