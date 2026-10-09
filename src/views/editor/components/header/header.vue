<script setup lang="ts">
import navMenu from './nav.vue'
import { useSwitch } from '@/common/global'
import { useFile } from './hook'
import Contact from '@/components/contact.vue'
import ExportTotal from '@/components/exportTotal.vue'
import useEditorStore from '@/store/modules/editor'
import { useResumeType } from '../../hook'
import {
  cloudSaveName,
  cloudIncExport,
  cloudListMeta,
  cloudSaveNow
} from '@/api/modules/cloudResume'
import { successMessage, errorMessage } from '@/common/message'
import ProofreadDrawer from '../proofread/proofread.vue'
import HistoryDrawer from './historyDrawer.vue'
import ShareDialog from './shareDialog.vue'
import AiHelper from './aiHelper.vue'
import { computed, onMounted, ref, watch } from 'vue'

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
// 生产同款「新功能」红点：点开错别字抽屉一次后消失
const PROOFREAD_DOT_KEY = 'proofread-new-dot-seen'
const newDotSeen = ref(!!localStorage.getItem(PROOFREAD_DOT_KEY))
watch(proofreadVisible, v => {
  if (v) {
    localStorage.setItem(PROOFREAD_DOT_KEY, '1')
    newDotSeen.value = true
  }
})
const historyVisible = ref(false)
const shareVisible = ref(false)
const aiVisible = ref(false)
// 生产同款未保存提示：内容与最近一次保存不一致 → 显示「简历已变更请及时保存」
// 初始内容在兄弟组件挂载阶段才注入，延迟到挂载后取基线避免首载误标
const lastSaved = ref(editorStore.MDContent)
onMounted(() => setTimeout(() => (lastSaved.value = editorStore.MDContent), 0))
const dirty = computed(() => editorStore.MDContent !== lastSaved.value)

async function save() {
  const res = await cloudSaveNow(resumeType.value, editorStore.MDContent)
  if (res?.code === 200) {
    lastSaved.value = editorStore.MDContent
    successMessage('已保存')
  } else {
    errorMessage(res?.msg || '保存失败')
  }
}
// 生产口径：标题输入框显示该简历的名称（云端 name），未命名回落到站点默认名
onMounted(async () => {
  const metas = await cloudListMeta()
  const mine = metas.find(m => m.type === resumeType.value)
  fileName.value = mine?.name || '免费在线简历制作工具CodeCV简历'
})
// 导出计数：对照生产「累计导出」——PDF/PNG 类导出都递增
function exportFile2(kind: 'dynamic' | 'native' | 'picture' | 'md') {
  if (kind !== 'md') cloudIncExport(resumeType.value)
  exportFile(kind)
}
// 生产同款「点击修改简历名称」：blur/回车即持久化到简历记录
function saveName() {
  const name = fileName.value.trim()
  if (!name) return
  cloudSaveName(resumeType.value, name)
}
// 移动端 ⋮ 菜单与桌面 nav 共用「使用教程」双链接逻辑
function tutorHref() {
  return '/syntax/helper'
}
function openImport() {
  ;(document.getElementById('import_md') as HTMLInputElement | null)?.click()
}
</script>

