<script setup lang="ts">
// 生产同款 AI 简历助手抽屉：模式选择(简历生成/内容润色/简历诊断)+目标岗位+描述
// 结果弹层：生成/润色 → 可编辑 textarea；诊断 → 渲染建议；复制/替换/另存为文件；剩余次数+会员解锁
import { computed, ref, watch } from 'vue'
import { ElMessage } from 'element-plus'
import useEditorStore from '@/store/modules/editor'
import useUserStore from '@/store/modules/user'
import { getLocalStorage } from '@/common/localstorage'
import { fetchUserInfo } from '@/api/modules/cloudResume'
import { useRoute, useRouter } from 'vue-router'
import { successMessage } from '@/common/message'
import { md2html } from './md2html'

const props = defineProps<{ modelValue: boolean; fileName: string }>()
const emit = defineEmits(['update:modelValue'])

// 「导入上次编写的MD」：填入当前简历已有内容作为输入素材
function importLast() {
  desc.value = editorStore.MDContent || ''
  successMessage('已导入当前简历内容')
}

const editorStore = useEditorStore()
const userStore = useUserStore()
const route = useRoute()
const router = useRouter()
const visible = ref(props.modelValue)
const loading = ref(false)
const aigcMode = ref(0)
const pf = ref('')
const desc = ref('')
const aigcRes = ref('')
const resultOpen = ref(false)
const aiLeft = ref<number>(-2) // -2 未查询；-1 会员无限

const MODES = [
  {
    title: 'AI生成结果',
    label: '简历生成',
    placeholder:
      '描述自身情况如：个人信息、教育背景、实习经历、项目经历等，我会根据你描述的信息生成一份简历样板',
    name: '个人描述',
    confirm: '确认生成',
    example:
      '我叫川宝，目前毕业于美丽国大学，硕士研究生学历，掌握HTML、CSS、JavaScript、Vue、React、Node.js等前端技术，熟悉计算机网络，熟悉Webpack、Vite等构建工具，用过MySQL、Redis数据库，了解数据结构与算法。在校期间获得过三好学生评选、优秀班干部。曾在xx公司xx岗位实习，负责整个简历网站的开发'
  },
  {
    title: '简历内容润色结果',
    label: '内容润色',
    placeholder: '输入需要润色的内容',
    name: '目标内容',
    confirm: '开始润色',
    example: '熟悉vuejs、reactjs、nodejs、mysql，并且使用他们做过一些项目'
  },
  {
    title: '简历诊断建议',
    label: '简历诊断',
    placeholder: '输入你想要应聘的岗位介绍，我会将你的简历结合岗位介绍进行分析并给出修改建议～',
    name: '岗位JD',
    confirm: '开始诊断',
    example: `职位描述：
1、负责用户端产品和中后台相关业务的多端页面开发、上线、维护工作
2、保障业务性能与稳定性，分析各类数据，识别并解决瓶颈问题
3、在理解产品业务的基础上，打造提升产品体验或研发效能的技术工具、产品、平台
4、关注并实践前端前沿技术，通过新技术反哺团队与业务
职位要求：
1. 熟悉常见的数据结构，计算机基础知识扎实，对技术足够热爱
2. 熟悉 JavaScript，至少熟悉一个 MV* 前端框架，并且有着一定的项目经验
3. 熟悉一门服务端语言，能写一定的服务端侧代码（Node、Python、Ruby、Rust 等）
4. 良好的逻辑思维、分析能力、团队合作精神，学习能力强，做事有较强的责任心`
  }
]
const mode = computed(() => MODES[aigcMode.value])
const typeKey = computed(() => String(route.query.type || 'default'))
const token = () => (getLocalStorage('TOKEN') as string) || ''

watch(
  () => props.modelValue,
  async v => {
    visible.value = v
    if (v) {
      const info = await fetchUserInfo()
      aiLeft.value = info ? ((info.member_expires || 0) > Date.now() ? -1 : info.ai ?? 0) : 0
    }
  }
)
watch(visible, v => emit('update:modelValue', v))

