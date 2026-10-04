<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import ThemeToggle from '@/components/themeToggle.vue'
import AccountSettings from '@/components/AccountSettings.vue'
import useUserStore from '@/store/modules/user'
import { currentUser, logoutLocal, type LocalUser } from '@/utils/auth'
import { getLocalStorage } from '@/common/localstorage'

const router = useRouter()
const store = useUserStore()
const user = ref<LocalUser | null>(null)
const settings = ref(false)
const redeemOpen = ref(false)
const redeemCode = ref('')
const redeemMsg = ref('')

// 与生产一致的用户菜单项
const menuItems = [
  { title: '个人资料', act: () => (settings.value = true) },
  { title: '我的简历', act: () => router.push('/profile') },
  { title: '我的投递', act: () => router.push('/progress') },
  { title: '我的面经', act: () => router.push('/mianjing/mine') },
  { title: '我的订单', act: () => router.push('/order') },
  { title: '会员中心', act: () => router.push('/member') },
  { title: '我的邀请', act: () => router.push('/user/invite') },
  { title: '兑换码', act: () => (redeemOpen.value = true) }
]

const nickName = computed(() => store.userInfo.nickName || user.value?.name || '')
const avatarLetter = computed(() => (nickName.value || 'U').slice(0, 1).toUpperCase())

async function redeem() {
  redeemMsg.value = ''
  const code = redeemCode.value.trim()
  if (code.length < 6) {
    redeemMsg.value = '兑换码格式不正确'
    return
  }
  try {
    const res: any = await fetch('/user/redeem', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: getLocalStorage('USERNAME'), code })
    }).then(r => r.json())
    redeemMsg.value = res?.msg || '兑换失败'
  } catch {
    redeemMsg.value = '网络异常，请稍后再试'
  }
}
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
    <span class="tt-wrap"><theme-toggle /></span>
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
      <span class="u-entry">
        <img v-if="store.userInfo.avatar" :src="store.userInfo.avatar" class="u-avatar" />
        <span v-else class="u-avatar u-letter">{{ avatarLetter }}</span>
        <span class="u-name">{{ nickName }}</span>
      </span>
      <template #dropdown>
        <el-dropdown-menu>
          <el-dropdown-item v-for="m in menuItems" :key="m.title" @click="m.act">{{
            m.title
          }}</el-dropdown-item>
          <el-dropdown-item divided @click="logout">退出登录</el-dropdown-item>
        </el-dropdown-menu>
      </template>
    </el-dropdown>
    <button v-else class="login-btn" @click="router.push('/login')">登录 / 注册</button>
    <AccountSettings v-model="settings" />
    <el-dialog v-model="redeemOpen" title="兑换码" width="380px">
      <div class="redeem-box">
        <input
          v-model="redeemCode"
          class="redeem-input"
          placeholder="请输入兑换码"
          maxLength="32"
        />
        <p v-if="redeemMsg" class="redeem-msg">{{ redeemMsg }}</p>
        <button class="save-btn" @click="redeem">立即兑换</button>
      </div>
    </el-dialog>
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
.u-entry {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  .u-avatar {
    width: 32px;
    height: 32px;
    border-radius: 50%;
    object-fit: cover;
  }
  .u-letter {
    display: flex;
    align-items: center;
    justify-content: center;
    background: var(--theme);
    color: #fff;
    font-size: 14px;
    font-weight: 600;
  }
  .u-name {
    font-size: 14px;
    color: var(--font-color);
    max-width: 90px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
}
.redeem-box {
  display: flex;
  flex-direction: column;
  gap: 12px;
  .redeem-input {
    height: 38px;
    padding: 0 12px;
    border-radius: 8px;
    border: 1px solid rgba(0, 0, 0, 0.12);
    background: var(--body-background);
    color: var(--font-color);
    font-size: 14px;
    outline: none;
    &:focus {
      border-color: var(--theme);
    }
  }
  .redeem-msg {
    font-size: 13px;
    color: #e6a23c;
    margin: 0;
  }
  .save-btn {
    height: 38px;
    border: none;
    border-radius: 8px;
    background: var(--theme);
    color: #fff;
    font-size: 14px;
    cursor: pointer;
    &:hover {
      opacity: 0.9;
    }
  }
}
</style>
