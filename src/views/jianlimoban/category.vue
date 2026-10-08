<script setup lang="ts">
import { computed, ref, watchEffect } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { templates } from '@/templates/config'
import { TEMPLATE_CATEGORIES } from '@/common/categories'

const route = useRoute()
const router = useRouter()
const keyword = ref('')

const slug = computed(() => route.params.templateCategory as string)
const cat = computed(() => TEMPLATE_CATEGORIES.find(c => c.slug === slug.value))

// 非模板分类的单段路径（如拼错的 URL）回退 404
watchEffect(() => {
  if (slug.value && !cat.value) router.replace('/404')
})

const GROUPS: { label: string; icon: string; slugs: string[] }[] = [
  {
    label: '热门',
    icon: '🔥',
    slugs: [
      'daxuesheng',
      'shixisheng',
      'yingjiesheng',
      'qiuzhi',
      'liuxue',
      'yingwen',
      'shuqishixi',
      'xiaozhao'
    ]
  },
  {
    label: '行业',
    icon: '🏢',
    slugs: [
      'hulianwang',
      'jinrong',
      'zixun',
      'yinhang',
      'wenhuachuanmei',
      'fangdichan',
      'dianzishangwu',
      'tongxin',
      'youxi',
      'zhizaoye',
      'qiche',
      'cangchuwuliu',
      'jiaoyupeixun',
      'baoxian',
      'guanggao'
    ]
  },
  {
    label: '职位',
    icon: '💼',
    slugs: [
      'chanpinjingli',
      'chengxuyuan',
      'agentkaifa',
      'yunying',
      'xingzheng',
      'sheji',
      'caiwu',
      'jiaoshi',
      'python',
      'webqianduan',
      'java',
      'android',
      'ios',
      'ceshi',
      'yunwei',
      'dashuju',
      'uiux',
      'pingmiansheji',
      'renliziyuan',
      'huizhancehua',
      'yiliaojiankang',
      'pinpaigongguan',
      'suanfagongchengshi',
      'kuaixiao',
      'javascript',
      'netgongchengshi',
      'cgongchengshi',
      'wangluoanquan',
      'shujufenxi',
      'qianrushi',
      'shichangyingxiao',
      'caigoumaoyi',
      'shangwutuozhan',
      'waimao',
      'xiaoshou',
      'wenancehua',
      'seosem',
      'xinmeiti'
    ]
  },
  {
    label: '学校',
    icon: '🎓',
    slugs: [
      'qinghuadaxue',
      'beijingdaxue',
      'fudandaxue',
      'shanghaijiaotongdaxue',
      'zhejiangdaxue',
      'wuhandaxue',
      'zhongshandaxue',
      'zhongguorenmindaxue',
      'duiwaijingmaodaxue',
      'xianggangdaxue',
      'sichuandaxue',
      'nankaidaxue',
      'nanjingdaxue',
      'jilindaxue',
      'zhongnandaxue',
      'shenzhendaxue',
      'jinandaxue',
      'zhongyangcaijingdaxue',
      'dianzikejidaxue',
      'zhongguochuanmeidaxue',
      'tongjidaxue'
    ]
  },
  {
    label: '专业',
    icon: '📚',
    slugs: [
      'ruanjiangongcheng',
      'gongshangguanli',
      'jinrongxue',
      'jisuanjikexue',
      'jingjixue',
      'chuanboxue',
      'shichangyingxiao',
      'kuaijixue',
      'yishusheji',
      'dianzixinxigongcheng',
      'jiaoyuxue',
      'yuyanzhuanye'
    ]
  }
]
const catName = (s: string) => TEMPLATE_CATEGORIES.find(c => c.slug === s)?.name ?? s

// 生产默认全部展开，超过阈值给「收起 / 展开全部」按钮
const expanded = ref<Record<string, boolean>>({})
const CAP = 16
const shownSlugs = (g: (typeof GROUPS)[number]) =>
  expanded.value[g.label] === false ? g.slugs.slice(0, CAP) : g.slugs
const toggleGroup = (label: string) => {
  expanded.value[label] = expanded.value[label] === false
}

// 生产标题：分类名本身带「简历模板」则只加「汇总」
const sumTitle = computed(() => {
  const n = cat.value?.name ?? String(slug.value)
  return n.includes('简历模板') ? `${n}汇总` : `${n}简历模板汇总`
})

