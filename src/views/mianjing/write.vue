<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { mianjingMeta, MianjingCompany, MianjingPosition } from '@/api/modules/site'
import { submitMianjing } from '@/api/modules/share'
import { localAsset, logoColor } from '@/utils/article'
import { currentUser } from '@/utils/auth'
import LoginModal from '@/components/LoginModal.vue'

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
const wordCount = computed(() => form.value.contentMd.length)

const DRAFT_KEY = 'mianjing-draft'
const submitted = ref(false)

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

async function submit() {
  const f = form.value
  if (!f.companySlug) return ElMessage.warning('请选择公司')
  if (!f.positionSlug) return ElMessage.warning('请选择岗位方向')
  if (!f.round) return ElMessage.warning('请选择面试轮次')
  if (f.title.trim().length < 4) return ElMessage.warning('标题至少 4 个字')
  if (f.contentMd.trim().length < 50)
    return ElMessage.warning('正文至少 50 字，建议写清面试问题与过程')
  if (!currentUser()) {
    loginModal.value = true
    return
  }
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
    submitted.value = true
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <div class="mj-page mj-write">
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
      <span>投稿面经</span>
    </nav>

    <div v-if="submitted" class="mj-card done">
      <svg
        class="done-ic"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
      >
        <path d="M21.801 10A10 10 0 1 1 17 3.335" />
        <path d="m9 11 3 3L22 4" />
      </svg>
      <h2>投稿成功</h2>
      <p>面经已提交，审核通过后将在面经大全中展示。</p>
      <div class="done-actions">
        <router-link to="/mianjing" class="mj-btn">返回面经大全</router-link>
        <router-link to="/mianjing/mine" class="mj-btn ghost">查看我的投稿</router-link>
      </div>
    </div>

    <template v-else>
      <header class="mj-card hero">
        <h1>分享你的面经</h1>
        <p>
          写下真实的面试经历，帮助更多同学。支持 Markdown
          格式，建议包含：面试流程、问题清单、复盘总结。
        </p>
      </header>

      <div class="mj-card form-card">
        <div class="grid2">
          <label class="f">
            <span>公司 <i>*</i></span>
            <el-select v-model="form.companySlug" placeholder="选择公司" filterable>
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
            <span>岗位方向 <i>*</i></span>
            <el-select v-model="form.positionSlug" placeholder="选择岗位" filterable>
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
            <span>轮次 <i>*</i></span>
            <el-select v-model="form.round" placeholder="选择轮次">
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

        <label class="f">
          <span>标题 <i>*</i></span>
          <input
            v-model="form.title"
            class="ti"
            type="text"
            placeholder="例如：字节跳动一面（后端开发）0901面经"
            @input="autoSave"
          />
        </label>

        <label class="f">
          <span
            >正文（Markdown）<i>*</i> <em class="wc">{{ wordCount }} 字</em></span
          >
          <textarea
            v-model="form.contentMd"
            class="ta"
            rows="16"
            placeholder="**岗位方向**：后端开发&#10;&#10;**形式**：单面，线上&#10;&#10;## 面试问题&#10;1. ...&#10;&#10;## 复盘&#10;..."
            @input="autoSave"
          ></textarea>
        </label>

        <div class="grid2">
          <label class="f">
            <span>学校（选填）</span>
            <input
              v-model="form.school"
              class="ti"
              type="text"
              placeholder="例如：上海交通大学"
              @input="autoSave"
            />
          </label>
          <label class="f">
            <span>专业（选填）</span>
            <input
              v-model="form.major"
              class="ti"
              type="text"
              placeholder="例如：软件工程"
              @input="autoSave"
            />
          </label>
        </div>

        <div class="actions">
          <label class="anon">
            <input v-model="form.anonymous" type="checkbox" />
            匿名发布
          </label>
          <button class="mj-btn" :disabled="submitting" @click="submit">
            {{ submitting ? '提交中…' : '提交面经' }}
          </button>
        </div>
      </div>
    </template>
    <LoginModal v-if="loginModal" @close="loginModal = false" />
  </div>
</template>

<style lang="scss">
@import './mianjing.scss';

.mj-write {
  max-width: 880px;
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
    h1 {
      margin: 0;
      font-size: 22px;
      font-weight: 700;
    }
    p {
      margin-top: 8px;
      font-size: 13px;
      opacity: 0.55;
      line-height: 1.8;
    }
  }
  .form-card {
    margin-top: 16px;
    padding: 24px;
    display: flex;
    flex-direction: column;
    gap: 18px;
  }
  .grid2 {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 14px;
    @media (max-width: 640px) {
      grid-template-columns: 1fr;
    }
  }
  .f {
    display: flex;
    flex-direction: column;
    gap: 8px;
    > span {
      font-size: 13px;
      font-weight: 500;
      i {
        color: var(--theme);
        font-style: normal;
      }
      .wc {
        float: right;
        font-weight: 400;
        opacity: 0.45;
        font-style: normal;
      }
    }
    .ti {
      height: 40px;
      padding: 0 14px;
      border-radius: 10px;
      border: 1px solid rgba(0, 0, 0, 0.1);
      background: var(--background);
      color: var(--font-color);
      font-size: 14px;
      outline: none;
      &:focus {
        border-color: var(--theme);
      }
    }
    .ta {
      padding: 14px;
      border-radius: 10px;
      border: 1px solid rgba(0, 0, 0, 0.1);
      background: var(--background);
      color: var(--font-color);
      font-size: 14px;
      line-height: 1.8;
      font-family: ui-monospace, monospace;
      outline: none;
      resize: vertical;
      &:focus {
        border-color: var(--theme);
      }
    }
  }
  .opt {
    display: inline-flex;
    align-items: center;
    gap: 8px;
  }
  .actions {
    display: flex;
    align-items: center;
    justify-content: space-between;
    .anon {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      font-size: 13px;
      opacity: 0.7;
      cursor: pointer;
    }
  }
  .done {
    padding: 48px 24px;
    text-align: center;
    .done-ic {
      width: 48px;
      height: 48px;
      color: var(--theme);
      margin: 0 auto;
    }
    h2 {
      margin: 16px 0 8px;
      font-size: 20px;
    }
    p {
      opacity: 0.55;
      font-size: 14px;
    }
    .done-actions {
      margin-top: 24px;
      display: flex;
      justify-content: center;
      gap: 12px;
    }
    .mj-btn.ghost {
      background: transparent;
      color: var(--theme);
      border: 1px solid var(--theme);
    }
  }
}
</style>
