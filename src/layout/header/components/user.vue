<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import ThemeToggle from '@/components/themeToggle.vue'
import AccountSettings from '@/components/AccountSettings.vue'
import useUserStore from '@/store/modules/user'
import { currentUser, logoutLocal, type LocalUser } from '@/utils/auth'
import { getLocalStorage } from '@/common/localstorage'
import { notifyList, notifyRead, notifyUnreadCount, type Notice } from '@/api/modules/notification'

const router = useRouter()
const store = useUserStore()
const user = ref<LocalUser | null>(null)
const settings = ref(false)
const redeemOpen = ref(false)
const redeemCode = ref('')
const redeemMsg = ref('')
const unread = ref(0)

async function refreshUnread() {
  unread.value = user.value ? await notifyUnreadCount() : 0
}

/* 生产同款通知面板：铃铛点击 → 340px 面板（消息通知/全部已读/列表/快捷入口） */
const notices = ref<Notice[]>([])
const noticesLoading = ref(false)
const noticesLoaded = ref(false)
const SHOW = 20

async function loadNotices() {
  if (!user.value) return
  noticesLoading.value = true
  try {
    notices.value = await notifyList()
    noticesLoaded.value = true
  } finally {
    noticesLoading.value = false
  }
}

async function readAll() {
  await notifyRead()
  notices.value = notices.value.map(n => ({ ...n, is_read: 1 }))
  unread.value = 0
}

async function openNotice(n: Notice) {
  if (!n.is_read) {
    await notifyRead(n.id)
    n.is_read = 1
    unread.value = Math.max(0, unread.value - 1)
  }
  if (n.link) router.push(n.link)
}

const fmtTime = (t: number) => {
  const d = new Date(+t)
  return `${d.getMonth() + 1}-${String(d.getDate()).padStart(2, '0')} ${String(
    d.getHours()
  ).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

// 生产面板底部快捷入口（grid-cols-2）
const quickLinks = [
  { title: '个人资料', act: () => (settings.value = true) },
  { title: '我的简历', act: () => router.push('/profile') },
  { title: '我的投递', act: () => router.push('/progress') },
  { title: '我的面经', act: () => router.push('/mianjing/mine') },
  { title: '我的订单', act: () => router.push('/order') },
  { title: '我的邀请', act: () => router.push('/user/invite') }
]

// 与生产一致的用户菜单项（管理员追加后台入口）
const menuItems = computed(() => {
  const items = [
    { title: '个人资料', act: () => (settings.value = true) },
    { title: '我的简历', act: () => router.push('/profile') },
    { title: '我的投递', act: () => router.push('/progress') },
    { title: '我的面经', act: () => router.push('/mianjing/mine') },
    { title: '我的订单', act: () => router.push('/order') },
    { title: '会员中心', act: () => router.push('/member') },
    { title: '我的邀请', act: () => router.push('/user/invite') },
    { title: '兑换码', act: () => (redeemOpen.value = true) }
  ]
  if ((store.userInfo as any).isAdmin)
    items.push({ title: '后台管理', act: () => router.push('/admin') })
  return items
})

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
  refreshUnread()
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
    <!-- 生产未登录态也有：主题切换 + 小程序入口 + 分隔线（探针实测） -->
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
    <el-popover
      v-if="user"
      placement="bottom-end"
      :width="340"
      trigger="click"
      popper-class="bell-panel"
      @show="loadNotices"
    >
      <template #reference>
        <span class="bell">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="1.8"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
            <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
          </svg>
          <i v-if="unread" class="bell-dot">{{ unread > 99 ? '99+' : unread }}</i>
        </span>
      </template>
      <div class="np">
        <div class="np-head">
          <span class="np-title">消息通知</span>
          <button v-if="unread" class="np-readall" @click="readAll">全部已读</button>
        </div>
        <div class="np-body">
          <p v-if="noticesLoading" class="np-state">加载中…</p>
          <p v-else-if="noticesLoaded && !notices.length" class="np-state">
            还没有通知，互动消息会在这里出现
          </p>
          <template v-else>
            <button
              v-for="n in notices.slice(0, SHOW)"
              :key="n.id"
              class="np-item"
              @click="openNotice(n)"
            >
              <i v-if="!n.is_read" class="np-dot"></i>
              <span class="np-main">
                <span class="np-t">{{ n.title || n.content }}</span>
                <span class="np-time">{{ fmtTime(n.created_at) }}</span>
              </span>
            </button>
            <p v-if="notices.length > SHOW" class="np-state small">没有更多了</p>
          </template>
        </div>
        <div class="np-links">
          <button v-for="q in quickLinks" :key="q.title" class="np-link" @click="q.act">
            {{ q.title }}
          </button>
        </div>
      </div>
    </el-popover>
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
  margin-left: auto;
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
.bell {
  position: relative;
  display: flex;
  align-items: center;
  cursor: pointer;
  svg {
    width: 20px;
    height: 20px;
  }
  .bell-dot {
    position: absolute;
    top: -6px;
    right: -8px;
    min-width: 15px;
    height: 15px;
    border-radius: 999px;
    background: #f56c6c;
    color: #fff;
    font-size: 9px;
    font-style: normal;
    line-height: 15px;
    text-align: center;
    padding: 0 3px;
  }
}
/* 生产同款通知面板（340px，消息通知/全部已读/列表/快捷入口栅格） */
.np {
  margin: -12px;
  .np-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 12px 16px 8px;
    .np-title {
      font-size: 13px;
      font-weight: 500;
      color: var(--font-color);
    }
    .np-readall {
      border: none;
      background: transparent;
      font-size: 12px;
      color: var(--theme);
      cursor: pointer;
      padding: 2px 4px;
    }
  }
  .np-body {
    max-height: 300px;
    overflow-y: auto;
    padding: 0 8px;
    .np-state {
      font-size: 12px;
      color: #909399;
      text-align: center;
      padding: 34px 0;
      &.small {
        padding: 8px 0;
      }
    }
    .np-item {
      display: flex;
      align-items: flex-start;
      gap: 8px;
      width: 100%;
      border: none;
      background: transparent;
      text-align: left;
      padding: 9px 8px;
      border-radius: 8px;
      cursor: pointer;
      &:hover {
        background: rgba(0, 0, 0, 0.04);
      }
      .np-dot {
        width: 7px;
        height: 7px;
        border-radius: 50%;
        background: #f56c6c;
        margin-top: 6px;
        flex-shrink: 0;
      }
      .np-main {
        min-width: 0;
        flex: 1;
        .np-t {
          display: block;
          font-size: 13px;
          color: var(--font-color);
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .np-time {
          display: block;
          font-size: 11px;
          color: #b5b8bf;
          margin-top: 2px;
        }
      }
    }
  }
  .np-links {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 4px;
    padding: 8px;
    border-top: 1px solid rgba(0, 0, 0, 0.06);
    margin-top: 4px;
    .np-link {
      border: none;
      background: transparent;
      font-size: 13px;
      color: var(--font-color);
      padding: 8px;
      border-radius: 8px;
      cursor: pointer;
      text-align: center;
      &:hover {
        background: rgba(0, 0, 0, 0.04);
      }
    }
  }
}
.login-btn {
  /* 生产：h-9 px-5 rounded-full 胶囊 */
  height: 36px;
  padding: 0 20px;
  border: none;
  border-radius: 999px;
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
