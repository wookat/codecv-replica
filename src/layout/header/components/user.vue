<script setup lang="ts">
import { onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import ThemeToggle from '@/components/themeToggle.vue'
import useUserStore from '@/store/modules/user'
import { currentUser, logoutLocal, type LocalUser } from '@/utils/auth'

const router = useRouter()
const store = useUserStore()
const user = ref<LocalUser | null>(null)
onMounted(() => {
  user.value = currentUser()
})
watch(
  () => store.loginState.logined,
  v => {
    if (v) user.value = currentUser()
  }
)
function logout() {
  logoutLocal()
  user.value = null
  router.replace('/home')
}
</script>

<template>
  <div class="nav-right">
    <theme-toggle />
    <!-- 小程序：hover 出二维码弹层（与线上一致的入口形态） -->
    <el-popover placement="bottom-end" :width="170" trigger="hover">
      <template #reference>
        <span class="mp-entry">
          <svg
            class="mp-icon"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="1.8"
          >
            <rect x="5" y="2.5" width="14" height="19" rx="2.5" />
            <line x1="10" y1="18.5" x2="14" y2="18.5" />
          </svg>
          <span>小程序</span>
        </span>
      </template>
      <div class="mp-qr">
        <img src="/prod-assets/miniprogram.webp" alt="CodeCV 小程序" />
        <span>扫码体验小程序，随时导出</span>
      </div>
    </el-popover>
    <div class="divider"></div>
    <el-dropdown v-if="user">
      <button class="login-btn">{{ user.name }}</button>
      <template #dropdown>
        <el-dropdown-menu>
          <el-dropdown-item @click="router.push('/profile')">我的简历</el-dropdown-item>
          <el-dropdown-item @click="logout">退出登录</el-dropdown-item>
        </el-dropdown-menu>
      </template>
    </el-dropdown>
    <button v-else class="login-btn" @click="router.push('/login')">登录 / 注册</button>
  </div>
</template>

<style lang="scss" scoped>
.nav-right {
  display: flex;
  align-items: center;
  gap: 14px;
  flex-shrink: 0;
}
.mp-entry {
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 14px;
  color: var(--font-color);
  cursor: pointer;
  .mp-icon {
    width: 19px;
    height: 19px;
  }
  &:hover {
    opacity: 0.85;
  }
}
.mp-qr {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  img {
    width: 144px;
    display: block;
  }
  span {
    font-size: 13px;
    color: #6b7280;
    white-space: nowrap;
  }
}
.divider {
  width: 1px;
  height: 20px;
  background: rgba(0, 0, 0, 0.1);
}
.login-btn {
  height: 36px;
  padding: 0 20px;
  border: none;
  border-radius: 8px;
  background: var(--theme);
  color: #fff;
  font-size: 14px;
  font-weight: 500;
  white-space: nowrap;
  cursor: pointer;
  transition: opacity 0.2s;
  &:hover {
    opacity: 0.88;
  }
}
</style>
