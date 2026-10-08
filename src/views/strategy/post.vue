<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import { postDetail } from '@/api/modules/site'
import { renderArticle } from '@/utils/article'
import { fmtCN } from '@/utils/time'
import { templates } from '@/templates/config'

const route = useRoute()
const post = ref<any>(null)
const html = ref('')
const loading = ref(true)

// 与生产一致的右侧推荐模板位（生产实测顺序）
const recommendTypes = ['45', '1internet_avatar', '43', '48', '61', '38']
const recommends = computed(() =>
  recommendTypes
    .map(t => templates.value.find(x => x.type === t))
    .filter((x): x is NonNullable<typeof x> => Boolean(x))
)

const fmt = (ts?: number) => (ts ? fmtCN(ts, true) : '')

onMounted(async () => {
  try {
    const res = await postDetail(route.params.id as string)
    post.value = res?.data ?? null
    if (post.value?.title && route.name === 'post-detail')
      document.title = `${post.value.title} - CodeCV简历`
    if (post.value?.contentMd) {
      html.value = renderArticle(post.value.contentMd)
    }
  } catch (e) {
    console.error('获取文章失败:', e)
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <div class="pd-page">
    <div class="pd-layout">
      <div v-loading="loading" class="pd-card">
        <template v-if="post">
          <h1>{{ post.title }}</h1>
          <div class="meta-row">
            <span>{{ fmt(post.create_time) }}</span>
            <span>{{ post.viewNum }} 浏览</span>
          </div>
          <div class="markdown-body pd-body" v-html="html"></div>
          <div class="tags-row">
            <span class="tag-ic">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              >
                <path
                  d="M12.586 2.586A2 2 0 0 0 11.172 2H4a2 2 0 0 0-2 2v7.172a2 2 0 0 0 .586 1.414l8.704 8.704a2.426 2.426 0 0 0 3.42 0l6.58-6.58a2.426 2.426 0 0 0 0-3.42z"
                />
                <circle cx="7.5" cy="7.5" r=".5" />
              </svg>
              标签：
            </span>
            <span v-for="t in post.tags" :key="t" class="tag">{{ t }}</span>
          </div>
        </template>
        <el-empty v-else-if="!loading" description="文章不存在或已删除" />
      </div>
      <aside class="pd-aside">
        <div class="rec-card">
          <strong class="rec-title">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <path d="M14 2v6h6" />
              <path d="M16 13H8" />
              <path d="M16 17H8" />
              <path d="M10 9H8" />
            </svg>
            推荐简历模板
          </strong>
          <router-link
            v-for="t in recommends"
            :key="t.type"
            :to="`/jianlimoban/${t.type}`"
            class="rec-item"
          >
            <img :src="t.img" :alt="t.name" loading="lazy" />
            <span>{{ t.name }}</span>
          </router-link>
        </div>
      </aside>
    </div>
  </div>
</template>

<style lang="scss">
.pd-page {
  max-width: var(--max-width);
  margin: 0 auto;
  padding: 20px;
  color: var(--font-color);
}
.pd-layout {
  display: flex;
  gap: 20px;
  align-items: flex-start;
}
.pd-card {
  flex: 1;
  min-width: 0;
}
.pd-aside {
  width: 200px;
  flex-shrink: 0;
  display: none;
  @media (min-width: 1024px) {
    display: block;
  }
}
.rec-card {
  background: var(--background);
  border-radius: 12px;
  padding: 24px;
  position: sticky;
  top: 80px;
  .rec-title {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 15px;
    color: var(--theme);
    margin-bottom: 10px;
    svg {
      width: 16px;
      height: 16px;
    }
  }
  .rec-item {
    display: block;
    text-decoration: none;
    margin-bottom: 18px;
    img {
      width: 100%;
      aspect-ratio: 210 / 297;
      object-fit: cover;
      object-position: top;
      border-radius: 8px;
      box-shadow: 0 2px 10px rgba(0, 0, 0, 0.08);
      display: block;
    }
    span {
      display: block;
      text-align: center;
      font-size: 13px;
      color: var(--font-color);
      margin-top: 6px;
    }
    &:hover span {
      color: var(--theme);
    }
  }
}
.pd-card {
  background: var(--background);
  border-radius: 12px;
  padding: 32px;
  min-height: 300px;
  h1 {
    margin: 0 0 20px;
    font-size: 24px;
    font-weight: 700;
    line-height: 1.4;
  }
  .meta-row {
    display: flex;
    gap: 20px;
    flex-wrap: wrap;
    font-size: 14px;
    color: #999;
    margin-bottom: 24px;
  }
  .tags-row {
    margin-top: 28px;
    display: flex;
    align-items: center;
    gap: 8px;
    flex-wrap: wrap;
    font-size: 13px;
    color: #999;
    .tag-ic {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      svg {
        width: 16px;
        height: 16px;
      }
    }
    .tag {
      background: #f4f4f5;
      color: #909399;
      border-radius: 4px;
      padding: 2px 10px;
      font-size: 12px;
    }
  }
}
.pd-body {
  font-size: 16px;
  line-height: 1.875;
  color: var(--writable-font-color);
  word-break: break-word;
  h2,
  h3 {
    font-weight: 700;
    margin: 16px 0;
    color: var(--font-color);
  }
  h2 {
    font-size: 1.25em;
    line-height: 2;
  }
  h3 {
    font-size: 1.17em;
    line-height: 40px;
  }
  p {
    margin: 4px 0 0;
  }
  ul,
  ol {
    padding-left: 24px;
    margin: 0;
  }
  li {
    margin: 2px 0;
  }
  strong {
    color: var(--font-color);
  }
  code {
    background: rgba(0, 0, 0, 0.06);
    border-radius: 4px;
    padding: 1px 6px;
    font-size: 0.9em;
  }
  pre {
    background: #1e1e1e;
    color: #ddd;
    border-radius: 10px;
    padding: 14px 16px;
    overflow-x: auto;
    code {
      background: transparent;
      padding: 0;
    }
  }
  blockquote {
    margin: 0;
    padding: 5px 12px;
    font-size: 14px;
    line-height: 20px;
    border-left: 3px solid var(--theme);
    background: rgba(0, 0, 0, 0.03);
    border-radius: 0 8px 8px 0;
  }
  a {
    color: var(--theme);
  }
  img {
    max-width: 100%;
    border-radius: 8px;
  }
}
</style>
