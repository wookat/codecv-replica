<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { templates, resolveTemplateType } from '@/templates/config'
import {
  cloudCopy,
  cloudDelete,
  cloudListMeta,
  fetchUserInfo,
  syncLocalCloud,
  type CloudResumeMeta,
  type UserInfo
} from '@/api/modules/cloudResume'
import { currentUser } from '@/utils/auth'
import { fmtCN } from '@/utils/time'
import { setLocalStorage } from '@/common/localstorage'
import LoginModal from '@/components/LoginModal.vue'

const router = useRouter()
const user = ref(currentUser())
const info = ref<UserInfo | null>(null)
const loginModal = ref(false)
const resumes = ref<CloudResumeMeta[]>([])

const guides = [
  {
    url: 'https://www.yuque.com/xiongleixin/saqnu1/rxhlykmem82qbb8m',
    title: '所见即所得模式简历制作指南'
  },
  {
    url: 'https://www.yuque.com/xiongleixin/saqnu1/sl2ai75t6xgbhg86',
    title: 'Markdown模式简历制作指南'
  }
]

// 简历封面按实例键回落母版模板
const tplOf = (type: string) =>
  templates.value.find(t => t.type === resolveTemplateType(type.split('~')[0]))

const fmt = (ts?: number) => (ts ? fmtCN(ts, true) : '-')

const quotaText = computed(() => {
  if (!info.value) return ''
  return info.value.cv < 0 ? '无限制' : String(info.value.cv)
})
const remainText = computed(() => {
  if (!info.value) return ''
  if (info.value.cv < 0) return '无限'
  return String(Math.max(0, info.value.cv - resumes.value.length))
})

async function scan() {
  if (!user.value) {
    resumes.value = []
    return
  }
  resumes.value = await cloudListMeta()
}

const has = computed(() => resumes.value.length > 0)

function edit(type: string) {
  router.push(`/editor/${type}`)
}

async function copy(r: CloudResumeMeta) {
  const res = await cloudCopy(r.type)
  if (res?.code !== 200 || !res.data?.type) {
    return ElMessage.error(res?.msg || '创建副本失败')
  }
  // 云端已有副本行；本地同步实例内容，编辑器即可直接打开
  setLocalStorage(`markdown-content-${res.data.type}`, r.content || '')
  await scan()
  ElMessage.success('已创建副本')
}

async function remove(type: string) {
  await ElMessageBox.confirm('删除后不可恢复，确定删除这份简历吗？', '删除简历', {
    type: 'warning'
  })
  localStorage.removeItem(`markdown-content-${type}`)
  await cloudDelete(type)
  await scan()
  ElMessage.success('已删除')
}

function create() {
  if (info.value && info.value.cv >= 0 && resumes.value.length >= info.value.cv) {
    ElMessageBox.confirm('免费版最多创建1份简历，升级会员可拥有更多份数', '简历数量已达上限', {
      confirmButtonText: '升级会员',
      cancelButtonText: '知道了',
      type: 'warning'
    }).then(() => router.push('/member'))
    return
  }
  router.push('/jianlimoban')
}

onMounted(async () => {
  if (user.value) {
    await syncLocalCloud()
    info.value = await fetchUserInfo()
    await scan()
  }
})
</script>

<template>
  <div class="pf-page">
    <h1 class="sr-only">我的简历_简历管理_在线简历列表</h1>
    <div class="pf-cols">
      <!-- 左侧小程序卡 -->
      <aside class="pf-aside">
        <h4>🎉 使用小程序管理投递进度</h4>
        <div class="qr-wrap">
          <img src="/static/webp/miniprogram-Ceuprux3.webp" alt="小程序投递进度管理" />
        </div>
        <ul>
          <li>1. ✨ 无需制作烦琐的Excel表格</li>
          <li>2. 😎 投递状态手机随查随改</li>
          <li>3. 🎈 不怕忘记投了哪些公司</li>
          <li>4. 🔒 隐私保护保证信息不泄漏</li>
        </ul>
        <h4 class="mt">🌈 保姆级简历工具指南</h4>
        <a
          v-for="g in guides"
          :key="g.url"
          class="guide"
          :href="g.url"
          target="_blank"
          rel="noopener"
          >{{ g.title }}</a
        >
      </aside>

      <!-- 右侧简历卡 -->
      <div class="pf-main">
        <div class="pm-head">
          <h1>
            我的简历
            <span v-if="user" class="cnt">{{ resumes.length }}/{{ quotaText }}</span>
          </h1>
          <router-link to="/invite" class="invite-btn">🎁 邀请赚佣金</router-link>
        </div>

        <div v-if="user && has" class="rv-list">
          <div v-for="r in resumes" :key="r.type" class="rv-card">
            <div class="rv-img" @click="edit(r.type)">
              <img
                v-if="tplOf(r.type)?.img"
                :src="tplOf(r.type)?.img"
                alt="简历封面"
                loading="lazy"
              />
              <div class="rv-mask"><span>继续编辑</span></div>
            </div>
            <div class="rv-info">
              <p class="rn">简历名称：{{ r.name || '未命名简历' }}</p>
              <p class="rm">创建时间：{{ fmt(r.created_at) }}</p>
              <p class="rm">上次编辑：{{ fmt(r.updated_at) }}</p>
              <p class="rm">累计导出份数：{{ r.export_count || 0 }} 份</p>
              <div class="rv-actions">
                <button class="a" @click="edit(r.type)">编辑</button>
                <button class="a danger" @click="remove(r.type)">删除</button>
                <button class="a" @click="copy(r)">副本</button>
              </div>
            </div>
          </div>
        </div>

        <div v-else class="pf-empty">
          <img class="pe-img" src="/prod-assets/empty.svg" alt="啊哦～当前搜索结果为空" />
          <p class="pe-title">
            {{ user ? '这里空空如也，您还没有创建过简历～' : '您还没有登录请先登录再查看' }}
          </p>
          <button v-if="!user" class="pf-btn" @click="loginModal = true">去登录</button>
        </div>

        <template v-if="user">
          <p class="pf-quota">
            <b>提示</b>：您还可以再创建 <span>{{ remainText }}</span
            >份简历，如果您在编写简历过程中遇到任何使用上的问题，都可以通过右下角方式联系网站客服，我们会尽快解决。
          </p>
          <div class="pf-actions">
            <button class="pf-btn" @click="create">创建简历</button>
            <router-link to="/resume/import" class="pf-btn ghost">导入已有简历</router-link>
          </div>
        </template>
      </div>
    </div>
    <LoginModal v-if="loginModal" @close="loginModal = false" />
  </div>
