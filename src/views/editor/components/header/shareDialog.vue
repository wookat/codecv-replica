<script setup lang="ts">
// 生产同款分享弹层：公开访问开关 + 分享链接 + 被查看次数 + 复制
import { ref, watch, computed } from 'vue'
import { ElMessage } from 'element-plus'
import { shareState, shareToggle } from '@/api/modules/share'
import { currentUser } from '@/utils/auth'

const props = defineProps<{ modelValue: boolean; resumeType: string; resumeName: string }>()
const emit = defineEmits(['update:modelValue'])

const visible = ref(false)
const isPublic = ref(false)
const viewNum = ref(0)
const loading = ref(false)
const logged = computed(() => !!currentUser())
const link = computed(() => `${location.origin}/#/share/${props.resumeType}`)

watch(
  () => props.modelValue,
  async v => {
    visible.value = v
    if (v && logged.value) {
      const res = await shareState(props.resumeType)
      if (res?.code === 200) {
        isPublic.value = !!res.data.isPublic
        viewNum.value = res.data.viewNum || 0
      }
    }
  }
)
watch(visible, v => emit('update:modelValue', v))

async function toggle(v: boolean) {
  loading.value = true
  const res = await shareToggle(props.resumeType, v)
  loading.value = false
  if (res?.code !== 200) {
    isPublic.value = !v
    return ElMessage.error(res?.msg || '设置失败')
  }
  ElMessage.success(v ? '简历已公开' : '已取消公开')
}

async function copyLink() {
  try {
    await navigator.clipboard.writeText(link.value)
    ElMessage.success('分享链接已复制')
  } catch {
    ElMessage.info(link.value)
  }
}
</script>

<template>
  <el-dialog v-model="visible" title="分享简历" width="440px" class="share-dialog">
    <div v-if="!logged" class="need-login">请先登录后再使用分享</div>
    <template v-else>
      <div class="row">
        <span>公开访问</span>
        <el-switch
          v-model="isPublic"
          :loading="loading"
          active-text="已公开"
          inactive-text="未公开"
          inline-prompt
          @change="(v: string | number | boolean) => toggle(!!v)"
        />
      </div>
      <template v-if="isPublic">
        <div class="row link-row">
          <input
            class="link"
            :value="link"
            readonly
            @focus=";($event.target as HTMLInputElement).select()"
          />
          <button class="copy" @click="copyLink">复制链接</button>
        </div>
        <p class="hint">
          该简历已被查看 <b>{{ viewNum }}</b> 次，任何获得链接的人都可以查看
        </p>
      </template>
      <p v-else class="hint">
        开启公开访问后，任何获得链接的人都可以查看该简历（实时同步最新内容）
      </p>
    </template>
  </el-dialog>
</template>

<style lang="scss" scoped>
.need-login {
  text-align: center;
  color: #909399;
  padding: 24px 0;
}
.row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 14px;
  font-size: 14px;
}
.link-row {
  gap: 10px;
  .link {
    flex: 1;
    min-width: 0;
    border: 1px solid #e2e4e9;
    border-radius: 6px;
    padding: 7px 10px;
    font-size: 13px;
    color: #606266;
    background: #f8f8f8;
  }
  .copy {
    border: none;
    background: var(--theme);
    color: #fff;
    border-radius: 6px;
    padding: 7px 14px;
    font-size: 13px;
    cursor: pointer;
    white-space: nowrap;
  }
}
.hint {
  font-size: 12px;
  color: #909399;
  margin: 4px 0 0;
  b {
    color: var(--theme);
  }
}
</style>
