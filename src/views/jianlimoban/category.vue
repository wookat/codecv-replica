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
            v-for="s in g.slugs"
            :key="s"
            :to="`/${s}`"
            class="tag-pill"
            :class="{ active: slug === s }"
            >{{ catName(s) }}</router-link
          >
        </div>
      </div>

      <div class="resumes">
        <router-link
          v-for="t in shown"
          :key="t.type"
          :to="`/jianlimoban/${t.type}`"
          class="resume-card"
        >
          <div class="rc-img">
            <div class="mask"><button class="use-btn">使用模板</button></div>
            <img :src="t.img" :alt="`${t.name}简历模板`" loading="lazy" />
          </div>
          <span class="rc-name">{{ t.name }}</span>
        </router-link>
        <el-empty
          v-if="!shown.length"
          :description="keyword ? '未找到匹配模板' : '该分类暂无模板'"
        />
      </div>
    </section>
  </div>
</template>

<style lang="scss">
.cat-page {
  max-width: var(--max-width);
  margin: 0 auto;
  padding: 12px 16px;
  color: var(--font-color);
}
.main-card {
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
.resume-card {
  text-decoration: none;
  color: var(--font-color);
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
      background: rgba(0, 0, 0, 0.35);
      display: flex;
      align-items: center;
      justify-content: center;
      opacity: 0;
      transition: opacity 0.25s;
    }
    .use-btn {
      border: none;
      background: var(--theme);
      color: #fff;
      font-size: 14px;
      border-radius: 6px;
      padding: 8px 14px;
      cursor: pointer;
    }
    &:hover .mask {
      opacity: 1;
    }
  }
  .rc-name {
    display: block;
    margin-top: 6px;
    font-size: 13px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  &:hover .rc-name {
    color: var(--theme);
  }
}
</style>
