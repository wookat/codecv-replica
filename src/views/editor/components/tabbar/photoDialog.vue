<script setup lang="ts">
// 生产同款证件照/校徽弹层：上传→形状选择(证件照)→确认；
// 已配置时展示预览 + 更换/重置位置/重置尺寸/删除操作；大小限制 非会员2MB/会员10MB
import { ref, watch, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useRouter } from 'vue-router'
import { getLocalStorage, setLocalStorage, removeLocalStorage } from '@/common/localstorage'
import { fetchUserInfo } from '@/api/modules/cloudResume'
import { refreshOverlays } from '@/utils/moduleCombine'
import { currentUser } from '@/utils/auth'

const props = defineProps<{
  modelValue: boolean
  kind: 'avatar' | 'badge'
  resumeType: string
}>()
const emit = defineEmits(['update:modelValue'])

const noop = () => undefined
const router = useRouter()
const visible = ref(false)
const member = ref(false)
const uploadMB = ref(0.2)

// 形状（对照生产）：证件照 矩形/圆角矩形/圆形/长条形；校徽仅 长条形/圆形
const SHAPES = computed(() =>
  props.kind === 'badge'
    ? [
        { key: 'square', label: '长条形' },
        { key: 'circle', label: '圆形' }
      ]
    : [
        { key: 'square', label: '矩形' },
        { key: 'round-square', label: '圆角矩形' },
        { key: 'circle', label: '圆形' },
        { key: 'banner', label: '长条形' }
      ]
)
const cfgKey = computed(() =>
  props.kind === 'avatar' ? `avatar-cfg-${props.resumeType}` : `badge_config-${props.resumeType}`
)

interface Cfg {
  url: string
  top: number
  left: number
  width?: number
  shape?: string
}
const cfg = ref<Cfg | null>(null)
const picked = ref<{ url: string; shape: string } | null>(null) // 待确认的新上传

const loadCfg = () => {
  try {
    const raw = getLocalStorage(cfgKey.value) as string | null
    cfg.value = raw ? JSON.parse(raw) : null
  } catch {
    cfg.value = null
  }
}

watch(
  () => props.modelValue,
  async v => {
    visible.value = v
    picked.value = null
    if (v) {
      loadCfg()
      const info = await fetchUserInfo()
      member.value = (info?.member_expires || 0) > Date.now()
      uploadMB.value = Number(info?.uploadMB) || 0.2
    }
  }
)
watch(visible, v => emit('update:modelValue', v))

const title = computed(() => (props.kind === 'avatar' ? '证件照' : '校徽'))
// 限额（生产矩阵）：非会员 200KB，月/季/年会员 2MB，终身会员 10MB（由 /user/info 下发）
const sizeLimit = computed(() => uploadMB.value)
const limitLabel = computed(() => (sizeLimit.value < 1 ? '200KB' : `${sizeLimit.value}MB`))

function pick(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0]
  ;(e.target as HTMLInputElement).value = ''
  if (!file) return
  if (file.size > sizeLimit.value * 1024 * 1024) {
    ElMessageBox.confirm(
      `普通用户上传图片不能大于 ${limitLabel.value}${member.value ? '' : '，会员可上传 2MB'}`,
      '文件过大',
      member.value
        ? { confirmButtonText: '知道了', showCancelButton: false }
        : {
            confirmButtonText: '升级会员',
            cancelButtonText: '取消'
          }
    )
      .then(() => {
        if (!member.value) router.push('/member')
      })
      .catch(noop)
    return
  }
  const reader = new FileReader()
  reader.onload = ev => {
    picked.value = {
      url: String(ev.target?.result || ''),
      shape: cfg.value?.shape || 'square'
    }
  }
  reader.readAsDataURL(file)
}

function confirm() {
  if (!picked.value?.url) return
  const prev = cfg.value
  const next: Cfg = {
    url: picked.value.url,
    top: prev?.top ?? (props.kind === 'avatar' ? 30 : 10),
    left: prev?.left ?? (props.kind === 'avatar' ? 660 : 10),
    width: prev?.width,
    shape: picked.value.shape
  }
  setLocalStorage(cfgKey.value, JSON.stringify(next))
  cfg.value = next
  picked.value = null
  refreshOverlays(props.resumeType)
  ElMessage.success(`${title.value}已设置`)
  visible.value = false
}

function resetPos() {
  if (!cfg.value) return
  cfg.value.top = props.kind === 'avatar' ? 30 : 10
  cfg.value.left = props.kind === 'avatar' ? 660 : 10
  setLocalStorage(cfgKey.value, JSON.stringify(cfg.value))
  refreshOverlays(props.resumeType)
  ElMessage.success('已重置位置')
}

function resetSize() {
  if (!cfg.value) return
  delete cfg.value.width
  setLocalStorage(cfgKey.value, JSON.stringify(cfg.value))
  refreshOverlays(props.resumeType)
  ElMessage.success('已重置尺寸')
}

