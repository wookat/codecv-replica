<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { templates } from '@/templates/config'
import { TEMPLATE_CATEGORIES } from '@/common/categories'

const route = useRoute()
const router = useRouter()
const keyword = ref('')
const tag = ref(String(route.query.tags || '全部'))

const GROUPS: { label: string; icon: string; items: { slug: string; name: string }[] }[] = [
  {
    label: '热门',
    icon: '🔥',
    items: TEMPLATE_CATEGORIES.filter(c => c.group === '热门').map(c => ({
      slug: c.slug,
      name: c.name
    }))
  },
  {
    label: '高校',
    icon: '🏫',
    items: TEMPLATE_CATEGORIES.filter(c => c.group === '学校').map(c => ({
      slug: c.slug,
      name: c.name
    }))
  },
  {
    label: '行业',
    icon: '🏢',
    items: TEMPLATE_CATEGORIES.filter(c => c.group === '行业').map(c => ({
      slug: c.slug,
      name: c.name
    }))
  },
  {
    label: '职位',
    icon: '💼',
    items: TEMPLATE_CATEGORIES.filter(c => c.group === '职位').map(c => ({
      slug: c.slug,
      name: c.name
    }))
  },
  {
    label: '专业',
    icon: '📚',
    items: TEMPLATE_CATEGORIES.filter(c => c.group === '专业').map(c => ({
      slug: c.slug,
      name: c.name
    }))
  }
]

const ZONE_BANNERS = [
  { slug: 'yingjiesheng', img: '/static/webp/yingjiesheng-C9R4I_SP.webp', alt: '应届生专区' },
  { slug: 'shixisheng', img: '/static/webp/shixisheng-D7CXwT6m.webp', alt: '实习生专区' },
  { slug: 'yingwen', img: '/static/webp/yingwen-CLsmPG07.webp', alt: '英文专区' },
  { slug: 'chengxuyuan', img: '/static/webp/chengxuyuan-DhiqbosR.webp', alt: '程序员专区' },
  { slug: 'yunying', img: '/static/webp/yunying-Bnm-yJXi.webp', alt: '运营专区' }
]

// 与线上一致的 tag 序列
const TAG_TABS = [
  '全部',
  '校招',
  '社招',
  '实习',
  '行政',
  '金融',
  '幼师',
  '电气',
  '英文',
  '外企',
  '大模型',
  '前端',
  '后端',
  '算法',
  '测试',
  '运营',
  '设计',
  '互联网',
  '简约',
  '暗黑',
  '通用',
  '事业单位',
  '药师',
  '网络安全',
  '半导体',
  '芯片',
  '云计算',
  '数据分析',
  '区块链',
  '会计学'
]

const tplTags = (t: any): string[] => (Array.isArray(t.tags) ? t.tags : [])

const shown = computed(() => {
  let rows = templates.value
  const t = tag.value
  if (t && t !== '全部') {
    rows = rows.filter(
      r => tplTags(r).some(x => x.includes(t) || t.includes(x)) || r.name.includes(t)
    )
  }
  const kw = keyword.value.trim()
  if (kw) rows = rows.filter(r => r.name.includes(kw) || tplTags(r).some(x => x.includes(kw)))
  return [...rows].sort((a, b) => +(b.hot || 0) - +(a.hot || 0))
})

const tplSlug = (t: any) => t.type

watch(tag, t => {
  router.replace({ query: t === '全部' ? {} : { tags: t } })
})
watch(
  () => route.query.tags,
  t => {
    if (t) tag.value = String(t)
  }
)
</script>

<template>
  <div class="jl-page">
    <h1 class="sr-only">简历模板免费下载_个人简历模板在线制作</h1>

    <!-- 分类行（生产同款五组） -->
    <div class="cat-card">
      <div v-for="g in GROUPS" :key="g.label" class="cat-row">
        <div class="cat-label">{{ g.label }}</div>
        <div class="cat-items">
          <router-link v-for="c in g.items" :key="c.slug" :to="`/${c.slug}`" class="cat-link">{{
            c.name
          }}</router-link>
        </div>
      </div>
    </div>

    <!-- 专区横幅 -->
    <div class="zone-row">
      <router-link v-for="z in ZONE_BANNERS" :key="z.slug" :to="`/${z.slug}`" class="zone-card">
        <img :src="z.img" :alt="z.alt" draggable="false" />
      </router-link>
    </div>

    <!-- 模板区 -->
    <div class="tpl-card">
      <div class="tpl-head">
        <ul class="tag-tabs">
          <li v-for="t in TAG_TABS" :key="t">
            <button class="tag-tab" :class="{ checked: tag === t }" @click="tag = t">
              {{ t }}
            </button>
          </li>
        </ul>
        <div class="jl-search">
          <input v-model="keyword" type="text" placeholder="搜索模板" />
          <button class="go" aria-label="搜索">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </button>
        </div>
      </div>

      <div class="resumes">
        <router-link
          v-for="t in shown"
          :key="t.type"
          :to="`/jianlimoban/${tplSlug(t)}`"
          class="resume-card"
        >
          <div class="rc-top">
            <p class="use">{{ t.hot ?? 0 }}人使用过</p>
          </div>
          <div class="rc-img">
            <div class="mask"><button class="use-btn">使用模板</button></div>
            <img
              :src="t.img"
              :alt="`CodeCV简历在线简历制作工具 - ${t.name}简历模板`"
              loading="lazy"
            />
          </div>
          <div class="rc-bottom">
            <span class="rc-name">{{ t.name }}</span>
          </div>
        </router-link>
        <el-empty v-if="!shown.length" description="暂无匹配模板" />
      </div>
    </div>
  </div>
