<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import { postDetail } from '@/api/modules/site'
import { renderArticle } from '@/utils/article'

const route = useRoute()
const post = ref<any>(null)
const html = ref('')
const loading = ref(true)

const fmt = (ts?: number) => (ts ? new Date(ts).toLocaleString() : '')

onMounted(async () => {
  try {
    const res = await postDetail(route.params.id as string)
    post.value = res?.data ?? null
    if (post.value?.contentMd) html.value = renderArticle(post.value.contentMd)
  } catch (e) {
    console.error('获取文章失败:', e)
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <div class="pd-page">
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
  </div>
</template>

<style lang="scss">
.pd-page {
  max-width: var(--max-width);
  margin: 0 auto;
  padding: 20px;
  color: var(--font-color);
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
  font-size: 15px;
  line-height: 1.9;
  color: var(--writable-font-color);
  word-break: break-word;
  h2,
  h3 {
    font-weight: 700;
    margin: 24px 0 12px;
    color: var(--font-color);
  }
  h2 {
    font-size: 19px;
  }
  h3 {
    font-size: 17px;
  }
  p {
    margin: 10px 0;
  }
  ul,
  ol {
    padding-left: 24px;
    margin: 10px 0;
  }
  li {
    margin: 4px 0;
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
    margin: 12px 0;
    padding: 8px 16px;
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
