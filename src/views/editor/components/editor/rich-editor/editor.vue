<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue'
import { useToggleEditorMode } from './hook'
import { getPMEditor } from './pm/useEditor'
import { checkMouseSelect, selectIcon } from '../toolbar/hook'
import { useResumeType } from '../../../hook'
import RichToolbar from '../toolbar/richTool.vue'
import SideTool from './sideTool.vue'
import TagStyle from './tagStyle.vue'
import ColumnResize from './columnResize.vue'
import LinkMenu from './linkMenu.vue'
import ImgResize from './imgResize.vue'
import SlashMenu from './slashMenu.vue'
import BubbleMenu from './bubbleMenu.vue'
import './writable.scss'

defineProps<{ left: number }>()

const { resumeType } = useResumeType()
const {
  DOMTree,
  ObserverContent,
  editorStore,
  undo,
  redo: storeRedo
} = useToggleEditorMode(resumeType.value)

// 生产左栏同款：指南图标打开外部语雀排版指南；末位为日/夜间主题切换（html.dark）
const GUIDE_DOC = 'https://www.yuque.com/xiongleixin/saqnu1/rxhlykmem82qbb8m'
const openGuideDoc = () => window.open(GUIDE_DOC, '_blank')
const isDark = ref(document.documentElement.classList.contains('dark'))
const toggleDark = () => {
  isDark.value = !isDark.value
  document.documentElement.classList.toggle('dark', isDark.value)
  localStorage.setItem('editor-theme', isDark.value ? 'dark' : 'light')
}
if (localStorage.getItem('editor-theme') === 'dark') {
  document.documentElement.classList.add('dark')
  isDark.value = true
}

// 撤销/重做可用态（生产同款禁用半透明）——PM history 原生驱动
const canUndo = ref(false)
const canRedo = ref(false)
const refreshUndo = () => {
  const e = getPMEditor()
  canUndo.value = !!e?.can().undo()
  canRedo.value = !!e?.can().redo()
}
const redo = () => {
  storeRedo()
  refreshUndo()
}
onMounted(refreshUndo)
const undoTimer = setInterval(refreshUndo, 800)
onBeforeUnmount(() => clearInterval(undoTimer))
</script>

<template>
  <!-- 生产版编辑顶栏：撤销/重做/图标选择/排版指南/主题切换 + 右侧胶囊由 editorContainer 提供 -->
  <div class="writable-edit-bar">
    <div class="bar-icons">
      <i
        class="iconfont icon-undo btn"
        :class="{ dim: !canUndo }"
        title="撤销"
        @click="
          () => {
            undo()
            refreshUndo()
          }
        "
      ></i>
      <i class="iconfont icon-redo1 btn" :class="{ dim: !canRedo }" title="重做" @click="redo"></i>
      <i class="iconfont icon-emoji btn" title="图标选择 /icon" @click="selectIcon = true"></i>
      <i
        class="menu-guide iconfont icon-problem btn"
        title="🎈花5分钟了解排版编写指南"
        @click="openGuideDoc"
      ></i>
      <i
        :class="`iconfont btn ${isDark ? 'icon-moon' : 'icon-shine'}`"
        :title="isDark ? '切换日间主题' : '切换夜间主题'"
        @click="toggleDark"
      ></i>
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
  <SlashMenu />
  <BubbleMenu />
  <!-- tiptap/ProseMirror 引擎挂载在此容器内（.tiptap.ProseMirror 为文档根） -->
  <div
    ref="DOMTree"
    @click="checkMouseSelect"
    class="writable-edit-mode"
    spellcheck="false"
    @keyup="refreshUndo"
    :style="{ height: 'calc(100vh - 88px)', width: `${left}px` }"
  ></div>
</template>

<style lang="scss">
/* richTool 的按钮行在编辑模式下隐藏（生产编辑栏无格式按钮），其弹窗不受影响 */
.content-mode-tool-bar {
  display: none !important;
}
</style>