</template>

<style lang="scss">
.jl-page {
  max-width: var(--max-width);
  margin: 0 auto;
  padding: 16px;
  color: var(--font-color);
  font-family: var(--font-noto-sans-sc);
}
.cat-card {
  background: var(--background);
  border-radius: 8px;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 14px;
}
.cat-row {
  display: flex;
  align-items: flex-start;
  gap: 16px;
  border-bottom: 1px solid #f3f4f6;
  padding-bottom: 12px;
  &:last-child {
    border-bottom: none;
    padding-bottom: 0;
  }
}
.cat-label {
  flex-shrink: 0;
  font-weight: 600;
  font-size: 14px;
  padding-top: 2px;
}
.cat-items {
  flex: 1;
  display: flex;
  flex-wrap: wrap;
  gap: 8px 24px;
  align-items: center;
  max-height: 84px;
  overflow: hidden;
}
.cat-link {
  font-size: 14px;
  color: var(--font-color);
  text-decoration: none;
  transition: color 0.2s;
  white-space: nowrap;
  &:hover {
    color: var(--theme);
  }
}
.zone-row {
  margin-top: 16px;
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 12px;
  @media (max-width: 768px) {
    grid-template-columns: repeat(2, 1fr);
  }
}
.zone-card {
  display: block;
  transition: transform 0.4s;
  img {
    width: 100%;
    border-radius: 12px;
    box-shadow: 0 1px 4px rgba(0, 0, 0, 0.08);
  }
  &:hover {
    transform: scale(1.05);
  }
}
.tpl-card {
  margin-top: 16px;
  background: var(--background);
  border-radius: 12px;
  padding: 12px;
}
.tpl-head {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 8px;
  @media (min-width: 768px) {
    flex-direction: row;
    align-items: flex-start;
  }
}
.tag-tabs {
  flex: 1;
  display: flex;
  flex-wrap: wrap;
  gap: 8px 24px;
  list-style: none;
  padding: 0;
  margin: 0;
}
.tag-tab {
  border: none;
  background: none;
  padding: 0 0 8px;
  font-size: 15px;
  color: var(--font-color);
  cursor: pointer;
  position: relative;
  white-space: nowrap;
  &.checked {
    color: var(--theme);
    font-weight: 600;
    &::after {
      content: '';
      position: absolute;
      bottom: 0;
      left: 0;
      right: 0;
      height: 2px;
      border-radius: 2px;
      background: var(--theme);
    }
  }
}
.jl-search {
  position: relative;
  flex-shrink: 0;
  width: 100%;
  @media (min-width: 768px) {
    width: 220px;
  }
  input {
    width: 100%;
    height: 38px;
    border-radius: 999px;
    border: none;
    background: var(--body-background);
    padding: 0 44px 0 16px;
    font-size: 13px;
    color: var(--font-color);
    outline: none;
  }
  .go {
    position: absolute;
    right: 6px;
    top: 50%;
    transform: translateY(-50%);
    width: 32px;
    height: 32px;
    border: none;
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: linear-gradient(90deg, #ff6cab, #ff9a44, #ffd057);
    color: #fff;
    cursor: pointer;
    svg {
      width: 16px;
      height: 16px;
    }
  }
}
.resumes {
  display: grid;
  gap: 8px;
  grid-template-columns: repeat(2, 1fr);
  @media (min-width: 768px) {
    grid-template-columns: repeat(3, 1fr);
  }
  @media (min-width: 1024px) {
    grid-template-columns: repeat(4, 1fr);
  }
  @media (min-width: 1280px) {
    grid-template-columns: repeat(5, 1fr);
  }
}
.resume-card {
  margin: 8px;
  text-decoration: none;
  color: var(--font-color);
  position: relative;
  transition: transform 0.3s;
  &:hover {
    transform: translateY(-3px);
  }
  .rc-top {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 8px;
    .use {
      color: #9ca3af;
      padding-left: 4px;
      font-size: 12px;
      margin: 0;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
  }
  .rc-img {
    position: relative;
    border-radius: 6px;
    overflow: hidden;
    img {
      width: 100%;
      border-radius: 6px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.12);
      display: block;
    }
    .mask {
      position: absolute;
      inset: 0;
      border-radius: 6px;
      background: rgba(0, 0, 0, 0);
      display: flex;
      align-items: center;
      justify-content: center;
      opacity: 0;
      transition: all 0.25s;
    }
    .use-btn {
      border: none;
      background: var(--theme);
      color: #fff;
      font-size: 14px;
      border-radius: 6px;
      padding: 8px 14px;
      cursor: pointer;
      white-space: nowrap;
    }
    &:hover .mask {
      opacity: 1;
      background: rgba(0, 0, 0, 0.35);
    }
  }
  .rc-bottom {
    padding: 8px 4px 0;
    .rc-name {
      font-size: 13px;
      color: var(--font-color);
      display: block;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
  }
}
</style>