// 生产 SEO title：{去掉简历模板后缀的短名}简历模板_{短名}个人简历免费下载 - CodeCV简历
watchEffect(() => {
  if (route.name !== 'template-category') return
  const n = cat.value?.name ?? ''
  if (!n) return
  const short = n.replace(/简历模板$/, '')
  document.title = `${short}简历模板_${short}个人简历免费下载 - CodeCV简历`
})

// 生产实测静态榜单（与 AsideRail 同源）
const RANK15 = [
  {
    href: '/jianlimoban/45',
    text: '产品/运营/数分/算法/前端/校招/社招/实习/上海交通大学/后端',
    hot: 55799
  },
  { href: '/jianlimoban/1internet_avatar', text: '互联网/校招/社招/可拖拽证件照', hot: 23460 },
  { href: '/jianlimoban/43', text: '研发/工程师/校招/社招/互联网/通用/华东师范大学', hot: 23085 },
  { href: '/jianlimoban/48', text: 'Java/前端/Go/校招/社招/左对齐/通用', hot: 22869 },
  {
    href: '/jianlimoban/61',
    text: 'AI开发/AI应用/程序员/Agent开发/RAG应用开发/AI大模型应用/暑期实习/软件工程/Ai',
    hot: 20679
  },
  { href: '/jianlimoban/38', text: '运营/互联网/校招/社招/简洁', hot: 15339 },
  { href: '/jianlimoban/44', text: '运营/研发/校招/社招/互联网/通用/实习/应届生', hot: 15236 },
  {
    href: '/jianlimoban/55',
    text: '后端/Java/Go/微服务/分布式/高并发/校招/社招/计算机科学与技术',
    hot: 13517
  },
  { href: '/jianlimoban/27', text: '校招/社招/电气/极简', hot: 10014 },
  {
    href: '/jianlimoban/15simple_versatile',
    text: '简约/后端/前端/互联网/Java/实习/通用/证件照',
    hot: 10011
  },
  { href: '/jianlimoban/35', text: '测试/互联网/校招/社招', hot: 7970 },
  { href: '/jianlimoban/41', text: '运营/设计/研发/校招/渐变配色/新媒体/自媒体', hot: 7954 },
  { href: '/jianlimoban/33', text: '事业单位/通用/简约/校招', hot: 7213 },
  { href: '/jianlimoban/34', text: '研发/前端/后端/测试/通用/校招/互联网/社招', hot: 7048 },
  { href: '/jianlimoban/39', text: '运营/互联网/校招/一页', hot: 7026 }
]

const shown = computed(() => {
  if (!cat.value) return []
  const set = new Set(cat.value.cards)
  let rows = templates.value.filter(t => set.has(t.type))
  const order = new Map(cat.value.cards.map((t, i) => [t, i]))
  rows.sort((a, b) => (order.get(a.type) ?? 999) - (order.get(b.type) ?? 999))
  const kw = keyword.value.trim()
  if (kw) rows = rows.filter(r => r.name.includes(kw))
  return rows
})
</script>