function remove() {
  ElMessageBox.confirm(`确定删除${title.value}吗？`, '删除', { type: 'warning' })
    .then(() => {
      removeLocalStorage(cfgKey.value)
      cfg.value = null
      refreshOverlays(props.resumeType)
      ElMessage.success('已删除')
    })
    .catch(noop)
}
</script>

<template>
  <el-dialog v-model="visible" :title="title" width="460px" class="photo-dialog">
    <div v-if="!currentUser()" class="pd-tip">
      未登录也可以使用，图片仅保存在当前浏览器；登录后随简历云端保存
    </div>

    <!-- 待确认视图：预览 + 形状选择 -->
    <template v-if="picked">
      <div class="pd-preview">
        <img :src="picked.url" :class="`shape-${picked.shape}`" alt="预览" />
      </div>
      <div v-if="kind === 'avatar'" class="pd-shapes">
        <button
          v-for="s in SHAPES"
          :key="s.key"
          class="shape-btn"
          :class="{ on: picked.shape === s.key }"
          @click="picked && (picked.shape = s.key)"
        >
          <i class="shape-demo" :class="`shape-${s.key}`"></i>
          {{ s.label }}
        </button>
      </div>
      <div class="pd-actions">
        <button class="btn primary" @click="confirm">确认使用</button>
        <button class="btn" @click="picked = null">重选</button>
      </div>
    </template>

    <!-- 已配置视图：预览 + 操作 -->
    <template v-else-if="cfg">
      <div class="pd-preview">
        <img :src="cfg.url" :class="`shape-${cfg.shape || 'square'}`" alt="当前" />
      </div>
      <p class="pd-hint">可在简历上拖拽{{ title }}调整位置；拖右下角可缩放</p>
      <div class="pd-actions wrap">
        <label class="btn ghost">
          更换图片
          <input type="file" accept=".png,.jpg,.jpeg,.webp" class="hidden" @change="pick" />
        </label>
        <button class="btn ghost" @click="resetPos">重置位置</button>
        <button class="btn ghost" @click="resetSize">重置尺寸</button>
        <button class="btn danger" @click="remove">删除</button>
      </div>
    </template>

    <!-- 空态：上传 -->
    <template v-else>
      <label class="pd-upload">
        <input type="file" accept=".png,.jpg,.jpeg,.webp" class="hidden" @change="pick" />
        <div class="up-inner">
          <span class="up-plus">+</span>
          <span>点击上传{{ title }}</span>
          <span class="up-limit"
            >支持 PNG/JPG/WebP，最大 {{ limitLabel }}{{ member ? '' : '（会员 2MB）' }}</span
          >
        </div>
      </label>
    </template>
  </el-dialog>
</template>

<style lang="scss" scoped>
.pd-tip {
  font-size: 12px;
  color: #909399;
  margin-bottom: 12px;
}
.pd-preview {
  display: flex;
  justify-content: center;
  background: repeating-conic-gradient(#eee 0% 25%, #fff 0% 50%) 0 0 / 16px 16px;
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 14px;
  img {
    max-width: 180px;
    max-height: 220px;
    object-fit: cover;
    display: block;
  }
}
.shape-square {
  border-radius: 0;
}
.shape-round-square {
  border-radius: 10px;
}
.shape-circle {
  border-radius: 50%;
}
.shape-banner {
  border-radius: 999px;
}
.pd-shapes {
  display: flex;
  gap: 10px;
  justify-content: center;
  margin-bottom: 16px;
  .shape-btn {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 6px;
    border: 1px solid #e2e4e9;
    background: #fff;
    border-radius: 8px;
    padding: 10px 8px;
    font-size: 12px;
    cursor: pointer;
    color: var(--font-color);
    &.on {
      border-color: var(--theme);
      color: var(--theme);
    }
    .shape-demo {
      display: block;
      width: 36px;
      height: 36px;
      background: #ddd;
      &.shape-banner {
        height: 20px;
        margin-top: 8px;
      }
    }
  }
}
.pd-hint {
  font-size: 12px;
  color: #909399;
  margin: 0 0 12px;
  text-align: center;
}
.pd-actions {
  display: flex;
  gap: 10px;
  justify-content: center;
  &.wrap {
    flex-wrap: wrap;
  }
}
.btn {
  border: none;
  border-radius: 8px;
  padding: 8px 18px;
  font-size: 14px;
  cursor: pointer;
  background: #f2f3f5;
  color: var(--font-color);
  &.primary {
    background: var(--theme);
    color: #fff;
  }
  &.ghost {
    border: 1px solid #e2e4e9;
    background: #fff;
  }
  &.danger {
    color: #f56c6c;
    border: 1px solid #fbc4c4;
    background: #fff;
  }
}
.pd-upload {
  display: block;
  border: 1.5px dashed #dcdfe6;
  border-radius: 10px;
  cursor: pointer;
  &:hover {
    border-color: var(--theme);
  }
  .up-inner {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8px;
    padding: 36px 0;
    font-size: 14px;
    color: var(--font-color);
    .up-plus {
      font-size: 30px;
      color: var(--theme);
      line-height: 1;
    }
    .up-limit {
      font-size: 12px;
      color: #909399;
    }
  }
}
.hidden {
  display: none;
}
</style>
