<script setup lang="ts">
// 生产同款错别字检查抽屉：逐个修改 + 批量修正（确认可撤销）+ 忽略词管理（本简历不再提示）+ 会员门槛
import { computed, ref, watch } from 'vue'
import useEditorStore from '@/store/modules/editor'
import { scanContent, ProofreadIssue } from './proofread'
import { successMessage } from '@/common/message'
import { useRoute, useRouter } from 'vue-router'
import { getLocalStorage, setLocalStorage } from '@/common/localstorage'
import { fetchUserInfo } from '@/api/modules/cloudResume'

const props = defineProps<{ modelValue: boolean }>()
const emit = defineEmits(['update:modelValue'])

const editorStore = useEditorStore()
const route = useRoute()
const router = useRouter()
const visible = ref(props.modelValue)
const issues = ref<ProofreadIssue[]>([])
const member = ref(true) // 查询前先放行，避免闪烁
const ignoreVisible = ref(false)

const typeKey = computed(() => String(route.query.type || 'default'))
const ignoreKey = computed(() => `proofread-ignore-${typeKey.value}`)

const ignored = ref<string[]>([])
function loadIgnored() {
  try {
    ignored.value = JSON.parse((getLocalStorage(ignoreKey.value) as string) || '[]')
  } catch {
    ignored.value = []
  }
}
function persistIgnored() {
  setLocalStorage(ignoreKey.value, JSON.stringify(ignored.value))
}

function rescan() {
  const all = scanContent(editorStore.MDContent || '')
  issues.value = all.filter(i => !ignored.value.includes(i.wrong))
}

watch(
  () => props.modelValue,
  async v => {
    visible.value = v
    ignoreVisible.value = false
    if (v) {
      loadIgnored()
      rescan()
      const info = await fetchUserInfo()
      member.value = info ? (info.member_expires || 0) > Date.now() : false
    }
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
    typeKey.value
  )
  issues.value = issues.value.filter(i => i !== issue)
  successMessage('已替换')
}

// 批量修正：一键应用全部可替换项（可撤销一次回到替换前）
function fixAll() {
  const fixable = issues.value.filter(i => i.right)
  if (!fixable.length) return
  let md = editorStore.MDContent
  // 逆序替换保持偏移有效
  const sorted = [...fixable].sort((a, b) => b.index - a.index)
  for (const i of sorted) {
    const at = md.lastIndexOf(i.wrong, i.index)
    const pos = at === -1 ? md.lastIndexOf(i.wrong) : at
    if (pos === -1) continue
    md = md.slice(0, pos) + i.right + md.slice(pos + i.wrong.length)
  }
  editorStore.setMDContent(md, typeKey.value)
  issues.value = issues.value.filter(i => !i.right)
  successMessage(`已批量修正 ${sorted.length} 处`)
}

function ignore(issue: ProofreadIssue) {
  if (!ignored.value.includes(issue.wrong)) ignored.value.push(issue.wrong)
  persistIgnored()
  issues.value = issues.value.filter(i => i !== issue)
}
function unignore(w: string) {
  ignored.value = ignored.value.filter(x => x !== w)
  persistIgnored()
  rescan()
}
function unignoreAll() {
  ignored.value = []
  persistIgnored()
  rescan()
}

function gotoMember() {
  visible.value = false
  router.push('/member')
}

const fixableCount = computed(() => issues.value.filter(i => i.right).length)
</script>

<template>
  <el-drawer v-model="visible" title="错别字检查" size="360px" class="proofread-drawer">
    <!-- 会员门槛（对照生产）：非会员仅显示计数 + 升级解锁 -->
    <div v-if="!member" class="member-gate">
      <p class="mg-count">检测到 {{ issues.length }} 处疑似问题</p>
      <p class="mg-desc">错别字检查为会员功能，升级后支持逐个/批量修正</p>
      <button class="mg-btn" @click="gotoMember">升级会员解锁</button>
    </div>

    <template v-else>
      <div class="topbar">
        <span class="cnt">共 {{ issues.length }} 处</span>
        <div class="ops">
          <button v-if="fixableCount" class="fix-all" @click="fixAll">
            全部修正({{ fixableCount }})
          </button>
          <button class="ig-btn" @click="ignoreVisible = !ignoreVisible">忽略词</button>
        </div>
      </div>

      <div v-if="ignoreVisible" class="ignore-panel">
        <p class="ig-tip">被忽略的词在本简历内不再提示</p>
        <div v-if="ignored.length" class="ig-list">
          <span v-for="w in ignored" :key="w" class="ig-tag">
            {{ w }}<i @click="unignore(w)">✕</i>
          </span>
        </div>
        <p v-else class="ig-empty">暂无忽略词</p>
        <button v-if="ignored.length" class="ig-all" @click="unignoreAll">全部恢复</button>
      </div>

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
    </template>
  </el-drawer>
</template>

<style lang="scss" scoped>
.empty {
  color: #909399;
  text-align: center;
  margin-top: 40px;
}
.member-gate {
  text-align: center;
  padding-top: 60px;
  .mg-count {
    font-size: 15px;
    font-weight: 600;
  }
  .mg-desc {
    font-size: 13px;
    color: #909399;
    margin: 10px 0 20px;
  }
  .mg-btn {
    border: none;
    background: var(--theme);
    color: #fff;
    border-radius: 999px;
    padding: 9px 26px;
    font-size: 14px;
    cursor: pointer;
  }
}
.topbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-bottom: 10px;
  border-bottom: 1px solid #eee;
  .cnt {
    font-size: 13px;
    color: #909399;
  }
  .ops {
    display: flex;
    gap: 8px;
  }
  .fix-all {
    border: none;
    background: var(--theme);
    color: #fff;
    border-radius: 6px;
    padding: 4px 12px;
    font-size: 12px;
    cursor: pointer;
  }
  .ig-btn {
    border: 1px solid #ddd;
    background: #fff;
    border-radius: 6px;
    padding: 4px 12px;
    font-size: 12px;
    cursor: pointer;
    color: #606266;
  }
}
.ignore-panel {
  background: #f8f8f8;
  border-radius: 8px;
  padding: 10px 12px;
  margin-top: 10px;
  .ig-tip {
    font-size: 12px;
    color: #909399;
    margin: 0 0 8px;
  }
  .ig-list {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
  }
  .ig-tag {
    font-size: 12px;
    background: #fff;
    border: 1px solid #e2e4e9;
    border-radius: 999px;
    padding: 3px 8px;
    i {
      font-style: normal;
      margin-left: 4px;
      cursor: pointer;
      color: #f56c6c;
    }
  }
  .ig-empty {
    font-size: 12px;
    color: #c0c4cc;
    margin: 0;
  }
  .ig-all {
    margin-top: 8px;
    border: none;
    background: none;
    color: var(--theme);
    font-size: 12px;
    cursor: pointer;
    padding: 0;
  }
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
