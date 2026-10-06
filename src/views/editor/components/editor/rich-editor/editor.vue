<script setup lang="ts">
import { useToggleEditorMode } from './hook'
import { checkMouseSelect, selectIcon } from '../toolbar/hook'
import { useResumeType } from '../../../hook'
import { startGuide } from '../../guide/guide'
import { proofreadBus } from '../../proofread/proofread'
import RichToolbar from '../toolbar/richTool.vue'
import SideTool from './sideTool.vue'
import TagStyle from './tagStyle.vue'
import ColumnResize from './columnResize.vue'
import LinkMenu from './linkMenu.vue'
import ImgResize from './imgResize.vue'
import './writable.scss'

defineProps<{ left: number }>()

const { resumeType } = useResumeType()
const { DOMTree, ObserverContent, editorStore, undo } = useToggleEditorMode(resumeType.value)
</script>

<template>
  <!-- 生产版编辑顶栏：撤销/重做/表情/指南/智能 + 右侧胶囊由 editorContainer 提供 -->
  <div class="writable-edit-bar">
    <div class="bar-icons">
      <i class="iconfont icon-undo" title="撤销" @click="undo"></i>
      <i class="iconfont icon-redo1 dim" title="重做"></i>
      <i class="iconfont icon-emoji" title="表情" @click="selectIcon = true"></i>
      <i class="iconfont icon-problem" title="使用指南" @click="startGuide()"></i>
      <i class="iconfont icon-shine" title="智能检查" @click="proofreadBus++"></i>
    </div>
  </div>
  <!-- rich-toolbar 仅保留其弹窗（图标/链接/多栏/表格），按钮行对编辑模式隐藏 -->
  <rich-toolbar
    class="rich-tool-compact"
    @toggle-editor-mode="editorStore.setWritableMode"
    @content-change="ObserverContent"
  />
  <SideTool />
  <TagStyle />
  <ColumnResize />
  <LinkMenu />
  <ImgResize />
  <div
    ref="DOMTree"
    @click="checkMouseSelect"
    @input="ObserverContent"
    class="writable-edit-mode"
    contenteditable
    spellcheck="false"
    :style="{ height: 'calc(100vh - 88px)', width: `${left}px`, overflowY: 'scroll' }"
  ></div>
</template>

<style lang="scss">
/* richTool 的按钮行在编辑模式下隐藏（生产编辑栏无格式按钮），其弹窗不受影响 */
.content-mode-tool-bar {
  display: none !important;
}
</style>