<template>
  <div id="header" class="noto-sans-sc">
    <div class="left">
      <el-tooltip content="返回上一页">
        <i class="iconfont icon-back font-20 hover" @click="$router.back()"></i>
      </el-tooltip>
      <input
        id="resume-name-input"
        type="text"
        v-model="fileName"
        @blur="saveName"
        @keyup.enter=";($event.target as HTMLInputElement).blur()"
      />
      <i class="iconfont icon-write font-20 hover pencil" @click="saveName"></i>
    </div>
    <nav-menu
      @export-md="exportFile('md')"
      @import-md="importFile"
      @export-picture="exportFile('picture')"
      @print-page="emit('print-page')"
    />
    <div class="right">
      <span class="watermark-pill" @click="$router.push('/member')">移除水印</span>
      <span v-if="dirty" class="dirty-hint">简历已变更请及时保存</span>
      <ExportTotal />
      <el-tooltip content="历史记录" effect="light">
        <div class="resume-history lx-cp lx-scale" @click="historyVisible = true">
          <svg class="hist-icon" viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg">
            <path
              d="M512 85.333333c235.648 0 426.666667 191.018667 426.666667 426.666667s-191.018667 426.666667-426.666667 426.666667S85.333333 747.648 85.333333 512h85.333334a341.333333 341.333333 0 1 0 59.093333-192H341.333333v85.333333H85.333333v-256h85.333334V256a425.813333 425.813333 0 0 1 341.333333-170.666667z m42.666667 213.333334v195.626666l138.368 138.368-60.373334 60.373334L469.333333 529.621333V298.666667h85.333334z"
            />
          </svg>
        </div>
      </el-tooltip>
      <button class="save-btn btn" @click="save">保存</button>
      <el-dropdown class="export-dropdown export-group" trigger="click">
        <button class="export-btn btn">导出</button>
        <template #dropdown>
          <el-dropdown-menu>
            <el-dropdown-item @click="exportFile2('dynamic')">PDF</el-dropdown-item>
            <el-dropdown-item @click="exportFile2('picture')">PNG</el-dropdown-item>
            <el-dropdown-item @click="exportFile('md')">MD</el-dropdown-item>
            <el-dropdown-item @click="exportFile2('native')">PDF(备用)</el-dropdown-item>
            <el-dropdown-item divided @click="proofreadVisible = true">
              导出前建议检查错别字 →
            </el-dropdown-item>
          </el-dropdown-menu>
        </template>
      </el-dropdown>
      <!-- 生产同款右侧 ⋮ 分享入口 -->
      <el-tooltip content="简历分享" effect="light">
        <div class="share-dots lx-cp" @click="shareVisible = true"><i></i><i></i><i></i></div>
      </el-tooltip>
      <!-- 生产同款移动端 ⋮ 更多菜单（lg:hidden，<1024px 才显示） -->
      <el-dropdown class="more-menu-wrap" trigger="click" placement="bottom-end">
        <div class="share-dots lx-cp"><i></i><i></i><i></i></div>
        <template #dropdown>
          <ul class="more-menu">
            <li @click="openImport">导入简历</li>
            <li>
              <a href="/jianlimoban" target="_blank" rel="noopener noreferrer">简历模板</a>
            </li>
            <li @click="historyVisible = true">历史记录</li>
            <li class="mm-md" @click="proofreadVisible = true">
              错别字检查<span v-if="!newDotSeen" class="proofread-new-dot"></span>
            </li>
            <li class="mm-md" @click="$router.push('/member')">移除水印</li>
            <li>
              <a
                href="https://www.quzuotu.com/idphoto/guide"
                target="_blank"
                rel="noopener noreferrer"
                >证件照制作</a
              >
            </li>
            <li><a href="/mianjing" target="_blank" rel="noopener noreferrer">面经</a></li>
            <li>
              <a
                href="https://apply.zalize.com?utm_source=codecv_nav"
                target="_blank"
                rel="noopener noreferrer"
                >网申助手</a
              >
            </li>
            <li><a href="/jobs" target="_blank" rel="noopener noreferrer">秋招岗位汇总</a></li>
            <li>
              <a :href="tutorHref()" target="_blank" rel="noopener noreferrer">使用教程</a>
            </li>
          </ul>
        </template>
      </el-dropdown>
    </div>
  </div>
  <Contact :open="open" @toggle="toggle" />
  <ProofreadDrawer v-model="proofreadVisible" />
  <HistoryDrawer v-model="historyVisible" :resume-type="resumeType" />
  <ShareDialog v-model="shareVisible" :resume-type="resumeType" :resume-name="fileName" />
  <AiHelper v-model="aiVisible" :file-name="fileName" @import-md="importFile" />
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
  /* 生产同款竖三点分享钮 */
  .share-dots {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 3px;
    width: 28px;
    height: 36px;
    margin-left: 6px;
    cursor: pointer;
    border-radius: 6px;
    &:hover {
      background: var(--body-background);
    }
    i {
      width: 4px;
      height: 4px;
      border-radius: 50%;
      background: var(--font-color);
      display: block;
    }
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
  .dirty-hint {
    font-size: 13px;
    font-weight: 500;
    color: var(--font-color);
    opacity: 0.8;
    white-space: nowrap;
  }
  .resume-history {
    display: flex;
    align-items: center;
    gap: 4px;
    border-radius: 6px;
    cursor: pointer;
    transition: transform 0.15s ease;
    &:hover {
      transform: scale(1.1);
    }
    .hist-icon {
      width: 20px;
      height: 20px;
      fill: #333;
    }
  }
  .icon-back {
    cursor: pointer;
    font-weight: normal;
  }
  /* 生产同款：⋮ 更多菜单仅 <1024px 显示 */
  .more-menu-wrap {
    display: none;
  }
  @media (max-width: 1023.9px) {
    .more-menu-wrap {
      display: inline-flex;
      // 右侧操作区整体超出视口时保证触发器仍可达（prod 同款固定在右缘）
      position: fixed;
      right: 10px;
      top: 10px;
      z-index: 3000;
      .share-dots {
        background: var(--background);
        border-radius: 50%;
        box-shadow: 0 2px 10px rgba(0, 0, 0, 0.18);
      }
    }
  }
}
.more-menu {
  list-style: none;
  margin: 0;
  padding: 4px 0;
  width: 132px;
  li {
    font-size: 14px;
    font-weight: 700;
    white-space: nowrap;
    cursor: pointer;
    margin: 0 8px;
    padding: 8px;
    border-radius: 6px;
    color: var(--font-color);
    position: relative;
    a {
      color: inherit;
      text-decoration: none;
    }
    &:hover {
      color: var(--theme);
      background: var(--body-background);
    }
    /* 生产同款：错别字检查/移除水印 仅 <768px 显示 */
    &.mm-md {
      display: none;
    }
    .proofread-new-dot {
      position: absolute;
      right: 6px;
      top: 6px;
      width: 6px;
      height: 6px;
      border-radius: 50%;
      background: var(--theme, #ff7449);
    }
  }
}
@media (max-width: 767.9px) {
  .more-menu li.mm-md {
    display: block;
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
