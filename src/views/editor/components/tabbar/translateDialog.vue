<script setup lang="ts">
// 生产同款「简历语言翻译」弹层：选语言 → 开始翻译 → 二次确认后应用
import { ref, watch } from 'vue'
import useEditorStore from '@/store/modules/editor'
import { errorMessage, successMessage, warningMessage } from '@/common/message'

const props = defineProps<{ modelValue: boolean; resumeType: string }>()
const emit = defineEmits(['update:modelValue'])

const editorStore = useEditorStore()
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
        const token = localStorage.getItem('token')
        const raw = token ? JSON.parse(token) : null
        const tk = raw?.value || raw
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
  const raw = localStorage.getItem('token')
  if (!raw) return null
  try {
    const p = JSON.parse(raw)
    return p.value || p
  } catch {
    return raw
  }
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
        <h3 class="tl-title">翻译预览（确认后替换）</h3>
        <pre class="tl-content">{{ translated }}</pre>
        <div class="tl-actions">
          <button class="btn primary tl-btn" @click="apply">应用翻译</button>
          <button class="btn tl-btn ghost" @click="translated = ''">返回</button>
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
.tl-quota {
  margin-top: 14px;
  font-size: 13px;
  opacity: 0.7;
}
.tl-content {
  max-height: 46vh;
  overflow: auto;
  font-size: 13px;
  line-height: 1.7;
  white-space: pre-wrap;
  word-break: break-word;
  background: rgba(0, 0, 0, 0.04);
  border-radius: 8px;
  padding: 12px;
}
</style>