</template>

<style lang="scss">
.pf-page {
  max-width: var(--max-width);
  margin: 0 auto;
  padding: 20px;
  color: var(--font-color);
  font-family: var(--font-noto-sans-sc);
}
.pf-cols {
  display: flex;
  align-items: flex-start;
  gap: 20px;
}
.pf-aside {
  width: 240px;
  flex-shrink: 0;
  background: var(--background);
  border-radius: 12px;
  padding: 20px;
  line-height: 2;
  h4 {
    font-size: 14px;
    font-weight: 700;
    &.mt {
      margin-top: 16px;
    }
  }
  .qr-wrap {
    width: 144px;
    height: 144px;
    margin: 20px auto;
    padding: 4px;
    background: #fff;
    border-radius: 999px;
    img {
      width: 100%;
      border-radius: 999px;
      display: block;
      user-select: none;
    }
  }
  ul {
    margin-top: 8px;
    font-size: 14px;
    list-style: none;
    padding: 0;
  }
  .guide {
    display: block;
    color: var(--theme);
    font-size: 14px;
    text-decoration: none;
    &:hover {
      text-decoration: underline;
    }
  }
  @media (max-width: 768px) {
    display: none;
  }
}
.pf-main {
  flex: 1;
  min-width: 0;
  background: var(--background);
  border-radius: 12px;
  padding: 20px;
}
.pm-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  h1 {
    margin: 0;
    font-size: 18px;
    font-weight: 700;
    .cnt {
      color: var(--theme);
      font-size: 14px;
      font-weight: 500;
      margin-left: 4px;
    }
  }
  // 生产右上角同款：橙色文字链，非按钮
  .invite-btn {
    color: var(--theme);
    font-size: 14px;
    text-decoration: none;
    &:hover {
      opacity: 0.75;
    }
  }
}
// 生产同款横向简历卡：左封面缩略图 + 右元信息 + 操作钮
.rv-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}
.rv-card {
  display: flex;
  gap: 16px;
  border: 1px solid rgba(0, 0, 0, 0.06);
  border-radius: 10px;
  padding: 14px;
  .rv-img {
    position: relative;
    width: 120px;
    aspect-ratio: 210 / 297;
    overflow: hidden;
    cursor: pointer;
    flex-shrink: 0;
    border-radius: 6px;
    background: #f5f5f5;
    img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      object-position: top;
      display: block;
    }
    .rv-mask {
      position: absolute;
      inset: 0;
      background: rgba(0, 0, 0, 0.4);
      display: flex;
      align-items: center;
      justify-content: center;
      opacity: 0;
      transition: opacity 0.25s;
      span {
        color: #fff;
        font-size: 12px;
        padding: 6px 12px;
        border: 1px solid #fff;
        border-radius: 999px;
      }
    }
    &:hover .rv-mask {
      opacity: 1;
    }
  }
  .rv-info {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    .rn {
      font-size: 14px;
      font-weight: 600;
      margin: 0;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .rm {
      margin-top: 6px;
      font-size: 13px;
      color: #666;
    }
    .rv-actions {
      margin-top: auto;
      padding-top: 10px;
      display: flex;
      gap: 8px;
      .a {
        border: none;
        background: rgba(0, 0, 0, 0.05);
        color: var(--font-color);
        font-size: 12px;
        border-radius: 6px;
        padding: 5px 14px;
        cursor: pointer;
        &:hover {
          color: var(--theme);
        }
        &.danger {
          color: #f56c6c;
        }
      }
    }
  }
}
.pf-empty {
  padding: 48px 0 40px;
  text-align: center;
  .pe-img {
    width: 150px;
    user-select: none;
  }
  .pe-title {
    margin-top: 16px;
    font-size: 15px;
  }
  .pf-btn {
    margin-top: 20px;
  }
}
.pf-quota {
  margin-top: 20px;
  font-size: 12px;
  color: #999;
  b {
    color: var(--theme);
    margin-right: 4px;
  }
  span {
    color: var(--theme);
    margin: 0 2px;
  }
}
.pf-actions {
  margin-top: 16px;
  display: flex;
  gap: 14px;
  .pf-btn {
    flex: 1;
    justify-content: center;
    padding: 12px 0;
  }
}
.pf-btn {
  display: inline-flex;
  align-items: center;
  border: none;
  border-radius: 8px;
  background: var(--theme);
  color: #fff;
  font-size: 14px;
  padding: 9px 24px;
  cursor: pointer;
  text-decoration: none;
  &:hover {
    opacity: 0.9;
  }
  &.ghost {
    background: transparent;
    color: var(--theme);
    border: 1px solid var(--theme);
  }
}
</style>
