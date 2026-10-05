<script setup lang="ts">
// 生产同款「简历保存历史记录」抽屉：el-drawer 340px + el-timeline 时间线 + 点击回滚
import { ref, watch } from 'vue'
import { cloudHistoryPage, cloudHistoryGet, cloudPush } from '@/api/modules/cloudResume'
import ToastModal from '@/components/toast-modal/toastModal.vue'
import useEditorStore from '@/store/modules/editor'
import { successMessage, warningMessage } from '@/common/message'

const props = defineProps<{ modelValue: boolean; resumeType: string }>()
const emit = defineEmits(['update:modelValue'])

interface VersionItem {
  _id: number
  id: string
  updateTime: number
}

const visible = ref(false)
const versions = ref<VersionItem[]>([])
const confirmItem = ref<VersionItem | null>(null)
const editorStore = useEditorStore()

watch(
  () => props.modelValue,
  async v => {
    visible.value = v
    if (v) versions.value = await cloudHistoryPage(props.resumeType)
  }
)
watch(visible, v => emit('update:modelValue', v))

function fmt(ts: number) {
  const d = new Date(ts)
  const p = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(
    d.getMinutes()
  )}:${p(d.getSeconds())}`
}

function timeAgo(ts: number) {
  const diff = Date.now() - ts
  const min = Math.floor(diff / 60000)
  if (min < 1) return '刚刚'
  if (min < 60) return `${min} 分钟前`
  const hour = Math.floor(min / 60)
  if (hour < 24) return `${hour} 小时前`
  const day = Math.floor(hour / 24)
  if (day < 30) return `${day} 天前`
  const month = Math.floor(day / 30)
  if (month < 12) return `${month} 个月前`
  return `${Math.floor(month / 12)} 年前`
}

async function confirmRollback() {
  const item = confirmItem.value
  confirmItem.value = null
  if (!item) return
  const data = await cloudHistoryGet(item._id)
  if (!data) return warningMessage('版本读取失败')
  editorStore.setMDContent(data.content, props.resumeType)
  cloudPush(props.resumeType, data.content)
  successMessage('已回滚至该版本')
  visible.value = false
}
</script>

<template>
  <el-drawer v-model="visible" direction="rtl" :size="340" :with-header="false">
    <div class="hist-body">
      <div class="hist-title">
        <h4>简历保存历史记录</h4>
        <sub>（显示近一年的保存记录）</sub>
      </div>
      <ul class="el-timeline">
        <el-tooltip
          v-for="v in versions"
          :key="v._id"
          content="点击回滚该版本"
          placement="left"
          effect="light"
        >
          <li class="el-timeline-item hist-item" @click="confirmItem = v">
            <div class="hist-line">保存于 {{ timeAgo(v.updateTime) }}</div>
            <div class="hist-ver">
              <span class="hist-tag">版本号</span>
              <span class="hist-id">{{ v._id }}</span>
            </div>
            <div class="hist-ts">{{ fmt(v.updateTime) }}</div>
          </li>
        </el-tooltip>
      </ul>
      <p v-if="!versions.length" class="hist-empty">暂无历史版本，保存简历后自动生成</p>
    </div>
  </el-drawer>

  <ToastModal v-if="confirmItem" :flag="!!confirmItem" @close="confirmItem = null" width="440px">
    <h4 class="rollback-title">
      是否将 {{ confirmItem ? timeAgo(confirmItem.updateTime) : '' }}编写的版本作为您的最新版本？
    </h4>
    <p class="rollback-warn">
      该操作会覆盖当前简历内容，如果当前内容还未保存建议先保存，方便后续回滚。
    </p>
    <div class="rollback-btns">
      <button class="btn primary cursor hover" @click="confirmRollback">确认</button>
      <button class="btn cursor hover" @click="confirmItem = null">取消</button>
    </div>
  </ToastModal>
</template>

<style lang="scss" scoped>
.hist-body {
  padding: 16px 12px;
}
.hist-title {
  display: flex;
  align-items: baseline;
  margin-bottom: 14px;
  h4 {
    font-size: 15px;
    font-weight: 700;
  }
  sub {
    color: #a1a5ac;
    font-size: 12px;
    margin-left: 4px;
  }
}
.hist-item {
  cursor: pointer;
  padding: 6px 0;
  border-radius: 6px;
  &:hover {
    background: rgba(0, 0, 0, 0.03);
  }
  .hist-line {
    font-size: 14px;
    line-height: 24px;
  }
  .hist-ver {
    display: flex;
    align-items: center;
    gap: 8px;
    color: #a1a5ac;
    font-size: 12px;
    margin-top: 4px;
    .hist-tag {
      font-size: 12px;
    }
  }
  .hist-ts {
    color: #a1a5ac;
    font-size: 12px;
    margin-top: 2px;
  }
}
.hist-empty {
  color: #a1a5ac;
  font-size: 13px;
  margin-top: 20px;
}
.rollback-title {
  font-size: 16px;
  font-weight: 700;
  margin-bottom: 12px;
}
.rollback-warn {
  font-size: 14px;
  color: var(--font-color);
  opacity: 0.75;
  line-height: 1.6;
  margin-bottom: 18px;
}
.rollback-btns {
  display: flex;
  gap: 12px;
}
</style>
