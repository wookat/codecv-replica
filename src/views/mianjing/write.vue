<script setup lang="ts">
import { computed, nextTick, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { mianjingMeta, MianjingCompany, MianjingPosition } from '@/api/modules/site'
import { submitMianjing } from '@/api/modules/share'
import { localAsset, logoColor } from '@/utils/article'
import { currentUser } from '@/utils/auth'
import LoginModal from '@/components/LoginModal.vue'

const router = useRouter()
const companies = ref<MianjingCompany[]>([])
const positions = ref<MianjingPosition[]>([])

const form = ref({
  companySlug: '',
  positionSlug: '',
  grade: '2027',
  batch: 'qiuzhao',
  round: '',
  result: '进行中',
  title: '',
  contentMd: '',
  school: '',
  major: '',
  anonymous: false
})

const batchOptions = [
  { v: 'qiuzhao', t: '秋招' },
  { v: 'chunzhao', t: '春招' },
  { v: 'shuqi', t: '暑期实习' },
  { v: 'richang', t: '日常实习' },
  { v: 'shezhao', t: '社招' }
]
const roundOptions = ['一面', '二面', '三面', '四面', 'HR面', '笔试', '群面', '终面']
const resultOptions = ['进行中', '已offer', '已挂']
const gradeOptions = ['2025', '2026', '2027', '2028']

const company = computed(() => companies.value.find(c => c.slug === form.value.companySlug))
const position = computed(() => positions.value.find(p => p.slug === form.value.positionSlug))
const wordCount = computed(() => form.value.contentMd.replace(/\s/g, '').length)
const user = ref(currentUser())

const TPLS = [
  {
    key: 'campus',
    title: '校招 · 按轮次',
    desc: '秋招/春招通用，逐轮记录面试问题',
    secs: ['一面', '二面', '结果与建议'],
    icon: 'cap',
    body: '## 一面\n\n1. \n\n## 二面\n\n1. \n\n## 结果与建议\n\n'
  },
  {
    key: 'social',
    title: '社招 · 项目深挖',
    desc: '突出项目深度、技术决策与薪资沟通',
    secs: ['项目深挖', '技术深度', 'HR 与薪资'],
    icon: 'building',
    body: '## 项目深挖\n\n## 技术深度\n\n## HR 与薪资\n\n'
  },
  {
    key: 'intern',
    title: '实习 · 轻量版',
    desc: '日常/暑期实习，结构更简单',
    secs: ['一面', '后续轮次', '结果与建议'],
    icon: 'chart',
    body: '## 一面\n\n## 后续轮次\n\n## 结果与建议\n\n'
  }
] as const

function applyTpl(t: (typeof TPLS)[number]) {
  form.value.contentMd = t.body
  autoSave()
  nextTick(() => {
    const ta = document.querySelector<HTMLTextAreaElement>('.mw-body')
    if (ta) {
      ta.style.height = 'auto'
      ta.style.height = `${ta.scrollHeight}px`
    }
  })
}

function onBodyInput(e: Event) {
  const ta = e.target as HTMLTextAreaElement
  ta.style.height = 'auto'
  ta.style.height = `${ta.scrollHeight}px`
  autoSave()
}

const DRAFT_KEY = 'mianjing-draft'

onMounted(async () => {
  const draft = localStorage.getItem(DRAFT_KEY)
  if (draft) {
    try {
      form.value = { ...form.value, ...JSON.parse(draft) }
    } catch {
      /* ignore */
    }
  }
  try {
    const [cs, ps] = await Promise.all([mianjingMeta('companies'), mianjingMeta('positions')])
    companies.value = cs?.data ?? []
    positions.value = ps?.data ?? []
  } catch {
    /* ignore */
  }
})

let timer: ReturnType<typeof setTimeout> | null = null
function autoSave() {
  if (timer) clearTimeout(timer)
  timer = setTimeout(() => localStorage.setItem(DRAFT_KEY, JSON.stringify(form.value)), 600)
}

const submitting = ref(false)
const loginModal = ref(false)
const metaOpen = ref(false)

function openPublish() {
  if (wordCount.value < 100) return ElMessage.warning('至少写满 100 字才能发布')
  if (!currentUser()) {
    loginModal.value = true
    return
  }
  metaOpen.value = true
}

function autoTitle() {
  const f = form.value
  if (f.title.trim()) return f.title.trim()
  const c = company.value?.name ?? '面经'
  const pos = position.value?.name ?? ''
  const d = new Date(Date.now() + 8 * 3600 * 1000)
  const md = `${String(d.getUTCMonth() + 1).padStart(2, '0')}${String(d.getUTCDate()).padStart(
    2,
    '0'
  )}`
  return `${c}${f.round || ''}（${pos}）${md}面经`
}

async function submit() {
  const f = form.value
  f.title = autoTitle()
  submitting.value = true
  try {
    const res = await submitMianjing({ ...f, companyName: company.value?.name })
    if (res?.code !== 200) {
      if (res?.code === 401) {
        loginModal.value = true
        return
      }
      return ElMessage.error(res?.msg || '投稿失败')
    }
    const mine = JSON.parse(localStorage.getItem('mianjing-mine') || '[]')
    mine.unshift({
      ...f,
      _id: `srv-${res.data.id}`,
      companyName: company.value?.name,
      create_time: Date.now(),
      status: 'pending'
    })
    localStorage.setItem('mianjing-mine', JSON.stringify(mine))
    localStorage.removeItem(DRAFT_KEY)
    metaOpen.value = false
    ElMessage.success('已发布，审核通过后将在面经大全中展示')
    router.push('/mianjing/mine')
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <div class="mw-page">
    <!-- 生产同款极简顶栏：返回圆钮 + 发布/通知/头像 -->
    <header class="mw-top">
      <button class="mw-back" title="返回" @click="router.back()">
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2.2"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <path d="M19 12H5" />
          <path d="m12 19-7-7 7-7" />
        </svg>
      </button>
      <div class="mw-top-right">
        <button class="mw-pub" :disabled="submitting" @click="openPublish">
          {{ submitting ? '发布中…' : '发布' }}
        </button>
        <router-link class="mw-bell" to="/notify" title="通知">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="1.8"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
            <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
          </svg>
        </router-link>
        <router-link class="mw-avatar" to="/profile">{{ (user?.name || '游')[0] }}</router-link>
      </div>
    </header>

    <main class="mw-main">
      <input
        v-model="form.title"
        class="mw-title"
        type="text"
        placeholder="给这篇面经起个标题"
        @input="autoSave"
      />
      <p class="mw-sub">选填 · 不填将按公司 / 届别 / 批次 / 岗位 / 轮次自动生成</p>

      <textarea
        v-model="form.contentMd"
        class="mw-body"
        placeholder="输入 / 唤起块菜单开始书写，或从下方选择模板…"
        @input="onBodyInput"
      ></textarea>

      <p class="mw-tpl-tip">从模板开始 选一个结构快速上手，也可以直接在上方自由书写</p>
      <div class="mw-tpls">
        <button
          v-for="t in TPLS"
          :key="t.key"
          class="mw-tpl-card"
          type="button"
          @click="applyTpl(t)"
        >
          <span class="mw-tpl-icon" :class="t.icon">
            <svg
              v-if="t.icon === 'cap'"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="1.8"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <path d="m22 9-10-4L2 9l10 4 10-4Z" />
              <path d="M6 11.5V16c0 1.7 2.7 3 6 3s6-1.3 6-3v-4.5" />
              <path d="M22 9v5" />
            </svg>
            <svg
              v-else-if="t.icon === 'building'"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="1.8"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <rect x="4" y="3" width="16" height="18" rx="1" />
              <path d="M9 21v-4h6v4" />
              <path d="M8 7h2M14 7h2M8 11h2M14 11h2" />
            </svg>
            <svg
              v-else
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="1.8"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <path d="M3 3v18h18" />
              <path d="m7 14 4-4 4 3 5-6" />
            </svg>
          </span>
          <span class="mw-tpl-title">{{ t.title }}</span>
          <span class="mw-tpl-desc">{{ t.desc }}</span>
          <span class="mw-tpl-secs">
            <i v-for="s in t.secs" :key="s">{{ s }}</i>
          </span>
        </button>
      </div>
    </main>

    <p class="mw-count">
      <b>{{ wordCount }}</b> 字 · 至少 100 字才能发布
    </p>

    <!-- 发布元信息弹层（生产语义：公司/届别/批次/岗位/轮次补全标题） -->
    <div v-if="metaOpen" class="mw-mask" @click.self="metaOpen = false">
      <div class="mw-dialog">
        <h3>补全信息（选填）</h3>
        <p class="mw-d-sub">不填将按公司 / 届别 / 批次 / 岗位 / 轮次自动生成标题</p>
        <div class="mw-grid">
          <label class="f">
            <span>公司</span>
            <el-select v-model="form.companySlug" placeholder="选择公司" filterable clearable>
              <el-option v-for="c in companies" :key="c.slug" :label="c.name" :value="c.slug">
                <span class="opt">
                  <span class="mj-logo" :style="{ '--mj-logo-bg': logoColor(c.slug) } as any">
                    <img
                      v-if="c.logo"
                      :src="localAsset(c.logo)"
                      class="mj-logo-img"
                      :alt="c.name"
                    />
                    <template v-else>{{ c.name[0] }}</template>
                  </span>
                  {{ c.name }}
                </span>
              </el-option>
            </el-select>
          </label>
          <label class="f">
            <span>岗位方向</span>
            <el-select v-model="form.positionSlug" placeholder="选择岗位" filterable clearable>
              <el-option v-for="p in positions" :key="p.slug" :label="p.name" :value="p.slug" />
            </el-select>
          </label>
          <label class="f">
            <span>届别</span>
            <el-select v-model="form.grade">
              <el-option v-for="g in gradeOptions" :key="g" :label="`${g}届`" :value="g" />
            </el-select>
          </label>
          <label class="f">
            <span>批次</span>
            <el-select v-model="form.batch">
              <el-option v-for="b in batchOptions" :key="b.v" :label="b.t" :value="b.v" />
            </el-select>
          </label>
          <label class="f">
            <span>轮次</span>
            <el-select v-model="form.round" placeholder="选择轮次" clearable>
              <el-option v-for="r in roundOptions" :key="r" :label="r" :value="r" />
            </el-select>
          </label>
          <label class="f">
            <span>结果</span>
            <el-select v-model="form.result">
              <el-option v-for="r in resultOptions" :key="r" :label="r" :value="r" />
            </el-select>
          </label>
        </div>
        <label class="anon">
          <input v-model="form.anonymous" type="checkbox" />
          匿名发布
        </label>
        <div class="mw-d-actions">
          <button class="mw-d-cancel" @click="metaOpen = false">继续编辑</button>
          <button class="mw-d-ok" :disabled="submitting" @click="submit">
            {{ submitting ? '发布中…' : '确认发布' }}
          </button>
        </div>
      </div>
    </div>

    <LoginModal v-if="loginModal" @close="loginModal = false" />
  </div>
</template>

<style lang="scss">
@import './mianjing.scss';

.mw-page {
  min-height: 100vh;
  background: var(--background);
  font-family: var(--font-noto-sans-sc);
  color: var(--font-color);
}
.mw-top {
  position: sticky;
  top: 0;
  z-index: 10;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 22px;
  background: var(--background);
  .mw-back {
    width: 40px;
    height: 40px;
    border: none;
    border-radius: 999px;
    background: rgba(0, 0, 0, 0.05);
    color: var(--font-color);
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    svg {
      width: 18px;
      height: 18px;
    }
    &:hover {
      background: rgba(0, 0, 0, 0.09);
    }
  }
  .mw-top-right {
    display: flex;
    align-items: center;
    gap: 14px;
  }
  .mw-pub {
    border: none;
    background: var(--theme);
    color: #fff;
    font-size: 14px;
    padding: 8px 20px;
    border-radius: 999px;
    cursor: pointer;
    &:disabled {
      opacity: 0.6;
      cursor: default;
    }
  }
  .mw-bell {
    color: var(--font-color);
    display: inline-flex;
    svg {
      width: 20px;
      height: 20px;
    }
  }
  .mw-avatar {
    width: 32px;
    height: 32px;
    border-radius: 999px;
    background: var(--theme);
    color: #fff;
    font-size: 14px;
    font-weight: 600;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    text-decoration: none;
  }
}
.mw-main {
  max-width: 720px;
  margin: 0 auto;
  padding: 8vh 24px 120px;
}
.mw-title {
  width: 100%;
  border: none;
  outline: none;
  background: transparent;
  font-size: 28px;
  font-weight: 700;
  color: var(--font-color);
  &::placeholder {
    color: rgba(0, 0, 0, 0.25);
  }
}
.mw-sub {
  margin: 6px 0 26px;
  font-size: 12.5px;
  color: rgba(0, 0, 0, 0.4);
}
.mw-body {
  width: 100%;
  min-height: 110px;
  border: none;
  outline: none;
  resize: none;
  background: transparent;
  font-size: 15px;
  line-height: 1.9;
  color: var(--font-color);
  font-family: inherit;
  &::placeholder {
    color: rgba(0, 0, 0, 0.25);
  }
}
.mw-tpl-tip {
  margin: 34px 0 14px;
  font-size: 13px;
  color: rgba(0, 0, 0, 0.4);
}
.mw-tpls {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 14px;
  @media (max-width: 720px) {
    grid-template-columns: 1fr;
  }
}
.mw-tpl-card {
  text-align: left;
  padding: 16px;
  border-radius: 16px;
  border: 1px solid rgba(0, 0, 0, 0.07);
  background: var(--background);
  cursor: pointer;
  display: flex;
  flex-direction: column;
  transition: box-shadow 0.15s ease, border-color 0.15s ease;
  font-family: inherit;
  &:hover {
    border-color: rgba(255, 87, 34, 0.45);
    box-shadow: 0 6px 20px rgba(255, 87, 34, 0.08);
  }
  .mw-tpl-icon {
    width: 36px;
    height: 36px;
    border-radius: 10px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    background: rgba(255, 87, 34, 0.1);
    color: var(--theme);
    svg {
      width: 20px;
      height: 20px;
    }
  }
  .mw-tpl-title {
    margin-top: 10px;
    font-size: 14.5px;
    font-weight: 600;
  }
  .mw-tpl-desc {
    margin-top: 4px;
    font-size: 12.5px;
    color: rgba(0, 0, 0, 0.45);
  }
  .mw-tpl-secs {
    margin-top: 10px;
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    i {
      font-style: normal;
      font-size: 11.5px;
      padding: 2px 8px;
      border-radius: 6px;
      background: rgba(0, 0, 0, 0.05);
      color: rgba(0, 0, 0, 0.55);
    }
  }
}
.mw-count {
  position: fixed;
  left: 22px;
  bottom: 16px;
  font-size: 12.5px;
  color: rgba(0, 0, 0, 0.4);
  b {
    color: var(--theme);
    font-weight: 600;
  }
}
.mw-mask {
  position: fixed;
  inset: 0;
  z-index: 99;
  background: rgba(0, 0, 0, 0.4);
  display: flex;
  align-items: center;
  justify-content: center;
}
.mw-dialog {
  width: min(560px, 92vw);
  background: var(--background);
  border-radius: 16px;
  padding: 24px;
  h3 {
    margin: 0;
    font-size: 17px;
  }
  .mw-d-sub {
    margin: 6px 0 18px;
    font-size: 12.5px;
    color: rgba(0, 0, 0, 0.4);
  }
  .mw-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 14px;
  }
  .f {
    display: flex;
    flex-direction: column;
    gap: 6px;
    > span {
      font-size: 12.5px;
      color: rgba(0, 0, 0, 0.55);
    }
  }
  .opt {
    display: inline-flex;
    align-items: center;
    gap: 8px;
  }
  .anon {
    margin-top: 14px;
    display: inline-flex;
    align-items: center;
    gap: 6px;
    font-size: 13px;
    color: rgba(0, 0, 0, 0.6);
    cursor: pointer;
  }
  .mw-d-actions {
    margin-top: 20px;
    display: flex;
    justify-content: flex-end;
    gap: 12px;
    button {
      border-radius: 999px;
      padding: 8px 20px;
      font-size: 14px;
      cursor: pointer;
    }
    .mw-d-cancel {
      border: 1px solid rgba(0, 0, 0, 0.12);
      background: transparent;
      color: var(--font-color);
    }
    .mw-d-ok {
      border: none;
      background: var(--theme);
      color: #fff;
      &:disabled {
        opacity: 0.6;
      }
    }
  }
}
</style>
