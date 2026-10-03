<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { templates } from '@/templates/config'
import { currentUser, logoutLocal } from '@/utils/auth'

const router = useRouter()
const user = ref(currentUser())
const resumes = ref<
  { type: string; name: string; tplName: string; img: string; content: string }[]
>([])

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

    <div class="pf-head">
      <div class="u-card">
        <img class="avatar" src="/static/png/avatar1-155VfYeO.png" alt="用户头像" />
        <div>
          <p class="un">{{ user?.name ?? '未登录' }}</p>
          <p class="us">{{ user ? '普通用户' : '登录后可管理云端简历' }}</p>
        </div>
        <div class="u-actions">
          <router-link v-if="!user" to="/login?redirect=/profile" class="pf-btn"
            >去登录</router-link
          >
          <button v-else class="pf-btn ghost" @click="logout">退出登录</button>
        </div>
      </div>
    </div>

    <div class="sec-head">
      <h2>
        我的简历 <span class="n">{{ resumes.length }}</span>
      </h2>
      <router-link to="/jianlimoban" class="pf-btn">新建简历</router-link>
    </div>

    <div v-if="has" class="grid">
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

    <div v-else class="empty-card">
      <svg
        class="e-ic"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="1.5"
        stroke-linecap="round"
        stroke-linejoin="round"
      >
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <path d="M14 2v6h6" />
        <path d="M16 13H8" />
        <path d="M16 17H8" />
        <path d="M10 9H8" />
      </svg>
      <h3>还没有简历</h3>
      <p>去模板中心挑一份模板，开始制作你的简历吧</p>
      <router-link to="/jianlimoban" class="pf-btn">去挑模板</router-link>
    </div>
  </div>
</template>

<style lang="scss">
.pf-page {
  max-width: var(--max-width);
  margin: 0 auto;
  padding: 20px;
  color: var(--font-color);
}
.u-card {
  background: var(--background);
  border-radius: 16px;
  padding: 20px 24px;
  display: flex;
  align-items: center;
  gap: 16px;
  .avatar {
    width: 56px;
    height: 56px;
    border-radius: 999px;
  }
  .un {
    font-size: 17px;
    font-weight: 700;
    margin: 0;
  }
  .us {
    margin-top: 4px;
    font-size: 13px;
    color: #9ca3af;
  }
  .u-actions {
    margin-left: auto;
  }
}
.pf-btn {
  display: inline-flex;
  align-items: center;
  border: none;
  border-radius: 999px;
  background: var(--theme);
  color: #fff;
  font-size: 13px;
  padding: 9px 20px;
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
.sec-head {
  margin: 28px 0 16px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  h2 {
    margin: 0;
    font-size: 18px;
    font-weight: 700;
    .n {
      color: var(--theme);
      font-size: 14px;
      margin-left: 4px;
    }
  }
}
.grid {
  display: grid;
  gap: 16px;
  grid-template-columns: repeat(2, 1fr);
  @media (min-width: 768px) {
    grid-template-columns: repeat(4, 1fr);
  }
}
.rv-card {
  background: var(--background);
  border-radius: 12px;
  overflow: hidden;
  .rv-img {
    position: relative;
    aspect-ratio: 210 / 230;
    overflow: hidden;
    cursor: pointer;
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
.empty-card {
  background: var(--background);
  border-radius: 16px;
  padding: 56px 24px;
  text-align: center;
  .e-ic {
    width: 48px;
    height: 48px;
    color: #d1d5db;
    margin: 0 auto;
  }
  h3 {
    margin: 16px 0 8px;
    font-size: 17px;
  }
  p {
    color: #9ca3af;
    font-size: 14px;
    margin-bottom: 20px;
  }
}
</style>
