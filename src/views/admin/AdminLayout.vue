<script setup lang="ts">
// 后台外壳：左侧菜单 + 内容区。守卫：未登录/非管理员回 /profile（与 prod chunk-admin 同语义）
import { onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { admin } from '@/api/modules/admin'
import { currentUser } from '@/utils/auth'

const route = useRoute()
const router = useRouter()
const ready = ref(false)

const MENUS = [
  { path: '/admin/workbench', name: '工作台', icon: '📊' },
  { path: '/admin/statistics', name: '数据统计', icon: '📈' },
  { path: '/admin/user', name: '用户管理', icon: '👤' },
  { path: '/admin/resume', name: '简历管理', icon: '📄' },
  { path: '/admin/template', name: '模板管理', icon: '🧩' },
  { path: '/admin/history', name: '历史版本', icon: '🕘' },
  { path: '/admin/post', name: '攻略管理', icon: '📝' },
  { path: '/admin/mianjing', name: '面经审核', icon: '💬' },
  { path: '/admin/mianjing/comments', name: '面经评论', icon: '💭' },
  { path: '/admin/mianjing/activity', name: '创作大赛', icon: '🏆' },
  { path: '/admin/topic', name: '话题管理', icon: '🏷️' },
  { path: '/admin/order', name: '订单管理', icon: '🛒' },
  { path: '/admin/vipCode', name: '会员码', icon: '🎟️' },
  { path: '/admin/invite', name: '邀请记录', icon: '🤝' },
  { path: '/admin/progress', name: '投递进度', icon: '📮' },
  { path: '/admin/advertiseSpace', name: '广告位', icon: '📐' },
  { path: '/admin/advertise', name: '广告管理', icon: '📢' },
  { path: '/admin/exportStats', name: '导出统计', icon: '⬇️' },
  { path: '/admin/proofreadStats', name: '校对统计', icon: '🔍' }
]

onMounted(async () => {
  document.title = '后台管理 - CodeCV简历'
  const user = currentUser()
  if (!user) return router.replace('/profile')
  try {
    const res = await admin.identity()
    if (res?.code !== 200 || !res.data?.isAdmin) return router.replace('/profile')
  } catch {
    return router.replace('/profile')
  }
  ready.value = true
})
</script>

<template>
  <div v-if="ready" class="adm">
    <aside class="adm-side">
      <router-link to="/" class="adm-logo">
        <img src="/prod-assets/logo.svg" alt="CodeCV" />
        <span>CodeCV 后台</span>
      </router-link>
      <nav>
        <router-link
          v-for="m in MENUS"
          :key="m.path"
          :to="m.path"
          class="adm-link"
          :class="{ on: route.path === m.path || route.path.startsWith(m.path + '/') }"
        >
          <i>{{ m.icon }}</i
          >{{ m.name }}
        </router-link>
      </nav>
    </aside>
    <main class="adm-main">
      <header class="adm-top">
        <h2>{{ MENUS.find(m => route.path.startsWith(m.path))?.name || '后台' }}</h2>
        <router-link to="/" class="adm-back">返回站点 →</router-link>
      </header>
      <router-view />
    </main>
  </div>
</template>

<style scoped>
.adm {
  display: flex;
  min-height: 100vh;
  background: #f5f6f8;
  color: var(--font-color);
}
.adm-side {
  width: 208px;
  flex-shrink: 0;
  background: #fff;
  border-right: 1px solid rgba(0, 0, 0, 0.06);
  padding: 16px 10px;
  position: sticky;
  top: 0;
  height: 100vh;
  overflow-y: auto;
}
.adm-logo {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 12px 16px;
  font-weight: 700;
  font-size: 15px;
  text-decoration: none;
  color: var(--font-color);
  img {
    width: 24px;
    height: 24px;
  }
}
.adm-link {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 9px 12px;
  border-radius: 10px;
  font-size: 13.5px;
  text-decoration: none;
  color: rgba(0, 0, 0, 0.62);
  margin-bottom: 2px;
  i {
    font-style: normal;
    font-size: 15px;
    width: 20px;
    text-align: center;
  }
  &:hover {
    background: rgba(255, 87, 34, 0.06);
    color: var(--theme);
  }
  &.on {
    background: rgba(255, 87, 34, 0.1);
    color: var(--theme);
    font-weight: 600;
  }
}
.adm-main {
  flex: 1;
  min-width: 0;
  padding: 20px 24px 60px;
}
.adm-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 18px;
  h2 {
    font-size: 18px;
    font-weight: 700;
  }
}
.adm-back {
  font-size: 13px;
  color: rgba(0, 0, 0, 0.5);
  text-decoration: none;
  &:hover {
    color: var(--theme);
  }
}
@media (max-width: 860px) {
  .adm-side {
    width: 64px;
  }
  .adm-link {
    justify-content: center;
    font-size: 0;
    i {
      font-size: 17px;
    }
  }
  .adm-logo span {
    display: none;
  }
}
</style>
