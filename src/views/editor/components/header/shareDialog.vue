<script setup lang="ts">
// 生产同款分享弹层：公开访问开关 + 分享链接 + 被查看次数 + 复制
import { mdContentKey } from '@/common/storageKeys'
import { ref, watch, computed } from 'vue'
import { ElMessage } from 'element-plus'
import { shareState, shareToggle } from '@/api/modules/share'
import { currentUser } from '@/utils/auth'
import { cloudSaveNow } from '@/api/modules/cloudResume'
import { getLocalStorage } from '@/common/localstorage'

const props = defineProps<{ modelValue: boolean; resumeType: string; resumeName: string }>()
const emit = defineEmits(['update:modelValue'])

const visible = ref(false)
const isPublic = ref(false)
const viewNum = ref(0)
const loading = ref(false)
const logged = computed(() => !!currentUser())
const link = computed(() => `${location.origin}/share/${props.resumeType}`)

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
  // 开启分享前先把当前内容写云端——未保存过云端的简历开分享会得到死链
  if (v) {
    const content = getLocalStorage(mdContentKey(props.resumeType)) as string
    const saved = await cloudSaveNow(props.resumeType, content || '')
    if (saved?.code !== 200) {
      loading.value = false
      isPublic.value = false
      return ElMessage.error(saved?.msg || '请先保存简历再分享')
    }
  }
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
  <!-- 生产同款「简历分享」弹层：公开访问 / 被查看次数 / 分享链接 -->
  <el-dialog v-model="visible" title="简历分享" width="360px" class="share-dialog">
    <div v-if="!logged" class="need-login">请先登录后再使用分享</div>
    <template v-else>
      <div class="row">
        <span>公开访问</span>
        <el-switch
          v-model="isPublic"
          :loading="loading"
          @change="(v: string | number | boolean) => toggle(!!v)"
        />
      </div>
      <div class="row">
        <span>被查看</span>
        <span>{{ viewNum }} 次</span>
      </div>
      <div class="row link-row">
        <span>分享链接</span>
        <a class="link" :href="link" target="_blank" rel="noopener noreferrer">{{ link }}</a>
        <i class="iconfont icon-copy copy-ic" title="复制链接" @click="copyLink"></i>
      </div>
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
  gap: 8px;
  justify-content: flex-start;
  .link {
    flex: 1;
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    font-size: 13px;
    color: var(--theme);
    text-decoration: none;
  }
  .copy-ic {
    font-size: 15px;
    color: #909399;
    cursor: pointer;
    &:hover {
      color: var(--theme);
    }
  }
}
</style>
