<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { templates } from '@/templates/config'
import { currentUser, logoutLocal } from '@/utils/auth'
import LoginModal from '@/components/LoginModal.vue'

const router = useRouter()
const user = ref(currentUser())
const loginModal = ref(false)
const resumes = ref<
  { type: string; name: string; tplName: string; img: string; content: string }[]
>([])

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

function scan() {
  const list: typeof resumes.value = []
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i) ?? ''
    if (!key.startsWith('markdown-content-')) continue
    const type = key.slice('markdown-content-'.length)
    try {
      const raw = JSON.parse(localStorage.getItem(key) || '{}')
      const md: string = raw?.value ?? ''
      if (!md) continue
      const firstLine = md.split('\n').find(l => l.trim().startsWith('#'))
      const name =
        firstLine
          ?.replace(/^#+\s*/, '')
          .replace(/!bg\[|\]\([^)]*\)|\*/g, '')
          .trim() || '未命名简历'
      const tpl = templates.value.find(t => t.type === type)
      list.push({ type, name, tplName: tpl?.name ?? type, img: tpl?.img ?? '', content: md })
    } catch {
      /* ignore */
    }
  }
  resumes.value = list
}

const has = computed(() => resumes.value.length > 0)

function edit(type: string) {
  router.push(`/editor/${type}`)
}

async function remove(type: string) {
  await ElMessageBox.confirm('删除后不可恢复，确定删除这份简历吗？', '删除简历', {
    type: 'warning'
  })
  localStorage.removeItem(`markdown-content-${type}`)
  scan()
  ElMessage.success('已删除')
}

function logout() {
  logoutLocal()
  user.value = null
  ElMessage.success('已退出登录')
}

onMounted(scan)
</script>

<template>
  <div class="pf-page">
    <h1 class="sr-only">我的简历_简历管理_在线简历列表</h1>
    <div class="pf-cols">
      <!-- 左侧小程序卡 -->
      <aside class="pf-aside">
        <h4>🎉 使用小程序管理投递进度</h4>
        <div class="qr-wrap">
          <img src="/prod-assets/miniprogram.webp" alt="小程序投递进度管理" />
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
        <button v-if="user" class="pf-logout" @click="logout">退出登录</button>
      </aside>

      <!-- 右侧简历卡 -->
      <div class="pf-main">
        <div class="pm-head">
          <h1>
            我的简历
            <span v-if="user" class="cnt">{{ resumes.length }}/{{ '无限制' }}</span>
          </h1>
          <router-link to="/invite" class="invite-btn">🎁 邀请赚佣金</router-link>
        </div>

        <div v-if="user && has" class="rv-grid">
          <div v-for="r in resumes" :key="r.type" class="rv-card">
            <div class="rv-img" @click="edit(r.type)">
              <img v-if="r.img" :src="r.img" :alt="r.tplName" loading="lazy" />
              <div class="rv-mask"><span>继续编辑</span></div>
            </div>
            <div class="rv-info">
              <p class="rn">{{ r.name }}</p>
              <p class="rt">模板：{{ r.tplName }}</p>
              <div class="rv-actions">
                <button class="a" @click="edit(r.type)">编辑</button>
                <button class="a danger" @click="remove(r.type)">删除</button>
              </div>
            </div>
          </div>
        </div>

        <div v-else class="pf-empty">
          <img class="pe-img" src="/prod-assets/empty.svg" alt="啊哦～当前搜索结果为空" />
          <p class="pe-title">
            {{ user ? '这里空空如也，您还没有创建过简历～' : '您还没有登录请先登录再查看' }}
          </p>
          <div v-if="user" class="pe-acts">
            <router-link to="/jianlimoban" class="pf-btn">手动创建</router-link>
            <router-link to="/resume/import" class="pf-btn ghost">导入简历</router-link>
          </div>
          <button v-else class="pf-btn" @click="loginModal = true">去登录</button>
        </div>

        <p v-if="user" class="pf-quota">
          <b>温馨提示</b>：您还可以再创建 <span>无限</span>份简历
          ，如果您在编写简历过程中遇到任何使用上的问题，都可以通过右下角方式联系网站客服，我们会尽快解决。
        </p>
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
  .pf-logout {
    margin-top: 16px;
    border: none;
    background: rgba(0, 0, 0, 0.05);
    color: #888;
    font-size: 12px;
    border-radius: 6px;
    padding: 6px 14px;
    cursor: pointer;
    &:hover {
      color: var(--theme);
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
  .invite-btn {
    background: var(--theme);
    color: #fff;
    font-size: 13px;
    padding: 8px 18px;
    border-radius: 999px;
    text-decoration: none;
    &:hover {
      opacity: 0.9;
    }
  }
}
.rv-grid {
  display: grid;
  gap: 20px;
  grid-template-columns: 1fr;
  @media (min-width: 1024px) {
    grid-template-columns: repeat(2, 1fr);
  }
}
.rv-card {
  background: var(--body-background);
  border-radius: 12px;
  overflow: hidden;
  display: flex;
  .rv-img {
    position: relative;
    width: 150px;
    aspect-ratio: 210 / 230;
    overflow: hidden;
    cursor: pointer;
    flex-shrink: 0;
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
        font-size: 14px;
        padding: 8px 16px;
        border: 1px solid #fff;
        border-radius: 999px;
      }
    }
    &:hover .rv-mask {
      opacity: 1;
    }
  }
  .rv-info {
    padding: 12px;
    flex: 1;
    min-width: 0;
    .rn {
      font-size: 14px;
      font-weight: 600;
      margin: 0;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .rt {
      margin-top: 4px;
      font-size: 12px;
      color: #9ca3af;
    }
    .rv-actions {
      margin-top: 10px;
      display: flex;
      gap: 8px;
      .a {
        border: none;
        background: rgba(0, 0, 0, 0.05);
        color: var(--font-color);
        font-size: 12px;
        border-radius: 6px;
        padding: 5px 12px;
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
  .pe-acts {
    margin-top: 20px;
    display: flex;
    gap: 12px;
    justify-content: center;
  }
  .pf-btn {
    margin-top: 20px;
  }
  .pe-acts .pf-btn {
    margin-top: 0;
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
</style>
