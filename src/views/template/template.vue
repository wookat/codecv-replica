<script setup lang="ts">
import NavBar from '@/components/navBar.vue'
import resumeCard from './components/resumeCard.vue'
import Empty from '@/components/empty.vue'
import { templateCategory } from './constant'
import { useCategory, useTemplateData, useNotification } from './hook'
import { numFormat } from '@/utils/format'
import ToastModal from '@/components/toast-modal/toastModal.vue'
import { computed, onMounted, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { favoriteList } from '@/api/modules/favorite'
import { currentUser } from '@/utils/auth'

const { queryCategory, data } = useCategory()
const { ranks } = useTemplateData()
const { flag, close } = useNotification()

const favTypes = ref<Set<string>>(new Set())
const onlyFav = ref(false)
onMounted(async () => {
  const r = await favoriteList()
  favTypes.value = new Set(r.types)
})
function onToggleFav(p: { type: string; favorited: boolean }) {
  const s = new Set(favTypes.value)
  if (p.favorited) s.add(p.type)
  else s.delete(p.type)
  favTypes.value = s
}
const shown = computed(() =>
  onlyFav.value ? data.value.filter(t => favTypes.value.has(t.type)) : data.value
)
function toggleOnlyFav() {
  if (!currentUser()) ElMessage.info('未登录收藏保存在本机，登录后可云端同步')
  onlyFav.value = !onlyFav.value
}
</script>

<template>
  <div class="resume-container flex">
    <div class="resume-left-container content-card" data-aos="fade-right">
      <NavBar button="创作模板" :tabs="templateCategory" @tab-click="queryCategory" />
      <div class="fav-bar">
        <button class="fav-toggle" :class="{ on: onlyFav }" @click="toggleOnlyFav">
          ★ 只看收藏（{{ favTypes.size }}）
        </button>
      </div>
      <div class="resume-card-container" v-if="shown.length">
        <resume-card
          v-for="theme in shown"
          :key="theme.id"
          :theme="theme"
          :favorited="favTypes.has(theme.type)"
          @toggle-fav="onToggleFav"
        />
      </div>
      <Empty
        v-else
        :title="
          onlyFav
            ? '还没有收藏模板，点击卡片右上角 ☆ 收藏'
            : '暂时没有这类模板 你可以点击右上角创作模板或联系作者添加～'
        "
      />
    </div>
    <div class="resume-right-container" data-aos="fade-left">
      <div class="resume-hot-rank content-card mb-20">
        <strong class="mb-20">简历模板热度排行</strong>
        <ul v-if="ranks.length">
          <li
            v-for="(t, idx) in ranks"
            :key="t.type"
            class="flex hover pointer"
            @click="$router.push({ path: `/editor`, query: { type: t.type } })"
          >
            <el-tooltip :content="t.name" placement="left">
              <p class="line-1">
                <span class="mr-10">{{ idx + 1 }}</span
                >{{ t.name }}
              </p>
            </el-tooltip>
            <sub> <i class="iconfont icon-hot"></i> {{ numFormat(+String(t.hot)) }}</sub>
          </li>
        </ul>
        <Empty title="正在加载中" v-else />
      </div>
      <div class="resume-notification content-card">
        <strong>公告</strong>
        <p>
          本站基于开源项目
          <a href="https://github.com/acmenlei/codecv" target="_blank">codecv</a>
          构建（遵循其授权条款并已获商用授权），模板与排版引擎源自上游，感谢原作者的开源工作。
        </p>
      </div>
    </div>
  </div>
  <ToastModal :flag="flag" @close="close">
    <h3 style="margin-bottom: 10px">通知</h3>
    <p style="line-height: 27px">欢迎使用，简历数据默认保存在本地浏览器中。</p>
    <ol class="" style="margin: 10px 0; padding-left: 20px; line-height: 28px">
      <li>🌈 Markdown / 富文本双编辑模式</li>
      <li>✍🏻 一套内容适配全部模板</li>
      <li>✨ 样式、字体、边距均可自定义</li>
      <li>☁️ 支持导出 PDF</li>
    </ol>
    <p style="text-align: center; margin-top: 20px">
      <button class="primary btn" @click="close">知道了</button>
    </p>
  </ToastModal>
</template>

<style lang="scss" scoped>
.fav-bar {
  width: 100%;
  margin: 0 0 10px;
  .fav-toggle {
    border: 1px solid var(--border-color, #e5e5e5);
    background: var(--background);
    color: var(--font-color);
    border-radius: 16px;
    padding: 4px 14px;
    font-size: 12px;
    cursor: pointer;
    &.on {
      color: #f5a623;
      border-color: #f5a623;
    }
  }
}

.resume-container {
  max-width: var(--max-width);
  margin: 20px auto;

  .resume-notification {
    padding-bottom: 140px;
    position: sticky;
    top: 80px;
    font-size: 15px;
    line-height: 28px;
    strong {
      display: inline-block;
      margin-bottom: 10px;
      padding-bottom: 5px;
      color: var(--theme);
    }
    a {
      color: #5e75eb;
    }
  }

  .resume-hot-rank {
    strong {
      display: inline-block;
      color: var(--theme);
    }
    li {
      font-size: 14px;
      line-height: 30px;
      p {
        max-width: 135px;
      }
      sub {
        font-weight: 500;
        white-space: nowrap;
        color: orangered;
        text-align: right;
        flex-grow: 1;
      }
      &:nth-child(1),
      &:nth-child(2),
      &:nth-child(3) {
        p span {
          color: orangered;
        }
      }
    }
  }

  .resume-left-container {
    margin-right: 20px;
    .resume-card-container {
      display: grid;
      grid-template-columns: repeat(5, 1fr);
    }
  }
}
.group {
  align-items: center;
  gap: 40px;
}
@media screen and (max-width: 800px) {
  .resume-right-container {
    display: none;
  }
  .resume-left-container {
    margin-left: 20px;
  }
}
</style>
