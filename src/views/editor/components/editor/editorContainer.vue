<script setup lang="ts">
import { computed } from 'vue'
import RichEditor from './rich-editor/editor.vue'
import MDEditor from './md-editor/editor.vue'
import useEditorStore from '@/store/modules/editor'
import { useResumeType, useAvatar } from '../../hook'
import {
  reactiveWritable,
  useMoveLayout,
  injectWritableModeAvatarEvent,
  useOverlayDrag
} from './hook'

const { resumeType } = useResumeType()
const { left, down } = useMoveLayout()

const { setAvatar } = useAvatar(resumeType.value)
const { writable } = reactiveWritable(resumeType.value)

injectWritableModeAvatarEvent(writable, setAvatar)
useOverlayDrag(resumeType)

const editorStore = useEditorStore()
// 生产版双模式：编辑(所见即所得) / MD —— 右栏即常显预览，无独立预览丸
const mode = computed(() => (writable.value ? 'edit' : 'md'))
function setMode(m: 'edit' | 'md') {
  if (m === 'edit' && !writable.value) editorStore.setWritableMode(document.body)
  if (m === 'md' && writable.value) editorStore.setWritableMode(document.body)
}
</script>

<template>
  <div class="markdown-edit noto-sans-sc" :class="`mode-${mode}`">
    <div class="toggle-edit-mode">
      <button
        :class="{ active: mode === 'edit' }"
        title="切换到所见即所得模式"
        @click="setMode('edit')"
      >
        <i class="iconfont icon-write"></i>
      </button>
      <button
        :class="{ active: mode === 'md' }"
        title="切换到 Markdown 模式"
        @click="setMode('md')"
      >
        MD
      </button>
    </div>
    <RichEditor :left="left" v-if="writable" />
    <MDEditor :left="left" v-if="!writable" />
    <div class="move absolute" @mousedown="down">
      <span>.</span>
      <span>.</span>
      <span>.</span>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.markdown-edit {
  position: relative;
  border: none;
  outline: none;
  font-size: 15px;
  margin: 0 0 10px 10px;
  border-radius: 10px;
}
/* 生产同款模式胶囊：p-0.5 圆角全丸 黑5%底，按钮 w-8 h-6，激活=主题色白字 */
.toggle-edit-mode {
  position: absolute;
  top: 11px;
  right: 12px;
  z-index: 6;
  display: inline-flex;
  align-items: center;
  gap: 2px;
  padding: 2px;
  background: rgba(0, 0, 0, 0.05);
  border-radius: 999px;

  button {
    display: flex;
    align-items: center;
    justify-content: center;
    border: none;
    background: transparent;
    width: 32px;
    height: 24px;
    font-size: 11px;
    font-family: ui-monospace, monospace;
    font-weight: 700;
    border-radius: 999px;
    cursor: pointer;
    color: var(--font-color);

    i {
      font-size: 13px;
    }

    &.active {
      background: var(--theme);
      color: #fff;
    }
  }
}
.markdown-edit.mode-md .toggle-edit-mode {
  top: 8px;
}
.move {
  width: 10px;
  height: 100%;
  top: 0;
  right: -10px;
  z-index: 2;
  border-radius: 10px;
  background: var(--body-background);
  cursor: col-resize;

  &:hover {
    background: var(--theme);
  }

  display: flex;
  justify-content: center;
  flex-direction: column;
  align-items: center;

  span {
    font-weight: bold;
    opacity: 0.7;
    margin-top: -10px;
  }
}
</style>
