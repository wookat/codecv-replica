<script setup lang="ts">
import ToastModal from '@/components/toast-modal/toastModal.vue'
import Empty from '@/components/empty.vue'
import { Codemirror } from 'vue-codemirror'
import { cssLanguage } from '@codemirror/lang-css'
import { marks } from './constant'
import {
  step,
  setStep,
  useAvatar,
  usePrimaryBGColor,
  useCustomFont,
  useCustomCSS,
  usePrimaryColor,
  useAdjust,
  useLineHeight,
  usePageMargin,
  useJustify,
  useOnePage,
  useBadge
} from './hook'
import { oneDark } from '@codemirror/theme-one-dark'
import { useThemeConfig } from '@/common/global'
import { useResumeType } from '../../hook'
import ProofreadDrawer from '../proofread/proofread.vue'
import TranslateDialog from './translateDialog.vue'
import { proofreadBus } from '../proofread/proofread'
import { ref, watch } from 'vue'

const emits = defineEmits(['upload-avatar', 'html-convert'])

const { resumeType } = useResumeType()
const { cssDialog, cssText, toggleDialog, setStyle, removeStyle } = useCustomCSS(resumeType.value)
const { color, setColor } = usePrimaryColor(resumeType.value)
const { fontOptions, font, setFont } = useCustomFont(resumeType.value)
const { setAvatar } = useAvatar(emits)
const { primaryColor, setPrimaryColor } = usePrimaryBGColor(resumeType.value)
const { adjustMargin, visible, confirmAdjustment, properties } = useAdjust(resumeType.value)
const { lineHeight, lineHeightOptions, applyLineHeight } = useLineHeight(resumeType.value)
const { pageMarginTB, pageMarginLR, applyPageMargin } = usePageMargin(resumeType.value)
const { justified, toggleJustify } = useJustify(resumeType.value)
const { toggleOnePage, onePageApplied } = useOnePage(resumeType.value)
const { setBadge } = useBadge(resumeType.value)
const { isDark } = useThemeConfig()

const proofreadVisible = ref(false)
const translateVisible = ref(false)
watch(proofreadBus, () => (proofreadVisible.value = true))
</script>

<template>
  <div class="operator resume-tools">
    <el-slider
      size="small"
      class="slider"
      :marks="marks"
      v-model="step"
      @change="setStep"
      :step="10"
      show-stops
    />
    <div class="operator-level2">
      <el-tooltip content="简历内容翻译，支持大部分主流语言" effect="light">
        <i class="operator-item iconfont icon-translate" @click="translateVisible = true"></i>
      </el-tooltip>
      <el-tooltip content="编写CSS" effect="light">
        <i class="operator-item iconfont icon-diy scale-110" @click="toggleDialog"></i
      ></el-tooltip>
      <el-tooltip content="调整简历中内容边距/字号" effect="light">
        <i class="iconfont icon-adjust operator-item" @click="adjustMargin"></i>
      </el-tooltip>
      <div class="operator-item font-color-picker">
        <el-color-picker @change="setColor" size="small" v-model="color" />
      </div>
      <div class="operator-item main-color-picker">
        <el-color-picker @change="setPrimaryColor" size="small" v-model="primaryColor" />
      </div>
      <el-tooltip
        content="上传前请确保你想上传的位置在编辑器中存在 ![个人头像](...) 此占位符"
        effect="light"
      >
        <label for="upload-avatar" class="operator-item text-btn"> 证件照 </label>
      </el-tooltip>
      <input type="file" id="upload-avatar" accept=".png,.jpg,.jpeg" @change="setAvatar" />
      <el-tooltip content="上传校徽（拖拽图中校徽可调整位置）" effect="light">
        <label for="upload-badge" class="operator-item text-btn">校徽</label>
      </el-tooltip>
      <input type="file" id="upload-badge" accept=".png,.jpg,.jpeg" @change="setBadge" />
      <el-tooltip
        :content="onePageApplied ? '恢复多页排版' : '智能压缩边距装进一页'"
        effect="light"
      >
        <button
          class="operator-item text-btn"
          :class="{ 'onepage-active': onePageApplied }"
          @click="toggleOnePage"
        >
          {{ onePageApplied ? '取消一页' : '智能一页' }}
        </button>
      </el-tooltip>
      <el-tooltip content="段落两端对齐" effect="light">
        <button
          class="operator-item text-btn"
          :class="{ active: justified }"
          @click="toggleJustify"
        >
          两端对齐
        </button>
      </el-tooltip>
      <el-tooltip content="错别字检查" effect="light">
        <button class="operator-item text-btn proofread-btn" @click="proofreadVisible = true">
          错别字检查
          <span class="proofread-new-dot" title="新功能"></span>
        </button>
      </el-tooltip>

      <el-tooltip content="调整上下页边距" effect="light">
        <el-input-number
          class="operator-item margin-step"
          size="small"
          v-model="pageMarginTB"
          :min="0"
          :max="100"
          :step="2"
          @change="applyPageMargin"
        />
      </el-tooltip>
      <el-tooltip content="调整左右页边距" effect="light">
        <el-input-number
          class="operator-item margin-step"
          size="small"
          v-model="pageMarginLR"
          :min="0"
          :max="100"
          :step="2"
          @change="applyPageMargin"
        />
      </el-tooltip>
      <el-tooltip content="行距" effect="light">
        <el-select
          v-model="lineHeight"
          class="operator-item lh-select"
          size="small"
          @change="(n: number) => applyLineHeight(n)"
        >
          <el-option
            v-for="o in lineHeightOptions"
            :key="o.value"
            :label="o.label"
            :value="o.value"
          />
        </el-select>
      </el-tooltip>
      <el-tooltip content="字体设置" effect="light">
        <el-select v-model="font" class="operator-item font-select" @change="setFont" size="small">
          <el-option
            v-for="item in fontOptions"
            :key="item.value"
            :label="item.label"
            :value="item.value"
          />
        </el-select>
      </el-tooltip>
    </div>
    <br />
  </div>
  <ProofreadDrawer v-model="proofreadVisible" />
  <TranslateDialog v-model="translateVisible" :resume-type="resumeType" />
  <!-- 弹出框 -->
  <ToastModal v-if="cssDialog" :flag="cssDialog" @close="cssDialog = false" width="400px">
    <h4 class="mb-10">编写CSS样式让它作用在模板上</h4>
    <codemirror
      v-model="cssText"
      autofocus
      :style="{ minHeight: '300px', maxHeight: '500px' }"
      :indent-with-tab="true"
      :extensions="isDark ? [cssLanguage, oneDark] : [cssLanguage]"
      placeholder="格式如 .jufe h2 { color: red; }"
    />
    <br />
    <button class="btn primary cursor hover" @click="setStyle">确认</button>
    <button class="btn primary cursor hover" @click="removeStyle">重置</button>
  </ToastModal>
  <!-- 调整边距/字号（生产同款固定语义行） -->
  <ToastModal
    v-if="visible"
    :flag="visible"
    @close="confirmAdjustment"
    :width="properties.length ? '560px' : '310px'"
  >
    <div class="properties-container" v-if="properties.length">
      <div class="properties-header">
        <span>目标元素</span>
        <span>上边距(px)</span>
        <span>下边距(px)</span>
        <span>字体大小(px)</span>
      </div>
      <div class="properties-item" v-for="(property, idx) in properties" :key="idx">
        <span class="prop-name text-sm">{{ property.name }}</span>
        <el-input-number size="small" class="prop-num" v-model="property.marginTop" />
        <el-input-number size="small" class="prop-num" v-model="property.marginBottom" />
        <el-input-number size="small" class="prop-num" :min="12" v-model="property.fontSize" />
      </div>
      <div class="properties-actions">
        <button class="btn primary cursor hover" @click="confirmAdjustment">确认调整</button>
        <button class="btn cursor hover" @click="visible = false">取消调整</button>
      </div>
    </div>
    <Empty v-else title="简历中还没有内容 可以先写点东西" />
    <h5 class="properties-foot" style="color: var(--strong-color)">
      PS: 只显示简历模板中已经使用的
    </h5>
  </ToastModal>
