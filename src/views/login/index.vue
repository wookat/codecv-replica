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
    <div class="login-card">
      <h2>登录开启简历世界</h2>
      <div class="qr-box" :class="{ scanned: scanning }">
        <img src="/static/webp/wxmp-CPjs_7at.webp" alt="微信扫码登录" class="qr" />
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
      <p class="tip">微信扫码登录</p>
      <p class="tip sub">请及时扫码完成登录</p>

      <button class="mock" @click="mockLogin">{{ scanning ? '登录中…' : '模拟扫码完成' }}</button>

      <label class="agree">
        <input v-model="agreed" type="checkbox" />
        <span>登录表示您同意该<a href="javascript:;">用户隐私政策与服务协议</a></span>
      </label>
    </div>
  </div>
</template>

<style lang="scss">
.login-page {
  min-height: 70vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
}
.login-card {
  background: var(--background);
  border-radius: 16px;
  padding: 40px 48px;
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.08);
  display: flex;
  flex-direction: column;
  align-items: center;
  h2 {
    margin: 0 0 24px;
    font-size: 20px;
    font-weight: 700;
    color: var(--font-color);
  }
}
.qr-box {
  position: relative;
  width: 200px;
  height: 200px;
  border-radius: 12px;
  overflow: hidden;
  border: 1px solid rgba(0, 0, 0, 0.06);
  .qr {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
  .qr-ok {
    position: absolute;
    inset: 0;
    background: rgba(255, 255, 255, 0.9);
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 8px;
    color: #22c55e;
    font-weight: 600;
    svg {
      width: 40px;
      height: 40px;
    }
  }
}
.tip {
  margin: 16px 0 0;
  font-size: 15px;
  font-weight: 600;
  color: var(--font-color);
  &.sub {
    margin-top: 4px;
    font-size: 12px;
    font-weight: 400;
    color: #9ca3af;
  }
}
.mock {
  margin-top: 20px;
  border: none;
  border-radius: 999px;
  background: var(--theme);
  color: #fff;
  font-size: 14px;
  padding: 10px 32px;
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
