<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import { mianjingList, mianjingMeta, MianjingItem } from '@/api/modules/site'
import { logoColor, localAsset } from '@/utils/article'
import { fmtCNDate } from '@/utils/time'

const route = useRoute()
const slug = computed(() => route.params.slug as string)
const topic = ref<any>(null)
const list = ref<MianjingItem[]>([])
const loading = ref(false)

const batchLabel = (m: MianjingItem) => {
  const g = m.grade ? `${String(m.grade).slice(2)}届` : ''
  const b =
    { qiuzhao: '秋招', chunzhao: '春招', shuqi: '暑期实习', richang: '日常实习', shezhao: '社招' }[
      m.batch as string
    ] ?? m.batch
  return `${g}${b}`
}
const fmtTime = (ts?: number) => (ts ? fmtCNDate(ts) : '')

onMounted(async () => {
  loading.value = true
  try {
    const [ts, res] = await Promise.all([
      mianjingMeta('topics'),
      mianjingList({ page: 1, pageSize: 200 })
    ])
    const topics = ts?.data ?? []
    topic.value = topics.find((t: any) => t.slug === slug.value) ?? {
      slug: slug.value,
      name: slug.value
    }
    list.value = (res?.data ?? []).filter(m => m.topicSlug === slug.value)
    if (route.name === 'mianjing-topic')
      document.title = `${topic.value?.name ?? slug.value} - CodeCV简历`
  } catch (e) {
    console.error(e)
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <div class="mj-page mj-topic">
    <nav class="crumb">
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
      <span>{{ topic?.name ?? slug }}</span>
    </nav>

    <header class="mj-card hero">
      <h1># {{ topic?.name ?? slug }}</h1>
      <p class="hd">{{ topic?.description ?? '' }}</p>
      <p class="hs">
        <b>{{ list.length }}</b> 篇面经
      </p>
    </header>

    <div v-loading="loading" class="items">
      <router-link v-for="m in list" :key="m._id" :to="`/mianjing/p/${m._id}`" class="mj-item">
        <div class="item-top">
          <span
            class="mj-logo lg"
            :style="{ '--mj-logo-bg': logoColor(m.companySlug || '') } as any"
          >
            <img
              v-if="m.companyLogo"
              :src="localAsset(m.companyLogo)"
              class="mj-logo-img"
              :alt="m.companyName"
            />
            <template v-else>{{ (m.companyName || '?')[0] }}</template>
          </span>
          <div class="item-head">
            <div class="item-title-row">
              <h3>{{ m.title }}</h3>
            </div>
            <div class="item-chips">
              <span class="mj-chip mj-chip--gray">{{ batchLabel(m) }}</span>
              <span class="mj-chip mj-chip--gray">{{ m.round }}</span>
              <span class="mj-chip mj-chip--amber">{{ m.result }}</span>
              <span class="pos">{{ m.positionName }}</span>
            </div>
          </div>
        </div>
        <p class="item-sum">{{ m.summary }}</p>
        <div class="item-foot">
          <span class="f-ic">{{ fmtTime(m.publishTime) }}</span>
          <span class="f-ic grow"></span>
          <span class="f-ic">{{ m.viewCount ?? 0 }} 浏览</span>
        </div>
      </router-link>
      <el-empty v-if="!loading && !list.length" description="该话题下暂无面经" />
    </div>
  </div>
</template>

<style lang="scss">
@import './mianjing.scss';

.mj-topic {
  .crumb {
    display: flex;
    align-items: center;
    gap: 4px;
    font-size: 13px;
    opacity: 0.55;
    margin-bottom: 16px;
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
    padding: 24px;
    margin-bottom: 16px;
    h1 {
      margin: 0;
      font-size: 22px;
      font-weight: 700;
      color: var(--theme);
    }
    .hd {
      margin-top: 8px;
      font-size: 13px;
      opacity: 0.6;
      line-height: 1.7;
    }
    .hs {
      margin-top: 10px;
      font-size: 13px;
      opacity: 0.55;
      b {
        color: var(--theme);
      }
    }
  }
}
</style>
