<script setup lang="ts">
// 生产同款「导入简历」三步向导：上传(文件/粘贴) → 选择模板 → 预览创建
// 文件侧支持 .md/.txt/.json；pdf/docx 需要云端 AI 解析（暂降级提示粘贴文本）
import { mdContentKey } from '@/common/storageKeys'
import { computed, nextTick, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { templates, resolveTemplateType } from '@/templates/config'
import { getLocalStorage, setLocalStorage } from '@/common/localstorage'
import { isJsonResume, jsonResumeToMd } from '@/utils/jsonResume'
import { convertDOM, allOverlaysHTML } from '@/utils/moduleCombine'
import { importCSS } from '@/utils'
import { cloudSave, fetchUserInfo } from '@/api/modules/cloudResume'

const router = useRouter()
const step = ref(0)
const mode = ref<'file' | 'paste'>('file')
const dragging = ref(false)
const fileInput = ref<HTMLInputElement>()
const fileName = ref('')
const mdText = ref('')
const pasteText = ref('')
const cvUsed = ref(0)
const cvLimit = ref(2)

const STEP_TITLES = ['上传简历', '选择模板', '预览简历']

fetchUserInfo().then(info => {
  if (info) {
    cvUsed.value = info.cvUsed || 0
    cvLimit.value = info.cv
  }
})

// —— 第1步：上传 ——
function pick() {
  fileInput.value?.click()
}
async function onFile(e: Event) {
  const f = (e.target as HTMLInputElement).files?.[0]
  if (f) await importFile(f)
  ;(e.target as HTMLInputElement).value = ''
}
function onDrop(e: DragEvent) {
  dragging.value = false
  const f = e.dataTransfer?.files?.[0]
  if (f) importFile(f)
}

async function importFile(f: File) {
  if (f.size > 10 * 1024 * 1024) return ElMessage.warning('单个文件最大 10MB')
  if (/\.(pdf|docx?)$/i.test(f.name))
    return ElMessage.warning('该格式需要云端 AI 解析，暂未开放——请粘贴简历文本')
  if (!/\.(md|markdown|txt|json)$/i.test(f.name))
    return ElMessage.warning('仅支持 .md / .txt / .json，或粘贴文本')
  let text = await f.text()
  if (text.trim().length < 10) return ElMessage.warning('文件内容过短')
  if (/\.json$/i.test(f.name)) {
    if (!isJsonResume(text)) return ElMessage.warning('不是可识别的 JSON Resume 格式')
    text = jsonResumeToMd(JSON.parse(text))
  }
  mdText.value = text
  fileName.value = f.name
  step.value = 1
}
function usePaste() {
  const t = pasteText.value.trim()
  if (!t) return ElMessage.warning('请粘贴简历文本，支持纯文本或 Markdown 格式')
  if (t.length > 200_000) return ElMessage.warning('粘贴内容为空或超出长度限制')
  mdText.value = t
  fileName.value = '文本导入的简历'
  step.value = 1
}

// —— 第2步：模板选择 ——
const tplKeyword = ref('')
const pickedTpl = ref('')
const tplList = computed(() =>
  templates.value.filter(
    t => !tplKeyword.value || t.name.toLowerCase().includes(tplKeyword.value.toLowerCase())
  )
)
watch(step, async s => {
  if (s === 1 && !pickedTpl.value && templates.value.length)
    pickedTpl.value = templates.value[0].type
  if (s === 2) await renderPreview()
})

// —— 第3步：预览（皮肤 + 内容同渲染管线） ——
const previewEl = ref<HTMLElement>()
const creating = ref(false)
async function renderPreview() {
  await nextTick()
  if (!previewEl.value) return
  const base = resolveTemplateType(pickedTpl.value)
  await importCSS(base)
  previewEl.value.innerHTML = convertDOM(mdText.value).innerHTML + allOverlaysHTML(base)
}

// 配额：对照生产「创建简历份数」——非会员限2份
const canCreate = computed(() => cvLimit.value < 0 || cvUsed.value < cvLimit.value)

async function confirmCreate() {
  if (!pickedTpl.value) return
  if (!canCreate.value) {
    ElMessage.warning('免费版最多创建2份简历，升级会员不限份数')
    return router.push('/member')
  }
  creating.value = true
  const newType = `${pickedTpl.value}~${Date.now().toString(36)}`
  try {
    setLocalStorage(mdContentKey(newType), mdText.value, 1000 * 60 * 60 * 24 * 30)
    const tk = getLocalStorage('TOKEN')
    if (tk) {
      const res = await cloudSave({
        type: newType,
        content: mdText.value,
        name: fileName.value || '导入的简历'
      })
      if (res.code === 403) {
        ElMessage.warning(res.msg || '免费版最多创建2份简历')
        return
      }
    }
    ElMessage.success('简历创建成功')
    router.push(`/editor/${newType}`)
  } finally {
    creating.value = false
  }
}
</script>

<template>
  <div class="im-page">
    <h1 class="sr-only">导入简历_在线简历导入_简历模板选择</h1>
    <div class="im-card">
      <div class="im-head">
        <h2>导入简历</h2>
        <!-- 步骤点（对照生产 step dots） -->
        <div class="dots">
          <span
            v-for="(t, i) in STEP_TITLES"
            :key="t"
            class="dot"
            :class="{ on: step === i, done: step > i }"
            >{{ i + 1 }}. {{ t }}</span
          >
        </div>
      </div>

      <!-- 第1步：上传（文件导入 / 粘贴文本 双 tab） -->
      <div v-show="step === 0" class="step">
        <div class="mode-tabs" role="tablist" aria-label="导入方式">
          <button
            class="tab"
            :class="{ on: mode === 'file' }"
            aria-selected="true"
            @click="mode = 'file'"
          >
            文件导入
          </button>
          <button
            class="tab"
            :class="{ on: mode === 'paste' }"
            :aria-selected="mode === 'paste'"
            @click="mode = 'paste'"
          >
            粘贴文本
          </button>
        </div>

        <div v-if="mode === 'file'">
          <div
            class="drop"
            :class="{ on: dragging }"
            @click="pick"
            @dragover.prevent="dragging = true"
            @dragleave="dragging = false"
            @drop.prevent="onDrop"
          >
            <svg
              class="d-ic"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="1.6"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <path d="M12 16V4m0 0L7.5 8.5M12 4l4.5 4.5" />
              <path d="M5 13v5a2 2 0 002 2h10a2 2 0 002-2v-5" />
            </svg>
            <b>拖拽简历到这里</b>
            <span class="or">或点击选择文件</span>
            <div class="fmts">
              <span class="fmt">.md</span><span class="fmt">.txt</span><span class="fmt">.json</span
              ><span class="fmt off">.pdf(待开放)</span>
            </div>
            <span class="limit">单个文件最大 10MB</span>
          </div>
        </div>
        <div v-else class="paste">
          <el-input
            v-model="pasteText"
            type="textarea"
            :rows="9"
            placeholder="请粘贴简历文本，支持纯文本或 Markdown 格式"
          />
          <div class="paste-foot">
            <button class="btn primary" @click="usePaste">开始解析</button>
          </div>
        </div>
      </div>

      <!-- 第2步：选模板 -->
      <div v-show="step === 1" class="step">
        <div class="tpl-file">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              d="M14 3v5h5M14 3H7a2 2 0 00-2 2v14a2 2 0 002 2h10a2 2 0 002-2V8l-5-5z"
            />
          </svg>
          <span class="fn">{{ fileName }}</span>
        </div>
        <el-input v-model="tplKeyword" placeholder="搜索模板" clearable class="tpl-search" />
        <div v-if="tplList.length" class="tpl-grid">
          <button
            v-for="t in tplList"
            :key="t.type"
            class="tpl"
            :class="{ on: pickedTpl === t.type }"
            @click="pickedTpl = t.type"
          >
            <img :src="t.img" :alt="t.name" loading="lazy" />
            <span class="tn">{{ t.name }}</span>
            <i v-if="pickedTpl === t.type" class="check">✓</i>
          </button>
        </div>
        <p v-else class="tpl-empty">没有匹配的模板</p>
        <div class="step-ops">
          <button class="btn ghost" @click="step = 0">上一步</button>
          <button class="btn primary" :disabled="!pickedTpl" @click="step = 2">下一步</button>
        </div>
      </div>

      <!-- 第3步：预览 + 创建 -->
      <div v-show="step === 2" class="step">
        <div class="pv-wrap">
          <div ref="previewEl" class="markdown-transform-html jufe pv"></div>
        </div>
        <p v-if="!canCreate" class="quota-tip">
          免费版最多创建 2 份简历（已用 {{ cvUsed }} 份），
          <router-link to="/member">升级会员不限份数</router-link>
        </p>
        <div class="step-ops">
          <button class="btn ghost" @click="step = 1">上一步</button>
          <button class="btn primary" :disabled="creating" @click="confirmCreate">
            {{ creating ? '创建中…' : '确认创建' }}
          </button>
        </div>
      </div>
    </div>
    <input
      ref="fileInput"
      type="file"
      class="hidden"
      accept=".md,.markdown,.txt,.json"
      @change="onFile"
    />
  </div>
</template>

<style lang="scss" scoped>
.im-page {
  max-width: var(--max-width);
  margin: 0 auto;
  padding: 40px 20px 60px;
}
.im-card {
  background: var(--background);
  border: 1px solid #eee;
  border-radius: 16px;
  padding: 28px 30px 34px;
}
.im-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 10px;
  h2 {
    font-size: 20px;
    margin: 0;
  }
}
.dots {
  display: flex;
  gap: 8px;
  .dot {
    font-size: 12px;
    color: #b5b8bf;
    &.done {
      color: #67c23a;
    }
    &.on {
      color: var(--theme);
      font-weight: 600;
    }
  }
}
.step {
  margin-top: 22px;
}
.mode-tabs {
  display: inline-flex;
  background: rgba(0, 0, 0, 0.05);
  border-radius: 10px;
  padding: 3px;
  gap: 2px;
  margin-bottom: 18px;
  .tab {
    border: none;
    background: transparent;
    padding: 7px 22px;
    font-size: 14px;
    border-radius: 8px;
    cursor: pointer;
    color: var(--font-color);
    &.on {
      background: #fff;
      box-shadow: 0 1px 4px rgba(0, 0, 0, 0.1);
      font-weight: 600;
    }
  }
}
.drop {
  border: 2px dashed #dcdfe6;
  border-radius: 14px;
  padding: 46px 20px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  cursor: pointer;
  transition: border-color 0.2s;
  &:hover,
  &.on {
    border-color: var(--theme);
    background: rgba(0, 0, 0, 0.015);
  }
  .d-ic {
    width: 40px;
    height: 40px;
    color: var(--theme);
  }
  b {
    font-size: 16px;
  }
  .or {
    font-size: 13px;
    color: #909399;
  }
  .fmts {
    display: flex;
    gap: 8px;
    .fmt {
      font-size: 12px;
      border: 1px solid #e2e4e9;
      border-radius: 5px;
      padding: 2px 8px;
      color: #606266;
      &.off {
        opacity: 0.5;
      }
    }
  }
  .limit {
    font-size: 12px;
    color: #c0c4cc;
  }
}
.paste {
  .paste-foot {
    display: flex;
    justify-content: flex-end;
    margin-top: 12px;
  }
}
.tpl-file {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  border: 1px solid #e2e4e9;
  border-radius: 999px;
  padding: 5px 14px;
  font-size: 13px;
  margin-bottom: 14px;
  svg {
    width: 16px;
    height: 16px;
    color: var(--theme);
  }
  .fn {
    max-width: 280px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
}
.tpl-search {
  max-width: 260px;
  margin-bottom: 14px;
}
.tpl-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(130px, 1fr));
  gap: 14px;
  max-height: 420px;
  overflow: auto;
  padding: 2px;
}
.tpl {
  position: relative;
  border: 2px solid transparent;
  border-radius: 10px;
  overflow: hidden;
  cursor: pointer;
  background: #f6f7f9;
  padding: 0;
  transition: border-color 0.15s;
  &.on {
    border-color: var(--theme);
  }
  img {
    width: 100%;
    aspect-ratio: 3 / 4;
    object-fit: cover;
    display: block;
  }
  .tn {
    display: block;
    font-size: 12px;
    padding: 6px 4px;
    color: var(--font-color);
    background: var(--background);
    text-align: center;
  }
  .check {
    position: absolute;
    top: 6px;
    right: 6px;
    width: 20px;
    height: 20px;
    border-radius: 50%;
    background: var(--theme);
    color: #fff;
    font-size: 12px;
    font-style: normal;
    display: flex;
    align-items: center;
    justify-content: center;
  }
}
.tpl-empty {
  color: #909399;
  font-size: 13px;
  padding: 30px 0;
  text-align: center;
}
.step-ops {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 18px;
}
.btn {
  border: none;
  border-radius: 8px;
  padding: 9px 26px;
  font-size: 14px;
  cursor: pointer;
  &.primary {
    background: var(--theme);
    color: #fff;
    &:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }
  }
  &.ghost {
    background: transparent;
    border: 1px solid #dcdfe6;
    color: var(--font-color);
  }
}
.pv-wrap {
  max-height: 60vh;
  overflow: auto;
  border: 1px solid #eee;
  border-radius: 10px;
  background: #f6f7f9;
  padding: 14px;
}
.pv {
  transform: scale(0.55);
  transform-origin: top left;
  width: 181%;
}
.quota-tip {
  font-size: 13px;
  color: #e6a23c;
  a {
    color: var(--theme);
  }
}
.hidden {
  display: none;
}
</style>
