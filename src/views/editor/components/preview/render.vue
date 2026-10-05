<script setup lang="ts">
import TabBar from '../tabbar/tabbar.vue'
import { useRenderHTML, useResumeType } from '../../hook'
import { useThemeConfig } from '@/common/global'
import { step, pageSize, fitStepToWidth } from '../tabbar/hook'
import { onMounted, onUnmounted, ref } from 'vue'

defineEmits(['upload-avatar', 'html-convert'])

const { resumeType } = useResumeType()
const { isDark } = useThemeConfig()
const { renderDOM } = useRenderHTML(resumeType)

const outerEl = ref<HTMLElement>()
let ro: ResizeObserver | undefined
onMounted(() => {
  if (!outerEl.value) return
  fitStepToWidth(outerEl.value.clientWidth)
  ro = new ResizeObserver(entries => fitStepToWidth(entries[0].contentRect.width))
  ro.observe(outerEl.value)
})
onUnmounted(() => ro?.disconnect())
</script>

<template>
  <div ref="outerEl" class="outer" :style="{ background: isDark ? '#282c34' : 'var(--bg-theme)' }">
    <TabBar
      @html-convert="cnt => $emit('html-convert', cnt)"
      @upload-avatar="path => $emit('upload-avatar', path)"
    />
    <div ref="renderDOM" class="markdown-transform-html jufe reference-dom"></div>
    <!-- 分页渲染区域 -->
    <div
      class="re-render"
      :style="{
        transform: `translateY(-${((100 - step) / 100) * 1123 * (pageSize / 2)}px) scale(${
          step / 100
        })`
      }"
    ></div>
  </div>
</template>

<style lang="scss" scoped>
.outer {
  height: 100vh;
  overflow: auto;
  background: var(--bg-theme);

  .re-render {
    transition: transform 0.3s;
  }
}

.jufe {
  position: absolute;
  left: -9990px;
  top: -9990px;
}
</style>