async function generate() {
  if (loading.value) return
  if (!desc.value.trim()) {
    ElMessage.warning('请先填写' + mode.value.name)
    return
  }
  if (!token()) {
    ElMessage.warning('请先登录')
    router.push('/login')
    return
  }
  loading.value = true
  try {
    const res = await fetch('/api/ai/aigc', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token()}` },
      body: JSON.stringify({
        pf: pf.value,
        desc:
          aigcMode.value === 2
            ? `【当前简历】\n${editorStore.MDContent}\n【岗位JD】\n${desc.value}`
            : desc.value,
        aigcMode: aigcMode.value,
        userId: (userStore.userInfo as any)?.uid
      })
    }).then(r => r.json())
    if (res?.code === 200) {
      aigcRes.value = res.result?.content || ''
      if (res.result?.aiLeft !== undefined) aiLeft.value = res.result.aiLeft
      resultOpen.value = true
    } else {
      ElMessage.error(res?.message || '生成失败，请稍后再试')
      if (res?.code === -1000) router.push('/login')
    }
  } catch {
    ElMessage.error('生成失败，请稍后再试')
  } finally {
    loading.value = false
  }
}

// 生产同款 example()：示例同时填入目标岗位「前端开发工程师」
function example() {
  if (aigcMode.value !== 1) pf.value = '前端开发工程师'
  desc.value = mode.value.example
}

function copy() {
  navigator.clipboard?.writeText(aigcRes.value)
  successMessage('已复制')
}

// 生产同款：生成结果可整体替换简历内容
function replaceCV() {
  editorStore.setMDContent(aigcRes.value, typeKey.value)
  resultOpen.value = false
  visible.value = false
  successMessage('已替换简历内容')
}

function saveFile() {
  const blob = new Blob([aigcRes.value], { type: 'text/markdown' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${props.fileName || '简历'}_${mode.value.title}.md`
  a.click()
  URL.revokeObjectURL(url)
}

const renderedDiag = computed(() => md2html(aigcRes.value))
</script>

<template>
  <el-drawer v-model="visible" size="380px" class="ai-drawer" :with-header="false">
    <h4 class="ai-title">AI简历助手</h4>
    <div class="row">
      <span class="lb w80">模式选择</span>
      <el-radio-group v-model="aigcMode" class="grow">
        <el-radio v-for="(m, i) in MODES" :key="i" :value="i">{{ m.label }}</el-radio>
      </el-radio-group>
    </div>
    <div v-if="aigcMode !== 1" class="row">
      <span class="lb w100">目标岗位</span>
      <el-input v-model="pf" type="text" maxlength="20" placeholder="想要应聘的岗位" class="grow" />
    </div>
    <div class="row">
      <span class="lb w100">{{ mode.name }}</span>
      <el-input
        v-model="desc"
        type="textarea"
        :placeholder="mode.placeholder"
        :rows="6"
        class="grow"
      />
    </div>
    <div class="ops">
      <button class="b primary" :class="{ disabled: loading }" @click="generate">
        {{ mode.confirm }}
      </button>
      <button class="b" :class="{ disabled: loading }" @click="example">导入示例</button>
      <button class="b ghost" @click="importLast">导入上次编写的MD</button>
      <button class="b ghost" @click="visible = false">取消</button>
    </div>
    <p class="ai-left">
      <template v-if="aiLeft === -1">会员不限次使用</template>
      <template v-else-if="aiLeft > 0"
        >剩余可用次数：<b>{{ aiLeft }}</b> 次</template
      >
      <template v-else>
        剩余可使用次数为0，<router-link to="/member" class="up">升级会员解锁</router-link>
      </template>
    </p>
  </el-drawer>

  <el-dialog v-model="resultOpen" :title="mode.title" width="640px" class="ai-result">
    <div v-if="aigcMode === 2" class="diag" v-html="renderedDiag"></div>
    <el-input v-else v-model="aigcRes" type="textarea" :rows="14" />
    <div class="ops">
      <button v-if="aigcMode === 1" class="b primary" @click="copy">复制润色结果</button>
      <button v-if="aigcMode === 0" class="b primary" @click="replaceCV">替换简历内容</button>
      <button class="b" @click="saveFile">结果另存为文件</button>
      <button class="b ghost" @click="resultOpen = false">关闭</button>
    </div>
  </el-dialog>
</template>

<style lang="scss" scoped>
.ai-title {
  font-size: 16px;
  font-weight: 600;
  margin: 0 0 20px;
}
.row {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  margin-top: 12px;
  .lb {
    font-size: 15px;
    padding-top: 6px;
    &.w80 {
      width: 80px;
    }
    &.w100 {
      width: 100px;
    }
  }
  .grow {
    flex: 1;
  }
}
.ops {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 24px;
  .b {
    border: 1px solid var(--theme);
    background: var(--theme);
    color: #fff;
    border-radius: 6px;
    padding: 7px 16px;
    font-size: 13px;
    cursor: pointer;
    &.ghost {
      background: #fff;
      color: var(--font-color);
      border-color: #e2e4e9;
    }
    &.disabled {
      opacity: 0.7;
      pointer-events: none;
    }
  }
}
.ai-left {
  margin-top: 12px;
  font-size: 13px;
  color: #909399;
  b {
    color: var(--font-color);
  }
  .up {
    color: var(--theme);
  }
}
.diag {
  max-height: 50vh;
  overflow-y: auto;
  font-size: 14px;
  line-height: 1.9;
  :deep(h1),
  :deep(h2),
  :deep(h3) {
    margin: 12px 0 6px;
  }
}
</style>