<template>
  <div class="cat-page">
    <div class="crumb-wrap">
      <el-breadcrumb separator="/" class="crumb">
        <el-breadcrumb-item :to="{ path: '/' }">首页</el-breadcrumb-item>
        <el-breadcrumb-item :to="{ path: '/jianlimoban' }">简历模板中心</el-breadcrumb-item>
        <el-breadcrumb-item>{{ cat?.name ?? slug }}</el-breadcrumb-item>
      </el-breadcrumb>
    </div>

    <section class="search-card">
      <form class="search-form" @submit.prevent>
        <svg class="s-ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
        <input
          v-model="keyword"
          type="text"
          placeholder="通过关键词搜索相关简历模板"
          aria-label="搜索简历模板"
        />
        <button type="submit" class="go">搜索</button>
      </form>

      <div v-for="g in GROUPS" :key="g.label" class="tag-row">
        <span class="tag-label"
          ><span aria-hidden="true">{{ g.icon }}</span> {{ g.label }}</span
        >
        <div class="tag-wrap">
          <div class="tag-flow">
            <router-link
              v-for="s in shownSlugs(g)"
              :key="s"
              :to="`/${s}`"
              class="tag-pill"
              :class="{ active: slug === s }"
              >{{ catName(s) }}</router-link
            >
          </div>
          <div v-if="g.slugs.length > CAP" class="tag-expand-row">
            <button class="tag-expand" type="button" @click="toggleGroup(g.label)">
              <span>{{
                expanded[g.label] === false ? `展开全部 ${g.slugs.length} 个` : '收起'
              }}</span>
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
                :class="{ up: expanded[g.label] !== false }"
              >
                <path d="m6 9 6 6 6-6" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </section>

    <div class="cat-cols">
      <section class="main-card">
        <div class="sum-row">
          <h1 class="sum-title">{{ sumTitle }}</h1>
          <span class="sum-count">共 {{ shown.length }} 个模板</span>
        </div>
        <div class="resumes">
          <router-link
            v-for="t in shown"
            :key="t.type"
            :to="`/jianlimoban/${t.type}`"
            class="resume-card"
          >
            <div class="rc-img">
              <img
                :src="t.img"
                :alt="`${t.name}简历模板`"
                width="500"
                height="707"
                loading="lazy"
                decoding="async"
              />
              <span v-if="(t.hot ?? 0) >= 1000" class="hot-badge">
                <svg viewBox="0 0 1024 1024" fill="currentColor" aria-hidden="true">
                  <path
                    d="M326.3 981.3C261.2 850.5 295.5 775.3 346.9 706.6c54.8-78.5 68.5-153.7 68.5-153.7s44.5 52.4 27.4 137.4c75.4-81.8 89.1-212.6 78.8-261.7 171.3 114.5 246.7 366.3 147.4 549.5 527.7-287.8 130.2-716.2 61.7-762 24 49 27.4 130.8-20.6 170C631.3 98.3 436 42.7 436 42.7c24 147.2-82.2 307.4-185 428.4-3.4-58.9-6.8-98.1-41.1-157-6.8 108-92.5 193-116.5 300.9-30.8 147.2 24 251.8 232.9 366.3z"
                  />
                </svg>
                热门
              </span>
            </div>
            <div class="rc-info">
              <h3 class="rc-name">{{ t.name }}简历模板</h3>
              <p class="rc-desc">{{ t.description }}</p>
              <div class="rc-tags">
                <span v-for="x in (t.tags ?? []).slice(0, 4)" :key="x">{{ x }}</span>
              </div>
              <div class="rc-meta">
                <span class="rc-users">
                  <svg viewBox="0 0 1024 1024" fill="currentColor" aria-hidden="true">
                    <path
                      d="M519.8 574.1c115.7 0 209.5-97.3 209.5-217.3S635.4 139.6 519.8 139.6 310.3 236.9 310.3 356.8s93.8 217.3 209.5 217.3z"
                    />
                    <path
                      d="M519.8 170.7c96.1 0 174.3 81.4 174.3 181.4s-78.2 181.4-174.3 181.4-174.4-81.4-174.4-181.4 78.3-181.4 174.4-181.4z"
                      fill="#f8d02d"
                    />
                  </svg>
                  {{ t.hot ?? 0 }}人使用
                </span>
                <span v-if="t.date" class="rc-date">{{ t.date }}</span>
              </div>
            </div>
          </router-link>
          <el-empty
            v-if="!shown.length"
            :description="keyword ? '未找到匹配模板' : '该分类暂无模板'"
          />
        </div>
      </section>
      <aside class="cat-aside">
        <router-link to="/jobs" class="aside-jobs">
          <div class="aj-title">2027校招信息汇总</div>
          <img src="/codecv-assets/recruitment.webp" alt="2027校招信息汇总" loading="lazy" />
          <p class="aj-cap">打破信息差，早就是机会 🎈</p>
        </router-link>
        <div class="aside-rank">
          <p class="ar-title">简历模板热度排行榜</p>
          <ol class="ar-list">
            <li v-for="(t, i) in RANK15" :key="t.href">
              <router-link :to="t.href" class="rank-a text-ellipsis">
                <span class="rk" :class="{ top: i < 3 }">{{ i + 1 }}</span
                >{{ t.text }}
              </router-link>
              <sub class="rh"><i class="iconfont icon-hot"></i> {{ t.hot }}</sub>
            </li>
          </ol>
        </div>
      </aside>
    </div>
  </div>
</template>