</template>

<style lang="scss" scoped>
.operator {
  width: 100%;
  margin: 0 auto;
  position: sticky;
  top: 0;
  transform: translateY(-20px);
  z-index: 1;
  background: var(--toolbar-bg);
  padding-top: 20px;

  /* 解决label默认边距的问题 */
  .card {
    height: 25px;
  }
  .slider {
    width: 190mm;
    user-select: none;
    margin: 0 auto;
  }
  .operator-level2 {
    display: flex;
    margin-top: 25px;
    justify-content: center;
    align-items: center;
    flex-wrap: wrap;
    row-gap: 8px;

    .operator-item {
      margin-right: 10px;
    }
    .font-color-picker {
      margin-right: 12px;
    }
    .main-color-picker {
      margin-right: 0;
    }
    #upload-avatar,
    #upload-badge {
      width: 0;
      height: 0;
    }
    .text-btn {
      color: #f8f8f8;
      font-size: 14px;
      cursor: pointer;
      white-space: nowrap;
      border: none;
      background: transparent;
      padding: 2px 4px;

      &:hover {
        opacity: 0.8;
      }
      &.active {
        color: var(--theme);
      }
      &.onepage-active {
        color: var(--theme);
        border: 1px solid var(--theme);
        border-radius: 6px;
      }
    }
    .margin-step {
      width: 80px;
    }
    .lh-select {
      width: 70px;
    }
    .font-select {
      width: 90px;
    }
    .proofread-btn {
      position: relative;
    }
    .proofread-new-dot {
      position: absolute;
      top: -4px;
      right: -6px;
      width: 7px;
      height: 7px;
      border-radius: 50%;
      background: #f56c6c;
    }

    i.iconfont {
      color: #f8f8f8;
      font-size: 24px;
      cursor: pointer;
      &.scale-110 {
        transform: scale(1.1);
      }
      &:hover {
        opacity: 0.8;
      }
    }
  }
}

.properties-container {
  max-height: 60vh;
  overflow-y: auto;
  .properties-header {
    display: grid;
    grid-template-columns: 110px 120px 120px 130px;
    column-gap: 10px;
    font-weight: 600;
    font-size: 13px;
    padding-bottom: 12px;
    border-bottom: 1px solid rgba(0, 0, 0, 0.06);
  }
  .properties-item {
    display: grid;
    grid-template-columns: 110px 120px 120px 130px;
    column-gap: 10px;
    align-items: center;
    margin-top: 10px;
    .prop-name {
      font-size: 14px;
      width: 110px;
    }
    .prop-num {
      width: 100px;
    }
  }
  .properties-actions {
    display: flex;
    gap: 12px;
    margin-top: 20px;
  }
}
.properties-foot {
  margin-top: 14px;
}
</style>
