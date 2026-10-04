<script setup lang="ts">
import { computed } from 'vue'
import RichEditor from './rich-editor/editor.vue'
import MDEditor from './md-editor/editor.vue'
import useEditorStore from '@/store/modules/editor'
import { useResumeType, useAvatar } from '../../hook'
import { reactiveWritable, useMoveLayout, injectWritableModeAvatarEvent } from './hook'

const { resumeType } = useResumeType()
const { left, down } = useMoveLayout()

const { setAvatar } = useAvatar(resumeType.value)
const { writable } = reactiveWritable(resumeType.value)

injectWritableModeAvatarEvent(writable, setAvatar)

const editorStore = useEditorStore()
// 线上版三模式：编辑(所见即所得) / 预览(只留纸面) / MD
const mode = computed(() => (editorStore.previewMode ? 'preview' : writable.value ? 'edit' : 'md'))
function setMode(m: 'edit' | 'preview' | 'md') {
  editorStore.setPreviewMode(m === 'preview')
  if (m === 'edit' && !writable.value) editorStore.setWritableMode(document.body)
  if (m === 'md' && writable.value) editorStore.setWritableMode(document.body)
}
</script>

<template>
  <div class="markdown-edit noto-sans-sc" :class="{ 'preview-only': mode === 'preview' }">
    <div class="mode-pills">
      <button
        :class="{ active: mode === 'edit' }"
        title="切换到所见即所得模式"
        @click="setMode('edit')"
      >
        <i class="iconfont icon-write"></i>编辑
      </button>
      <button :class="{ active: mode === 'preview' }" @click="setMode('preview')">
        <i class="iconfont icon-browse"></i>预览
      </button>
      <button
        :class="{ active: mode === 'md' }"
        title="切换到 Markdown 模式"
        @click="setMode('md')"
      >
        MD
      </button>
    </div>
    <template v-if="mode !== 'preview'">
      <RichEditor :left="left" v-if="writable" />
      <MDEditor :left="left" v-if="!writable" />
      <div class="move absolute" @mousedown="down">
        <span>.</span>
        <span>.</span>
        <span>.</span>
      </div>
    </template>
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

  &.preview-only {
    margin: 0;
    position: absolute;
    top: 70px;
    left: 12px;
    z-index: 5;

    .mode-pills {
      position: fixed;
      top: 66px;
      left: 14px;
    }
  }
}
.mode-pills {
  position: absolute;
  top: 6px;
  right: 14px;
  z-index: 6;
  display: flex;
  background: var(--body-background);
  border: 1px solid #e2e4e9;
  border-radius: 999px;
  padding: 2px;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.08);

  button {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 4px;
    border: none;
    background: transparent;
    padding: 4px 14px;
    font-size: 13px;
    border-radius: 999px;
    cursor: pointer;
    color: var(--font-color);
    min-width: 34px;

    &.active {
      background: var(--theme);
      color: #fff;
    }
  }
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
