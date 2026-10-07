<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { templates } from '@/templates/config'
import { TEMPLATE_CATEGORIES } from '@/common/categories'

const route = useRoute()
const router = useRouter()
const keyword = ref('')
const tag = ref(String(route.query.tags || '全部'))

// 生产「热门」行顺序固定为这 5 个（index.json 里热门组有 8 个，页面只展示一行）
const HOT_ORDER = ['daxuesheng', 'shixisheng', 'yingjiesheng', 'qiuzhi', 'liuxue']
const GROUPS: { label: string; icon: string; items: { slug: string; name: string }[] }[] = [
  {
    label: '热门',
    icon: '🔥',
    items: HOT_ORDER.map(s => {
      const c = TEMPLATE_CATEGORIES.find(x => x.slug === s)
      return { slug: s, name: c?.name ?? s }
    })
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
  'Java',
  'Go',
  '大模型',
  'Ai',
  'Agent开发',
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
  '区块链',
  '会计学',
  '软件工程',
  '翻译',
  '市场营销'
]

const tplTags = (t: any): string[] => (Array.isArray(t.tags) ? t.tags : [])

const sort = ref<'综合排序' | '最新上传' | '最多下载'>('综合排序')
const SORTS = ['综合排序', '最新上传', '最多下载'] as const

// 后台下架的模板（admin/template/delete 生效后前台隐藏）
const hiddenTypes = ref<Set<string>>(new Set())
onMounted(() => {
  fetch('/api/template/hidden')
    .then(r => r.json())
    .then(res => {
      if (res?.code === 200) hiddenTypes.value = new Set(res.data)
    })
    .catch(() => undefined)
})

const filtered = computed(() => {
  let rows = templates.value.filter(t => !hiddenTypes.value.has(t.type))
  const t = tag.value
  if (t && t !== '全部') {
    rows = rows.filter(
      r => tplTags(r).some(x => x.includes(t) || t.includes(x)) || r.name.includes(t)
    )
  }
  const kw = keyword.value.trim()
  if (kw) rows = rows.filter(r => r.name.includes(kw) || tplTags(r).some(x => x.includes(kw)))
  const sorted = [...rows]
  // 综合排序=生产数组序（index.json 顺序，与线上一致）；最新上架=配置插入序；最多下载=hot 降序
  if (sort.value === '最多下载') sorted.sort((a, b) => +(b.hot || 0) - +(a.hot || 0))
  return sorted
})

// 生产模板中心分页：每页 25（chunk pageSize 默认 25，?size= 可覆盖）
const PAGE_SIZE = 25
const pageNum = ref(Number(route.query.page) || 1)
const shown = computed(() =>
  filtered.value.slice((pageNum.value - 1) * PAGE_SIZE, pageNum.value * PAGE_SIZE)
)
watch([tag, sort, keyword], () => {
  pageNum.value = 1
})
watch(pageNum, p => {
  router.replace({ query: { ...route.query, page: p > 1 ? p : undefined } })
})

// 生产 NEW 角标 = 实测挂牌的 4 套（逐卡爬取验证，非日期推算）
const newTypes = new Set([
  'yinhangguanpeisheng',
  'duomotaidamoxingsuanfa',
  'shuziic',
  'youxikaifagongchengshi'
])
const isNew = (t: any) => newTypes.has(t.type)

const tplSlug = (t: any) => t.type

// 生产分类行默认单行收起，点右侧 › 展开
const openGroups = ref<Record<string, boolean>>({})

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
    <!-- 顶部：左分类行 + 右侧双推广位（生产布局） -->
    <div class="jl-top">
      <div class="cat-card">
        <div v-for="g in GROUPS" :key="g.label" class="cat-row">
          <div class="cat-label">{{ g.label }}</div>
          <div class="cat-items" :class="{ open: openGroups[g.label] }">
            <router-link v-for="c in g.items" :key="c.slug" :to="`/${c.slug}`" class="cat-link">{{
              c.name
            }}</router-link>
          </div>
          <button
            class="cat-more"
            type="button"
            aria-label="展开"
            @click="openGroups[g.label] = !openGroups[g.label]"
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              :class="{ flip: openGroups[g.label] }"
            >
              <path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>
      <div class="promo-col">
        <router-link to="/jobs" class="promo banner-jobs">
          <img
            src="/codecv-assets/recruitment.webp"
            alt="简历模板页面校招信息汇总"
            draggable="false"
          />
        </router-link>
        <a
          href="https://assist.codecvcv.com?utm_source=codecv"
          target="_blank"
          rel="noopener noreferrer"
          class="promo banner-mj"
        >
          <img
            src="/advertise_cover/avatar_1790992869080.webp"
            alt="AI 网申助手"
            draggable="false"
          />
        </a>
      </div>
    </div>

    <!-- 生产 DOM：专区横幅行为页直子，在筛选卡之外 -->
    <div class="zone-row">
      <router-link v-for="z in ZONE_BANNERS" :key="z.slug" :to="`/${z.slug}`" class="zone-card">
        <img :src="z.img" :alt="z.alt" draggable="false" />
      </router-link>
    </div>
    <!-- 生产 DOM：h1.sr-only 在筛选卡之前的 .w-full 内（y≈449） -->
    <h1 class="sr-only">简历模板免费下载_个人简历模板在线制作</h1>
    <!-- 模板区（生产筛选卡 p-2：标签/排序/网格） -->
    <div class="tpl-card">
      <div class="tpl-head">
        <ul class="tag-tabs">
          <li v-for="t in TAG_TABS" :key="t">
            <button class="tag-tab" :class="{ checked: tag === t }" @click="tag = t">
              {{ t }}
            </button>
          </li>
        </ul>
      </div>
      <div class="sort-row">
        <div class="sort-tabs">
          <span
            v-for="s in SORTS"
            :key="s"
            class="sort-tab"
            :class="{ checked: sort === s }"
            @click="sort = s"
            >{{ s }}</span
          >
        </div>
        <div class="jl-search">
          <input v-model="keyword" type="text" placeholder="根据关键词搜索简历模板" />
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
            <span v-if="(t.hot ?? 0) >= 1000" class="hot-badge">
              <svg viewBox="0 0 1024 1024" fill="currentColor">
                <path
                  d="M326.3 981.3C261.2 850.5 295.5 775.3 346.9 706.6c54.8-78.5 68.5-153.7 68.5-153.7s44.5 52.4 27.4 137.4c75.4-81.8 89.1-212.6 78.8-261.7 171.3 114.5 246.7 366.3 147.4 549.5 527.7-287.8 130.2-716.2 61.7-762 24 49 27.4 130.8-20.6 170C631.3 98.3 436 42.7 436 42.7c24 147.2-82.2 307.4-185 428.4-3.4-58.9-6.8-98.1-41.1-157-6.8 108-92.5 193-116.5 300.9-30.8 147.2 24 251.8 232.9 366.3z"
                />
              </svg>
              热门模板
            </span>
          </div>
          <div class="rc-img">
            <div class="mask"><button class="use-btn">使用模板</button></div>
            <img
              :src="t.img"
              :alt="`CodeCV简历在线简历制作工具 - ${t.name}简历模板`"
              loading="lazy"
            />
            <sup v-if="isNew(t)" class="new-badge">new</sup>
          </div>
          <div v-if="tplTags(t).length" class="rc-tags">
            <span v-for="x in tplTags(t).slice(0, 4)" :key="x" class="rc-tag">{{ x }}</span>
          </div>
          <div class="rc-bottom">
            <span class="rc-name">{{ t.name }}简历</span>
          </div>
        </router-link>
        <el-empty v-if="!shown.length" description="暂无匹配模板" />
      </div>
      <el-pagination
        v-if="filtered.length > PAGE_SIZE"
        v-model:current-page="pageNum"
        class="jl-pager"
        background
        layout="prev, pager, next"
        :total="filtered.length"
        :page-size="PAGE_SIZE"
        :pager-count="7"
      />
    </div>
  </div>
</template>

<style lang="scss">
.jl-page {
  /* 生产 max-w-screen-xl(1280) + p-1：内容 x84 w1272 */
  max-width: 1280px;
  margin: 0 auto;
  padding: 20px 4px 16px;
  color: var(--font-color);
  font-family: var(--font-noto-sans-sc);
}
.jl-top {
  display: flex;
  gap: 16px;
  align-items: stretch;
}
.cat-card {
  flex: 1;
  min-width: 0;
  background: var(--background);
  border-radius: 8px;
  padding: 8px 16px;
  display: flex;
  flex-direction: column;
  gap: 0;
}
.promo-col {
  display: flex;
  gap: 16px;
  flex-shrink: 0;
}
.promo {
  display: block;
  border-radius: 12px;
  overflow: hidden;
  text-decoration: none;
  transition: transform 0.3s;
  &:hover {
    transform: scale(1.03);
  }
}
.banner-jobs img {
  display: block;
  width: 280px;
  height: 210px;
  object-fit: cover;
}
.banner-mj {
  width: 210px;
  img {
    display: block;
    width: 100%;
    height: 210px;
    object-fit: cover;
  }
}
@media (max-width: 1024px) {
  .jl-top {
    flex-direction: column;
  }
  .promo-col {
    display: none;
  }
}
.sort-row {
  margin-top: 16px;
  padding: 0 8px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  @media (max-width: 767px) {
    flex-direction: column;
    align-items: stretch;
  }
  .sort-tabs {
    display: flex;
    gap: 18px;
  }
  .sort-tab {
    font-size: 14px;
    color: #9ca3af;
    cursor: pointer;
    padding: 4px;
    border-radius: 6px;
    transition: all 0.2s;
    white-space: nowrap;
    &.checked {
      color: var(--theme);
      font-weight: 700;
    }
    &:hover {
      color: var(--theme);
    }
  }
}
.cat-row {
  display: flex;
  align-items: center;
  gap: 16px;
  height: 40px;
  border-bottom: 1px solid #f3f4f6;
  &:last-child {
    border-bottom: none;
  }
}
.cat-label {
  flex-shrink: 0;
  font-weight: 600;
  font-size: 14px;
  /* 生产标签列到链接列距 72px（实测链接 x156） */
  margin-right: 12px;
}
.cat-items {
  flex: 1;
  display: flex;
  flex-wrap: wrap;
  gap: 8px 24px;
  align-items: center;
  max-height: 24px;
  overflow: hidden;
  &.open {
    max-height: none;
  }
}
.cat-more {
  flex-shrink: 0;
  border: none;
  background: none;
  padding: 0;
  margin: -2px -8px 0 0;
  color: #9ca3af;
  cursor: pointer;
  display: flex;
  align-items: center;
  &:hover {
    color: var(--theme);
  }
  svg {
    width: 16px;
    height: 16px;
    &.flip {
      transform: rotate(90deg);
    }
  }
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
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  /* 生产 5×242 卡、间距 ~15px */
  gap: 15px;
  margin: 16px 0;
  @media (max-width: 768px) {
    grid-template-columns: repeat(2, 1fr);
  }
}
.zone-card {
  display: block;
  transition: transform 0.4s;
  img {
    width: 100%;
    /* 生产实测高 122px */
    height: 122px;
    object-fit: cover;
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
  /* 生产筛选卡 p-2 */
  padding: 8px;
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
.jl-pager {
  margin: 16px 0 20px 8px;
}
.resumes {
  display: grid;
  gap: 0;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  @media (min-width: 768px) {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
  @media (min-width: 1024px) {
    grid-template-columns: repeat(4, minmax(0, 1fr));
  }
  @media (min-width: 1280px) {
    grid-template-columns: repeat(5, minmax(0, 1fr));
  }
}
.resume-card {
  margin: 8px;
  min-width: 0;
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
    .hot-badge {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      color: #ef4444;
      font-size: 12px;
      svg {
        width: 14px;
        height: 14px;
      }
    }
  }
  .rc-tags {
    display: flex;
    gap: 4px;
    margin: 6px 0 0;
    overflow: hidden;
    .rc-tag {
      font-size: 11px;
      color: #6b7280;
      border: 1px solid rgba(0, 0, 0, 0.1);
      border-radius: 4px;
      padding: 1px 6px;
      white-space: nowrap;
    }
  }
  .rc-img {
    position: relative;
    border-radius: 6px;
    overflow: hidden;
    img {
      width: 100%;
      /* 生产实测卡图 235×333 */
      aspect-ratio: 235 / 333;
      object-fit: cover;
      border-radius: 6px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.12);
      display: block;
    }
    .new-badge {
      position: absolute;
      top: -8px;
      right: 10px;
      background: #22c55e;
      color: #fff;
      font-size: 11px;
      padding: 3px 7px;
      border-radius: 0 0 6px 6px;
      line-height: 1.2;
      z-index: 2;
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