<style lang="scss">
.cat-page {
  max-width: 1280px;
  margin: 0 auto;
  padding: 4px;
  color: var(--font-color);
  @media (min-width: 768px) {
    padding-left: 16px;
    padding-right: 16px;
  }
}
.crumb-wrap {
  padding: 12px 0;
  font-family: 'Times New Roman', serif;
  font-size: 14px;
  @media (min-width: 768px) {
    padding: 16px 0;
  }
}
.search-card {
  border-radius: 16px;
  background: var(--background);
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
  padding: 16px;
  @media (min-width: 768px) {
    padding: 20px;
  }
}
.search-form {
  display: flex;
  align-items: center;
  height: 44px;
  margin: 0 0 20px;
  padding-left: 16px;
  padding-right: 4px;
  border-radius: 999px;
  background: var(--body-background);
  transition: all 0.2s;
  &:focus-within {
    background: var(--background);
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
  }
  .s-ic {
    width: 16px;
    height: 16px;
    margin-right: 10px;
    color: #9ca3af;
    flex-shrink: 0;
  }
  input {
    flex: 1;
    min-width: 0;
    height: 100%;
    border: none;
    background: transparent;
    outline: none;
    font-size: 14px;
    color: var(--font-color);
  }
  .go {
    height: 36px;
    padding: 0 24px;
    border: none;
    border-radius: 999px;
    color: #fff;
    font-size: 14px;
    font-weight: 500;
    background: linear-gradient(90deg, #ff7449, #ff9a44);
    cursor: pointer;
    flex-shrink: 0;
    &:hover {
      filter: brightness(1.05);
    }
  }
}
.tag-row {
  display: flex;
  align-items: flex-start;
  gap: 16px;
  margin-bottom: 16px;
  &:last-of-type {
    margin-bottom: 0;
  }
}
.tag-label {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  flex-shrink: 0;
  margin-top: 4px;
  padding: 4px 12px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  white-space: nowrap;
  color: var(--theme);
  background: color-mix(in srgb, var(--theme) 10%, transparent);
}
.tag-wrap {
  flex: 1;
  min-width: 0;
}
.tag-flow {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}
.tag-pill {
  padding: 6px 12px;
  border-radius: 999px;
  font-size: 14px;
  line-height: 20px;
  color: rgb(30, 41, 59);
  text-decoration: none;
  background: rgba(0, 0, 0, 0.04);
  white-space: nowrap;
  transition: color 0.2s;
  &:hover {
    color: var(--theme);
  }
  &.active {
    color: #fff;
    background: linear-gradient(90deg, #ff7449, #ff9a44);
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.12);
  }
}
.tag-expand-row {
  display: flex;
  justify-content: flex-end;
  margin-top: 6px;
}
.tag-expand {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  height: 16px;
  border: none;
  background: none;
  cursor: pointer;
  font-size: 12px;
  color: #9ca3af;
  padding: 0;
  svg {
    width: 12px;
    height: 12px;
    transition: transform 0.2s ease;
    &.up {
      transform: rotate(180deg);
    }
  }
  &:hover {
    color: var(--theme);
  }
}
.cat-cols {
  display: flex;
  flex-direction: column;
  gap: 16px;
  margin-top: 16px;
  align-items: flex-start;
  @media (min-width: 768px) {
    flex-direction: row;
  }
}
.main-card {
  flex: 1;
  width: 100%;
  min-width: 0;
  border-radius: 16px;
  background: var(--background);
  padding: 16px;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
  @media (min-width: 768px) {
    padding: 20px;
  }
}
.sum-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 16px;
}
.sum-title {
  margin: 0;
  padding-bottom: 4px;
  font-size: 16px;
  font-weight: 700;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  @media (min-width: 768px) {
    font-size: 20px;
  }
}
.sum-count {
  flex-shrink: 0;
  font-size: 14px;
  font-weight: 400;
  color: var(--theme);
  background: color-mix(in srgb, var(--theme) 10%, transparent);
  border-radius: 999px;
  padding: 4px 12px;
  white-space: nowrap;
}
.resumes {
  display: grid;
  gap: 12px;
  grid-template-columns: repeat(2, 1fr);
  transition: opacity 0.2s;
  @media (min-width: 768px) {
    grid-template-columns: repeat(3, 1fr);
    gap: 16px;
  }
  @media (min-width: 1280px) {
    grid-template-columns: repeat(4, 1fr);
  }
}
.resume-card {
  position: relative;
  display: flex;
  flex-direction: column;
  text-decoration: none;
  color: var(--font-color);
  cursor: pointer;
  border-radius: 12px;
  overflow: hidden;
  background: var(--background);
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
  transition: transform 0.3s, box-shadow 0.3s;
  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
  }
  .rc-img {
    position: relative;
    aspect-ratio: 210 / 297;
    overflow: hidden;
    background: var(--body-background);
    .hot-badge {
      position: absolute;
      top: 8px;
      left: 8px;
      z-index: 2;
      display: flex;
      align-items: center;
      gap: 2px;
      background: linear-gradient(90deg, #ff7449, #ff9a44);
      color: #fff;
      font-size: 12px;
      padding: 2px 8px 2px 6px;
      border-radius: 999px;
      box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
      svg {
        width: 12px;
        height: 12px;
      }
    }
    img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      object-position: top;
      display: block;
      transition: transform 0.3s;
    }
  }
  &:hover .rc-img img {
    transform: scale(1.03);
  }
  .rc-info {
    display: flex;
    flex-direction: column;
    gap: 6px;
    flex: 1;
    padding: 10px;
    @media (min-width: 768px) {
      padding: 12px;
    }
  }
  .rc-name {
    margin: 0;
    font-size: 14px;
    font-weight: 600;
    line-height: 20px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    @media (min-width: 768px) {
      font-size: 15px;
    }
  }
  .rc-desc {
    display: none;
    margin: 0;
    font-size: 12px;
    line-height: 20px;
    color: #6b7280;
  }
  .rc-tags {
    display: none;
    flex-wrap: wrap;
    gap: 4px;
    overflow: hidden;
    max-height: 20px;
    @media (min-width: 768px) {
      display: flex;
    }
    span {
      font-size: 12px;
      line-height: 20px;
      color: #6b7280;
      background: rgba(0, 0, 0, 0.04);
      border-radius: 4px;
      padding: 0 6px;
      white-space: nowrap;
    }
  }
  .rc-meta {
    margin-top: auto;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
    font-size: 12px;
    color: #9ca3af;
    .rc-users {
      display: flex;
      align-items: center;
      gap: 4px;
      white-space: nowrap;
      svg {
        width: 14px;
        height: 14px;
      }
    }
    .rc-date {
      flex-shrink: 0;
    }
  }
  &:hover .rc-name {
    color: var(--theme);
  }
}
.cat-aside {
  width: 260px;
  flex-shrink: 0;
  display: none;
  flex-direction: column;
  gap: 16px;
  position: sticky;
  top: 80px;
  @media (min-width: 768px) {
    display: flex;
  }
  .aside-jobs {
    border-radius: 12px;
    overflow: hidden;
    display: block;
    background: var(--background);
    padding: 16px;
    text-decoration: none;
    .aj-title {
      font-size: 16px;
      font-weight: 600;
      color: var(--theme);
      margin-bottom: 8px;
    }
    img {
      width: 100%;
      display: block;
      border-radius: 12px;
    }
    .aj-cap {
      margin: 8px 0 0;
      font-size: 14px;
      line-height: 1.6;
      color: var(--font-color);
    }
  }
  .aside-rank {
    background: var(--background);
    border-radius: 12px;
    padding: 20px;
    .ar-title {
      font-size: 14px;
      font-weight: 700;
      color: var(--theme);
      margin: 0 0 8px;
      display: inline-block;
    }
    .ar-list {
      list-style: none;
      padding: 0;
      margin: 0;
      li {
        display: flex;
        align-items: center;
        justify-content: space-between;
        cursor: pointer;
        &:hover {
          opacity: 0.7;
        }
      }
      .rank-a {
        flex: 1;
        min-width: 0;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        font-size: 14px;
        line-height: 32px;
        color: var(--font-color);
        text-decoration: none;
        .rk {
          margin-right: 12px;
          color: var(--font-color);
          &.top {
            color: #ff4500;
            font-weight: 700;
          }
        }
      }
      .rh {
        flex-shrink: 0;
        color: #ff4500;
        font-weight: 700;
        font-size: 14px;
        margin-bottom: 8px;
        text-align: right;
        white-space: nowrap;
      }
    }
  }
}
</style>
