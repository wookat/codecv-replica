<script setup lang="ts">
import navMenu from './nav.vue'
import { useSwitch } from '@/common/global'
import { useFile } from './hook'
import Contact from '@/components/contact.vue'
import ExportTotal from '@/components/exportTotal.vue'
import useEditorStore from '@/store/modules/editor'
import { useResumeType } from '../../hook'
import { cloudPush } from '@/api/modules/cloudResume'
import { successMessage, warningMessage } from '@/common/message'
import ProofreadDrawer from '../proofread/proofread.vue'
import { ref } from 'vue'

const emit = defineEmits([
  'download-dynamic',
  'download-native',
  'download-md',
  'import-md',
  'download-picture',
  'print-page'
])

const { exportFile, importFile, fileName } = useFile(emit)
const { open, toggle } = useSwitch()
const editorStore = useEditorStore()
const { resumeType } = useResumeType()
const proofreadVisible = ref(false)

function save() {
  cloudPush(resumeType.value, editorStore.MDContent)
  successMessage('已保存')
}
function undo() {
  const prev = editorStore.undo()
  if (prev === null) return warningMessage('没有可撤销的内容')
  editorStore.setMDContent(prev, resumeType.value)
}
</script>

<template>
  <div id="header" class="noto-sans-sc">
    <div class="left">
      <el-tooltip content="返回上一页">
        <i class="iconfont icon-back font-20 hover" @click="$router.back()"></i>
      </el-tooltip>
      <input id="resume-name-input" type="text" v-model="fileName" />
      <i class="iconfont icon-write font-20 hover pencil"></i>
    </div>
    <nav-menu
      @export-md="exportFile('md')"
      @import-md="importFile"
      @export-picture="exportFile('picture')"
      @print-page="emit('print-page')"
    />
    <div class="right">
      <span class="watermark-pill" @click="$router.push('/member')">移除水印</span>
      <ExportTotal />
      <el-tooltip content="撤销">
        <i class="iconfont icon-undo font-20 hover undo" @click="undo"></i>
      </el-tooltip>
      <button class="save-btn btn" @click="save">保存</button>
      <el-dropdown class="export-dropdown" trigger="click">
        <button class="export-btn btn">导出</button>
        <template #dropdown>
          <el-dropdown-menu>
            <el-dropdown-item @click="exportFile('dynamic')">PDF</el-dropdown-item>
            <el-dropdown-item @click="exportFile('picture')">PNG</el-dropdown-item>
            <el-dropdown-item @click="exportFile('md')">MD</el-dropdown-item>
            <el-dropdown-item @click="exportFile('native')">PDF(备用)</el-dropdown-item>
            <el-dropdown-item divided @click="proofreadVisible = true">
              导出前建议检查错别字 →
            </el-dropdown-item>
          </el-dropdown-menu>
        </template>
      </el-dropdown>
      <el-dropdown trigger="click">
        <span class="more-dots hover">⋮</span>
        <template #dropdown>
          <el-dropdown-menu>
            <el-dropdown-item>
              <label for="import_md" class="import-label">
                导入MD
                <input accept=".md" id="import_md" type="file" @change="importFile" />
              </label>
            </el-dropdown-item>
            <el-dropdown-item @click="emit('print-page')">打印</el-dropdown-item>
            <el-dropdown-item @click="toggle">问题反馈</el-dropdown-item>
          </el-dropdown-menu>
        </template>
      </el-dropdown>
    </div>
  </div>
  <Contact :open="open" @toggle="toggle" />
  <ProofreadDrawer v-model="proofreadVisible" />
</template>

<style lang="scss" scoped>
#header {
  z-index: 9;
  height: 60px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 15px;
  text-align: center;
  color: var(--font-color);
  background: var(--background);
  font-weight: 600;

  .left {
    display: flex;
    align-items: center;
    gap: 10px;
  }
  #resume-name-input {
    border: none;
    outline: none;
    padding: 6px 8px;
    border-radius: 5px;
    background: transparent;
    font-family: var(--font-noto-sans-sc);
    font-weight: 600;
    max-width: 200px;

    &:focus {
      outline: 2px solid var(--theme);
    }
  }
  .pencil {
    cursor: pointer;
    opacity: 0.7;
  }
  .right {
    display: flex;
    align-items: center;
    gap: 14px;
  }
  .watermark-pill {
    background: #fde9dc;
    color: #e6642e;
    font-size: 12px;
    border-radius: 999px;
    padding: 4px 12px;
    cursor: pointer;
    white-space: nowrap;
  }
  .undo {
    cursor: pointer;
  }
  .btn {
    outline: none;
    border: none;
    padding: 8px 16px;
    border-radius: 6px;
    cursor: pointer;
    font-weight: 600;
  }
  .save-btn {
    background: var(--background);
    color: var(--font-color);
    border: 1px solid #e2e4e9;
  }
  .export-btn {
    background: var(--theme);
    color: #fff;
  }
  .more-dots {
    cursor: pointer;
    font-size: 20px;
    font-weight: 700;
    line-height: 1;
    padding: 0 4px;
  }
  .icon-back {
    cursor: pointer;
    font-weight: normal;
  }
}
#import_md {
  width: 0;
  height: 0;
}
.import-label {
  cursor: pointer;
}
</style>
