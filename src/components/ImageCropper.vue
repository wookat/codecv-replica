<script setup lang="ts">
// prod 同款 croppie 图片裁剪弹层：选图→裁剪（拖动/滚轮缩放/旋转）→导出 blob 上传
import { onBeforeUnmount, onMounted, ref } from 'vue'
import Croppie from 'croppie'
import 'croppie/croppie.css'
import { RotateCcw, RotateCw, ZoomIn, ZoomOut } from 'lucide-vue-next'

const props = defineProps<{ src: string; viewport?: { width: number; height: number } }>()
const emit = defineEmits<{ (e: 'done', blob: Blob): void; (e: 'cancel'): void }>()

const el = ref<HTMLElement>()
let crop: Croppie | null = null

onMounted(() => {
  if (!el.value) return
  crop = new Croppie(el.value, {
    viewport: props.viewport ?? { width: 220, height: 220 },
    boundary: { width: 320, height: 300 },
    enableOrientation: true,
    enableZoom: true,
    mouseWheelZoom: 'ctrl'
  })
  crop.bind({ url: props.src })
})
onBeforeUnmount(() => crop?.destroy())

function rotate(deg: 90 | -90) {
  crop?.rotate(deg)
}
function zoom(delta: number) {
  const z = (crop?.get().zoom ?? 0) + delta
  crop?.setZoom(z)
}
async function confirm() {
  if (!crop) return
  const blob = (await crop.result({ type: 'blob', size: 'viewport', format: 'png' })) as Blob
  emit('done', blob)
}
</script>

<template>
  <div class="img-crop-mask" @click.self="emit('cancel')">
    <div class="img-crop-card floating-shadow">
      <div class="crop-title">裁剪图片</div>
      <div ref="el" class="crop-stage" />
      <div class="crop-ops">
        <button class="crop-btn" title="逆时针旋转" @click="rotate(-90)">
          <RotateCcw :size="16" />
        </button>
        <button class="crop-btn" title="顺时针旋转" @click="rotate(90)">
          <RotateCw :size="16" />
        </button>
        <button class="crop-btn" title="放大" @click="zoom(0.2)"><ZoomIn :size="16" /></button>
        <button class="crop-btn" title="缩小" @click="zoom(-0.2)"><ZoomOut :size="16" /></button>
        <span class="crop-flex" />
        <button class="crop-cancel" @click="emit('cancel')">取消</button>
        <button class="crop-ok" @click="confirm">确定</button>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.img-crop-mask {
  position: fixed;
  inset: 0;
  z-index: 3000;
  background: rgba(0, 0, 0, 0.45);
  display: flex;
  align-items: center;
  justify-content: center;
}
.img-crop-card {
  background: #fff;
  border-radius: 8px;
  padding: 14px 16px;
}
.crop-title {
  font-size: 14px;
  font-weight: 600;
  margin-bottom: 10px;
}
.crop-stage {
  width: 320px;
}
.crop-ops {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-top: 12px;
}
.crop-btn {
  width: 28px;
  height: 28px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: 1px solid #ddd;
  border-radius: 4px;
  background: #fff;
  cursor: pointer;
  color: #444;
  &:hover {
    background: #f5f5f5;
  }
}
.crop-flex {
  flex: 1;
}
.crop-cancel,
.crop-ok {
  padding: 5px 14px;
  border-radius: 4px;
  font-size: 13px;
  cursor: pointer;
}
.crop-cancel {
  border: 1px solid #ddd;
  background: #fff;
}
.crop-ok {
  border: none;
  background: var(--theme, #1e80ff);
  color: #fff;
}
</style>
