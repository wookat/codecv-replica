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
const CAP = 12
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

const hotRank = computed(() =>
  [...templates.value].sort((a, b) => +(b.hot || 0) - +(a.hot || 0)).slice(0, 15)
)

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
    <el-breadcrumb separator="/" class="crumb">
      <el-breadcrumb-item :to="{ path: '/' }">首页</el-breadcrumb-item>
      <el-breadcrumb-item :to="{ path: '/jianlimoban' }">简历模板中心</el-breadcrumb-item>
      <el-breadcrumb-item>{{ cat?.name ?? slug }}</el-breadcrumb-item>
    </el-breadcrumb>

    <div class="cat-cols">
      <section class="main-card">
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
          <div class="tag-flow">
            <router-link
              v-for="s in shownSlugs(g)"
              :key="s"
              :to="`/${s}`"
              class="tag-pill"
              :class="{ active: slug === s }"
              >{{ catName(s) }}</router-link
            >
            <button
              v-if="g.slugs.length > CAP"
              class="tag-pill more"
              type="button"
              @click="toggleGroup(g.label)"
            >
              {{ expanded[g.label] === false ? `展开全部 ${g.slugs.length} 个` : '收起' }}
            </button>
          </div>
        </div>

        <h1 class="sum-title">
          {{ sumTitle }}<span class="sum-count">共 {{ shown.length }} 个模板</span>
        </h1>

        <div class="resumes">
          <router-link
            v-for="t in shown"
            :key="t.type"
            :to="`/jianlimoban/${t.type}`"
            class="resume-card"
          >
            <div class="rc-img">
              <span v-if="(t.hot ?? 0) >= 1000" class="hot-badge">
                <svg viewBox="0 0 1024 1024" fill="currentColor" aria-hidden="true">
                  <path
                    d="M326.3 981.3C261.2 850.5 295.5 775.3 346.9 706.6c54.8-78.5 68.5-153.7 68.5-153.7s44.5 52.4 27.4 137.4c75.4-81.8 89.1-212.6 78.8-261.7 171.3 114.5 246.7 366.3 147.4 549.5 527.7-287.8 130.2-716.2 61.7-762 24 49 27.4 130.8-20.6 170C631.3 98.3 436 42.7 436 42.7c24 147.2-82.2 307.4-185 428.4-3.4-58.9-6.8-98.1-41.1-157-6.8 108-92.5 193-116.5 300.9-30.8 147.2 24 251.8 232.9 366.3z"
                  />
                </svg>
                热门
              </span>
              <div class="mask"><span class="use-btn">使用模板</span></div>
              <img :src="t.img" :alt="`${t.name}简历模板`" loading="lazy" />
            </div>
            <h3 class="rc-name">{{ t.name }}简历模板</h3>
            <p v-if="t.description" class="rc-desc">{{ t.description }}</p>
            <div v-if="(t.tags ?? []).length" class="rc-tags">
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
          </router-link>
          <el-empty
            v-if="!shown.length"
            :description="keyword ? '未找到匹配模板' : '该分类暂无模板'"
          />
        </div>
      </section>
      <aside class="cat-aside">
        <router-link to="/jobs" class="aside-jobs">
          <img src="/prod-assets/offerstar-recruit.webp" alt="2027校招信息汇总" />
          <p class="aj-cap">打破信息差，早就是机会 🎈</p>
        </router-link>
        <div class="aside-rank">
          <p class="ar-title">简历模板热度排行榜</p>
          <ol class="ar-list">
            <li v-for="(t, i) in hotRank" :key="t.type">
              <router-link :to="`/jianlimoban/${t.type}`">
                <span class="rk" :class="{ top: i < 3 }">{{ i + 1 }}</span>
                <span class="rt">{{ (t.tags ?? []).slice(0, 6).join('/') || t.name }}</span>
                <span class="rh">🔥{{ t.hot }}</span>
              </router-link>
            </li>
          </ol>
        </div>
      </aside>
    </div>
  </div>
</template>

