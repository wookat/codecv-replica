<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { postPage, PostItem } from '@/api/modules/site'
import { localAsset } from '@/utils/article'
import AsideRail from '@/components/AsideRail.vue'

const list = ref<PostItem[]>([])
const total = ref(0)
const current = ref(1)
const pageSize = 12
const keyword = ref('')
const loading = ref(false)

const shown = computed(() => {
  const kw = keyword.value.trim().toLowerCase()
  if (!kw) return list.value
  return list.value.filter(
    p => p.title.toLowerCase().includes(kw) || p.description.toLowerCase().includes(kw)
  )
})

const rel = (ts?: number) => {
  if (!ts) return ''
  const d = Date.now() - ts
  const day = 86400000
  if (d < day) return '今天'
  if (d < 30 * day) return `${Math.floor(d / day)} 天前`
  if (d < 365 * day) return `${Math.floor(d / (30 * day))} 个月前`
  return `${Math.floor(d / (365 * day))} 年前`
}

async function load() {
  loading.value = true
  try {
    const res = await postPage({ current: current.value, pageSize })
    list.value = res?.data ?? []
    total.value = res?.total ?? 0
  } catch (e) {
    console.error('获取攻略失败:', e)
  } finally {
    loading.value = false
  }
}

onMounted(load)
</script>

<template>
  <div class="st-page">
    <h1 class="sr-only">求职攻略_面试技巧_简历优化建议_求职经验分享_程序员求职指南</h1>
    <div class="st-cols">
      <div class="st-main">
        <div class="st-card list-card">
          <div class="hd">
            <h2>求职攻略</h2>
            <input v-model="keyword" class="kw" type="text" placeholder="使用关键词搜索" />
          </div>
          <div v-loading="loading" class="items">
            <router-link v-for="p in shown" :key="p._id" :to="`/post/${p._id}`" class="post-card">
              <img
                :src="localAsset(p.cover)"
                :alt="`${p.title} - 文章封面图`"
                class="cover"
                loading="lazy"
              />
              <div class="pc-body">
                <h3>{{ p.title }}</h3>
                <p class="desc">{{ p.description }}</p>
                <div class="pc-foot">
                  <div class="tags">
                    <span v-for="t in (p.tags ?? []).slice(0, 3)" :key="t" class="tag">{{
                      t
                    }}</span>
                  </div>
                  <span class="meta">{{ p.viewNum }} 浏览</span>
                  <span class="meta tm">{{ rel(p.create_time) }}</span>
                </div>
              </div>
            </router-link>
            <el-empty v-if="!loading && !shown.length" description="暂无文章" />
          </div>
          <div v-if="total > pageSize" class="pager">
            <el-pagination
              v-model:current-page="current"
              :page-size="pageSize"
              :total="total"
              background
              layout="prev, pager, next"
              @current-change="load"
            />
          </div>
        </div>
      </div>
      <AsideRail :jobs-first="false">
        <div class="mp-card">
          <p class="mp-title">小程序功能上新</p>
          <img src="/prod-assets/miniprogram-feature.webp" alt="小程序功能上新" />
          <p class="mp-cap">🌟 小程序也能导出简历啦！</p>
        </div>
      </AsideRail>
    </div>
  </div>
</template>

<style lang="scss">
.st-page {
  max-width: var(--max-width);
  margin: 0 auto;
  padding: 20px;
  color: var(--font-color);
  font-family: var(--font-noto-sans-sc);
}
.st-cols {
  display: flex;
  gap: 20px;
  align-items: flex-start;
}
.st-main {
  flex: 1;
  min-width: 0;
}
.st-card {
  background: var(--background);
  border-radius: 12px;
  padding: 20px;
}
.mp-card {
  background: var(--background);
  border-radius: 12px;
  padding: 14px;
  .mp-title {
    font-size: 14px;
    font-weight: 700;
    color: var(--theme);
    margin: 0;
  }
  img {
    width: 100%;
    display: block;
    border-radius: 8px;
    margin-top: 8px;
  }
  .mp-cap {
    margin: 8px 0 0;
    font-size: 12px;
    color: var(--font-color);
  }
}
.hd {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  h2 {
    font-size: 18px;
    font-weight: 600;
    margin: 0;
  }
  .kw {
    width: 150px;
    height: 32px;
    padding: 0 12px;
    border-radius: 8px;
    border: 1px solid rgba(0, 0, 0, 0.08);
    background: var(--background);
    font-size: 13px;
    outline: none;
    &:focus {
      border-color: var(--theme);
    }
  }
}
.items {
  display: flex;
  flex-direction: column;
  gap: 16px;
  min-height: 200px;
}
.post-card {
  display: flex;
  gap: 16px;
  text-decoration: none;
  color: var(--font-color);
  &:hover {
    opacity: 0.8;
  }
  .cover {
    width: 160px;
    height: 100px;
    object-fit: cover;
    border-radius: 8px;
    flex-shrink: 0;
    @media (max-width: 768px) {
      width: 64px;
      height: 64px;
    }
  }
  .pc-body {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 4px;
  }
  h3 {
    margin: 0;
    font-size: 15px;
    font-weight: 500;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    @media (min-width: 768px) {
      font-size: 16px;
    }
  }
  .desc {
    flex: 1;
    font-size: 13px;
    color: #999;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
    line-height: 1.6;
    margin: 0;
  }
  .pc-foot {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 12px;
    color: #999;
    .tags {
      flex: 1;
      display: flex;
      gap: 6px;
      flex-wrap: wrap;
      .tag {
        background: #fef0f0;
        color: #f56c6c;
        border-radius: 4px;
        padding: 1px 8px;
        font-size: 12px;
      }
    }
    .tm {
      display: none;
      @media (min-width: 768px) {
        display: block;
      }
    }
  }
}
.pager {
  margin-top: 20px;
  display: flex;
  justify-content: center;
}
</style>
