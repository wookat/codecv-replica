<script setup lang="ts">
// 生产同款「简历语言翻译」弹层：选语言 → 开始翻译 → 二次确认后应用
import { mdContentKey } from '@/common/storageKeys'
import { nextTick, ref, watch } from 'vue'
import useEditorStore from '@/store/modules/editor'
import { errorMessage, successMessage, warningMessage } from '@/common/message'
import { cloudSave } from '@/api/modules/cloudResume'
import { getLocalStorage, setLocalStorage } from '@/common/localstorage'
import { useRouter } from 'vue-router'
import { convertDOM, allOverlaysHTML } from '@/utils/moduleCombine'
import { importCSS } from '@/utils'

const props = defineProps<{ modelValue: boolean; resumeType: string }>()
const emit = defineEmits(['update:modelValue'])

const editorStore = useEditorStore()
const router = useRouter()
const visible = ref(false)
const langs = ['英文', '中文', '日语', '韩语', '法语', '德语', '西班牙语', '俄语']
const target = ref('英文')
const remaining = ref(3)
const translating = ref(false)
const translated = ref('') // 非空表示进入二次确认视图

watch(
  () => props.modelValue,
  async v => {
    visible.value = v
    translated.value = ''
    if (v) {
      try {
        const tk = token()
        const res = await fetch('/api/translate', {
          headers: { Authorization: `Bearer ${tk}` }
        })
        const data = await res.json()
        if (data.code === 200) remaining.value = data.data.remaining
        else remaining.value = 0
      } catch {
        remaining.value = 0
      }
    }
  }
)
watch(visible, v => emit('update:modelValue', v))

function token() {
  return (getLocalStorage('TOKEN') as string) || null
}

async function start() {
  const tk = token()
  if (!tk) return warningMessage('请先登录后再使用翻译')
  if (remaining.value <= 0) return warningMessage('今日翻译次数已用完')
  translating.value = true
  try {
    const res = await fetch('/api/translate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tk}` },
      body: JSON.stringify({ content: editorStore.MDContent, target: target.value })
    })
    const data = await res.json()
    if (data.code !== 200) return warningMessage(data.msg || '翻译失败')
    translated.value = data.data.content
    remaining.value = data.data.remaining
    renderPreview()
  } catch (e) {
    errorMessage('翻译服务暂不可用')
    console.error(e)
  } finally {
    translating.value = false
  }
}

function apply() {
  editorStore.setMDContent(translated.value, props.resumeType)
  translated.value = ''
  visible.value = false
  successMessage('翻译已应用')
}

// 另存为：翻译结果保存为一份新简历（本地实例 + 云端），跳转编辑
async function saveAsNew() {
  if (!translated.value) return
  const newType = `${props.resumeType}~${Date.now().toString(36)}`
  setLocalStorage(mdContentKey(newType), translated.value)
  const tk = token()
  if (tk) {
    const res = await cloudSave({
      type: newType,
      content: translated.value,
      name: `${props.resumeType}-译文`
    })
    if (res.code === 200) successMessage('已另存为新简历（云端）')
  } else {
    successMessage('已另存为新简历（本地）')
  }
  translated.value = ''
  visible.value = false
  router.push(`/editor?type=${newType}`).then(() => location.reload())
}

// 生产同款「翻译结果预览」：渲染翻译后的简历效果（非 raw 文本）
const previewEl = ref<HTMLElement>()
async function renderPreview() {
  await nextTick()
  if (!previewEl.value || !translated.value) return
  const base = props.resumeType.split('~')[0]
  try {
    await importCSS(base)
  } catch {
    /* 皮肤加载失败仍预览内容 */
  }
  previewEl.value.innerHTML = convertDOM(translated.value).innerHTML + allOverlaysHTML(base)
}
</script>

<template>
  <Teleport to="body">
    <div v-if="visible" class="tl-mask" @click.self="visible = false">
      <div class="tl-dialog" v-if="!translated">
        <span class="tl-close" @click="visible = false">✕</span>
        <h3 class="tl-title">简历语言翻译</h3>
        <div class="tl-body">
          <div class="tl-label">请选择翻译的语言</div>
          <el-select v-model="target" style="width: 160px">
            <el-option v-for="l in langs" :key="l" :value="l" :label="l" />
          </el-select>
          <p class="tl-note">翻译后并不会直接替换，需要经过您的二次确认，可放心操作</p>
          <div class="tl-actions">
            <button class="btn primary tl-btn" :disabled="translating" @click="start">
              {{ translating ? '翻译中...' : '开始翻译' }}
            </button>
            <button class="btn tl-btn ghost" @click="visible = false">关闭</button>
          </div>
          <div class="tl-quota">
            剩余可用次数：<span>{{ remaining }} 次</span>
          </div>
        </div>
      </div>

      <div v-else class="tl-dialog tl-preview">
        <span class="tl-close" @click="visible = false">✕</span>
        <h3 class="tl-title">翻译结果预览</h3>
        <p class="tl-sub">翻译后的简历效果</p>
        <div class="tl-render">
          <div ref="previewEl" class="markdown-transform-html jufe"></div>
        </div>
        <p class="tl-note ok">翻译完成，请确认预览效果</p>
        <div class="tl-actions">
          <button class="btn primary tl-btn" @click="apply">替换简历内容</button>
          <button class="btn primary tl-btn save-as" @click="saveAsNew">另存为文件</button>
          <button class="btn tl-btn ghost" @click="translated = ''">取消翻译</button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<style lang="scss" scoped>
.tl-mask {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.45);
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
}
.tl-dialog {
  position: relative;
  width: 440px;
  max-width: 92vw;
  background: var(--background);
  border-radius: 12px;
  padding: 20px 30px;
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.15);
}
.tl-preview {
  width: 620px;
}
.tl-close {
  position: absolute;
  top: 14px;
  right: 14px;
  font-size: 15px;
  line-height: 18px;
  opacity: 0.55;
  cursor: pointer;
  &:hover {
    opacity: 0.9;
  }
}
.tl-title {
  font-size: 18px;
  font-weight: 700;
  margin-bottom: 18px;
}
.tl-label {
  font-size: 14px;
  margin-bottom: 10px;
}
.tl-note {
  margin-top: 14px;
  font-size: 13px;
  color: #e6a23c;
}
.tl-actions {
  display: flex;
  gap: 12px;
  margin-top: 18px;
}
.tl-btn {
  padding: 7px 20px;
  border-radius: 8px;
  font-size: 14px;
}
.save-as {
  background: var(--theme);
  color: #fff;
}
.tl-quota {
  margin-top: 14px;
  font-size: 13px;
  opacity: 0.7;
}
.tl-sub {
  font-size: 13px;
  color: #909399;
  margin: -10px 0 10px;
}
.tl-note.ok {
  color: #67c23a;
  margin-top: 10px;
}
.tl-render {
  max-height: 46vh;
  overflow: auto;
  border: 1px solid #e2e4e9;
  border-radius: 8px;
  background: #f5f5f5;
  .jufe {
    transform-origin: top left;
    transform: scale(0.52);
    width: 794px;
    margin: 0 auto;
    box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
  }
}
.tl-preview {
  width: 680px;
}
</style>