<style lang="scss">
.cat-page {
  max-width: var(--max-width);
  margin: 0 auto;
  padding: 12px 16px;
  color: var(--font-color);
}
.cat-cols {
  display: flex;
  gap: 20px;
  align-items: flex-start;
}
.main-card {
  flex: 1;
  min-width: 0;
  margin-top: 12px;
  border-radius: 16px;
  background: var(--background);
  padding: 20px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
}
.search-form {
  display: flex;
  align-items: center;
  height: 44px;
  margin-bottom: 20px;
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
  padding: 4px 10px;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 500;
  white-space: nowrap;
  color: var(--theme);
  background: color-mix(in srgb, var(--theme) 10%, transparent);
}
.tag-flow {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}
.tag-pill {
  padding: 6px 12px;
  border-radius: 999px;
  font-size: 13px;
  color: var(--font-color);
  text-decoration: none;
  background: rgba(0, 0, 0, 0.04);
  white-space: nowrap;
  transition: all 0.2s;
  &:hover {
    color: var(--theme);
  }
  &.active {
    color: #fff;
    background: linear-gradient(90deg, #ff7449, #ff9a44);
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.12);
  }
}
.resumes {
  margin-top: 20px;
  display: grid;
  gap: 12px;
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
.sum-title {
  margin: 22px 0 4px;
  font-size: 18px;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: space-between;
  .sum-count {
    font-size: 12px;
    font-weight: 400;
    color: var(--theme);
    background: color-mix(in srgb, var(--theme) 10%, transparent);
    border-radius: 999px;
    padding: 4px 12px;
    white-space: nowrap;
  }
}
.tag-pill.more {
  border: none;
  cursor: pointer;
  color: var(--theme);
  background: color-mix(in srgb, var(--theme) 8%, transparent);
}
.resume-card {
  text-decoration: none;
  color: var(--font-color);
  .rc-img {
    position: relative;
    border-radius: 6px;
    overflow: hidden;
    .hot-badge {
      position: absolute;
      top: 8px;
      left: 8px;
      z-index: 2;
      display: inline-flex;
      align-items: center;
      gap: 2px;
      background: linear-gradient(90deg, #ff7449, #ff9a44);
      color: #fff;
      font-size: 12px;
      padding: 2px 8px 2px 6px;
      border-radius: 999px;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.15);
      svg {
        width: 14px;
        height: 14px;
      }
    }
    img {
      width: 100%;
      border-radius: 6px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.12);
      display: block;
    }
    .mask {
      position: absolute;
      inset: 0;
      background: rgba(0, 0, 0, 0.35);
      display: flex;
      align-items: center;
      justify-content: center;
      opacity: 0;
      transition: opacity 0.25s;
    }
    .use-btn {
      border: none;
      background: linear-gradient(90deg, #ff7449, #ff9a44);
      color: #fff;
      font-size: 14px;
      border-radius: 999px;
      padding: 8px 16px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
      cursor: pointer;
    }
    &:hover .mask {
      opacity: 1;
    }
  }
  .rc-name {
    display: block;
    margin: 8px 0 0;
    font-size: 14px;
    font-weight: 600;
    line-height: 20px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .rc-desc {
    margin: 4px 0 0;
    font-size: 12px;
    line-height: 20px;
    color: #6b7280;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }
  .rc-tags {
    display: flex;
    flex-wrap: wrap;
    gap: 4px;
    margin-top: 6px;
    max-height: 20px;
    overflow: hidden;
    span {
      font-size: 12px;
      line-height: 20px;
      color: #6b7280;
      background: rgba(0, 0, 0, 0.04);
      border-radius: 4px;
      padding: 0 4px;
      white-space: nowrap;
    }
  }
  .rc-meta {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
    margin-top: 8px;
    font-size: 12px;
    color: #9ca3af;
    .rc-users {
      display: inline-flex;
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
  margin-top: 12px;
  display: flex;
  flex-direction: column;
  gap: 14px;
  @media (max-width: 900px) {
    display: none;
  }
  .aside-jobs {
    border-radius: 12px;
    overflow: hidden;
    display: block;
    background: var(--background);
    img {
      width: 100%;
      display: block;
    }
    .aj-cap {
      margin: 0;
      padding: 10px;
      font-size: 12px;
      color: #6b7280;
      text-align: center;
    }
  }
  .aside-rank {
    background: var(--background);
    border-radius: 12px;
    padding: 14px;
    .ar-title {
      font-size: 14px;
      font-weight: 700;
      color: var(--theme);
      margin: 0 0 10px;
    }
    .ar-list {
      list-style: none;
      padding: 0;
      margin: 0;
      li a {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 5px 0;
        font-size: 12px;
        color: var(--font-color);
        text-decoration: none;
        .rk {
          width: 16px;
          flex-shrink: 0;
          font-weight: 700;
          color: #9ca3af;
          &.top {
            color: var(--theme);
          }
        }
        .rt {
          flex: 1;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          color: #6b7280;
        }
        .rh {
          flex-shrink: 0;
          color: #9ca3af;
          font-size: 11px;
        }
        &:hover .rt {
          color: var(--theme);
        }
      }
    }
  }
}
</style>
