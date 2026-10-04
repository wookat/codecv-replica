<script setup lang="ts">
import { ref, watch } from 'vue'
import useEditorStore from '@/store/modules/editor'
import { scanContent, ProofreadIssue } from './proofread'
import { successMessage } from '@/common/message'
import { useRoute } from 'vue-router'

const props = defineProps<{ modelValue: boolean }>()
const emit = defineEmits(['update:modelValue'])

const editorStore = useEditorStore()
const route = useRoute()
const visible = ref(props.modelValue)
const issues = ref<ProofreadIssue[]>([])

watch(
  () => props.modelValue,
  v => {
    visible.value = v
    if (v) issues.value = scanContent(editorStore.MDContent || '')
  }
)
watch(visible, v => emit('update:modelValue', v))

function fix(issue: ProofreadIssue) {
  if (!issue.right) return
  const md = editorStore.MDContent
  const idx = md.indexOf(issue.wrong, issue.index)
  const at = idx === -1 ? md.indexOf(issue.wrong) : idx
  if (at === -1) return
  editorStore.setMDContent(
    md.slice(0, at) + issue.right + md.slice(at + issue.wrong.length),
    String(route.query.type || '')
  )
  issues.value = issues.value.filter(i => i !== issue)
  successMessage('已替换')
}
function ignore(issue: ProofreadIssue) {
  issues.value = issues.value.filter(i => i !== issue)
}
</script>

<template>
  <el-drawer v-model="visible" title="错别字检查" size="360px" class="proofread-drawer">
    <div v-if="!issues.length" class="empty">未发现问题，简历用词规范</div>
    <div v-for="(issue, i) in issues" :key="i" class="issue">
      <div class="issue-msg">{{ issue.msg }}</div>
      <div class="issue-ctx">…{{ issue.ctx }}…</div>
      <div class="issue-ops">
        <button v-if="issue.right" class="fix" @click="fix(issue)">
          修改为「{{ issue.right }}」
        </button>
        <button class="ignore" @click="ignore(issue)">忽略</button>
      </div>
    </div>
  </el-drawer>
</template>

<style lang="scss" scoped>
.empty {
  color: #909399;
  text-align: center;
  margin-top: 40px;
}
.issue {
  border-bottom: 1px solid #eee;
  padding: 12px 0;
  .issue-msg {
    color: #e64545;
    font-size: 13px;
    font-weight: 600;
  }
  .issue-ctx {
    color: #909399;
    font-size: 12px;
    margin: 6px 0;
    word-break: break-all;
  }
  .issue-ops {
    display: flex;
    gap: 8px;
    button {
      border: 1px solid #ddd;
      background: #fff;
      border-radius: 4px;
      padding: 3px 10px;
      font-size: 12px;
      cursor: pointer;
      &.fix {
        color: var(--theme);
        border-color: var(--theme);
      }
      &.ignore {
        color: #909399;
      }
    }
  }
}
</style>
