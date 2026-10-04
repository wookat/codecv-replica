<script setup lang="ts">
import { useRouter } from 'vue-router'
import Header from './components/header/header.vue'
import MarkdownRender from '@/views/editor/components/preview/render.vue'
import Editor from '@/views/editor/components/editor/editorContainer.vue'
import { useResumeType, useDownLoad, useImportMD, useAvatar, useShowExport } from './hook'
import { startGuide } from './components/guide/guide'

const router = useRouter()
const { resumeType } = useResumeType()
const { downloadDynamic, downloadNative, downloadMD } = useDownLoad(resumeType)
const { importMD } = useImportMD(resumeType.value)
const { setAvatar } = useAvatar(resumeType.value)
const { showExport } = useShowExport()
const gotoPrint = () => router.push(`/export/${resumeType.value}`)
const restartGuide = () => {
  localStorage.removeItem('resume-make-guide')
  startGuide()
}
startGuide()
</script>

<template>
  <Header
    @download-dynamic="(filename: string) => downloadDynamic(true, filename)"
    @download-picture="(filename: string) => downloadDynamic(false, filename)"
    @download-native="downloadNative"
    @download-md="downloadMD"
    @import-md="importMD"
    @print-page="gotoPrint"
  />
  <div id="editor">
    <Editor />
    <markdown-render class="markdown-render" @upload-avatar="setAvatar" />
    <el-tooltip content="导出PDF文件" v-if="showExport">
      <i
        data-aos="fade-in"
        data-aos-duration="800"
        data-aos-offset="50"
        class="iconfont icon-export hover pointer standby-export"
        @click="downloadDynamic(true)"
      ></i>
    </el-tooltip>
  </div>
  <!-- 生产同款右侧悬浮坞 -->
  <div class="side-dock">
    <el-tooltip content="新手引导" placement="left" effect="light">
      <i class="iconfont icon-problem dock-item" @click="restartGuide"></i>
    </el-tooltip>
    <el-tooltip content="问题反馈" placement="left" effect="light">
      <i class="iconfont icon-message dock-item" @click="router.push('/feedback')"></i>
    </el-tooltip>
    <el-tooltip content="个人中心" placement="left" effect="light">
      <i class="iconfont icon-user dock-item" @click="router.push('/profile')"></i>
    </el-tooltip>
    <el-tooltip content="使用教程" placement="left" effect="light">
      <i class="iconfont icon-book dock-item" @click="router.push('/strategy')"></i>
    </el-tooltip>
  </div>
  <el-tooltip content="意见反馈" placement="left" effect="light">
    <i class="iconfont icon-message contact-fab" @click="router.push('/feedback')"></i>
  </el-tooltip>
</template>

<style lang="scss" scoped>
#editor {
  display: flex;
  position: relative;
  .markdown-render {
    flex: 1;
    margin: 0 10px;
    border-radius: 10px;
  }
  .standby-export {
    position: absolute;
    top: 120px;
    right: 30px;
    z-index: 3;
    color: #f8f8f8;
    background: var(--theme);
    text-align: center;
    line-height: 45px;
    padding-left: 2px;
    font-size: 22px;
    width: 45px;
    height: 45px;
    border-radius: 50%;

    &:hover {
      color: var(--theme);
      background: #f8f8f8;
    }
  }
}

.side-dock {
  position: fixed;
  right: 18px;
  top: 50%;
  transform: translateY(-50%);
  z-index: 20;
  display: flex;
  flex-direction: column;
  align-items: center;
  background: #fff;
  border-radius: 24px;
  padding: 10px 0;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.12);

  .dock-item {
    font-size: 20px;
    color: #555;
    padding: 10px 12px;
    cursor: pointer;

    &:hover {
      color: var(--theme);
    }
  }
}

.contact-fab {
  position: fixed;
  right: 18px;
  bottom: 40px;
  z-index: 20;
  width: 48px;
  height: 48px;
  line-height: 48px;
  text-align: center;
  font-size: 24px;
  color: #fff;
  background: var(--theme);
  border-radius: 50%;
  cursor: pointer;
  box-shadow: 0 4px 14px rgba(255, 116, 73, 0.4);

  &:hover {
    opacity: 0.9;
  }
}
</style>
