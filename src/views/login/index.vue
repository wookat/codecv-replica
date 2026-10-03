<script setup lang="ts">
import { ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import { loginLocal } from '@/utils/auth'

const router = useRouter()
const route = useRoute()
const scanning = ref(false)
const agreed = ref(false)

function mockLogin() {
  if (!agreed.value) return ElMessage.warning('请先勾选同意用户隐私政策与服务协议')
  scanning.value = true
  // 复刻版本地模拟扫码成功（线上为微信扫码 + code 换 token）
  setTimeout(() => {
    loginLocal('微信用户')
    ElMessage.success('登录成功')
    router.replace((route.query.redirect as string) || '/profile')
  }, 900)
}
</script>

<template>
  <div class="login-page">
    <router-link to="/" class="logo">
      <img src="/prod-assets/logo.svg" alt="CodeCV简历" draggable="false" />
    </router-link>
    <div class="login-wrap">
      <img src="/prod-assets/login-page.svg" class="illus" alt="登录插画" draggable="false" />
      <div class="vline"></div>
      <div class="login-card">
        <h1>微信扫码登录注册</h1>
        <p class="sub">登录开启沉浸式简历编写体验</p>
        <div class="qr-box" :class="{ scanned: scanning }">
          <img src="/prod-assets/miniprogram.webp" alt="微信扫码登录" class="qr" />
          <div v-if="scanning" class="qr-ok">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2.5"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <path d="M20 6 9 17l-5-5" />
            </svg>
            <span>已确认</span>
          </div>
        </div>
        <button class="mock" @click="mockLogin">{{ scanning ? '登录中…' : '模拟扫码完成' }}</button>
        <label class="agree">
          <input v-model="agreed" type="checkbox" />
          <span>登录表示您同意该<a href="javascript:;">用户隐私政策与服务协议</a></span>
        </label>
      </div>
    </div>
  </div>
</template>

<style lang="scss">
.login-page {
  position: relative;
  min-height: calc(100vh - 60px);
  background: var(--body-background);
  .logo {
    position: fixed;
    top: 20px;
    left: 30px;
    z-index: 5;
    img {
      width: 80px;
      height: 60px;
      transform: scale(1.4);
      transform-origin: top left;
      object-fit: contain;
    }
  }
}
.login-wrap {
  min-height: calc(100vh - 60px);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 60px;
  padding: 40px;
  .illus {
    width: 45%;
    max-width: 600px;
    @media (max-width: 900px) {
      display: none;
    }
  }
  .vline {
    width: 1px;
    height: 420px;
    background: linear-gradient(to bottom, transparent, rgba(0, 0, 0, 0.15), transparent);
    @media (max-width: 900px) {
      display: none;
    }
  }
}
.login-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  h1 {
    margin: 0;
    font-size: 22px;
    font-weight: 700;
    color: var(--font-color);
  }
  .sub {
    margin: 10px 0 28px;
    font-size: 14px;
    color: #9ca3af;
  }
}
.qr-box {
  position: relative;
  width: 280px;
  height: 280px;
  border-radius: 50%;
  overflow: hidden;
  border: 6px solid #fff;
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.1);
  .qr {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
  .qr-ok {
    position: absolute;
    inset: 0;
    background: rgba(255, 255, 255, 0.92);
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 8px;
    color: #22c55e;
    font-weight: 600;
    svg {
      width: 48px;
      height: 48px;
    }
  }
}
.mock {
  margin-top: 24px;
  border: none;
  border-radius: 999px;
  background: var(--theme);
  color: #fff;
  font-size: 14px;
  padding: 10px 36px;
  cursor: pointer;
  &:hover {
    opacity: 0.9;
  }
}
.agree {
  margin-top: 20px;
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: #9ca3af;
  cursor: pointer;
  a {
    color: var(--theme);
  }
}
</style>
