<script setup lang="ts">
import { onMounted, reactive, ref, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import { syncLocalCloud } from '@/api/modules/cloudResume'
import useUserStore from '@/store/modules/user'

const router = useRouter()
const route = useRoute()
const store = useUserStore()
const tab = ref<'qr' | 'acct'>('qr')
const agreed = ref(false)
const form = reactive({ username: '', password: '', verify: '' })

onMounted(() => store.genVerify())

function submit(isLogin: boolean) {
  if (!agreed.value) return ElMessage.warning('请先勾选同意用户隐私政策与服务协议')
  store.login(form, isLogin)
}

watch(
  () => store.loginState.logined,
  async v => {
    if (v) {
      await syncLocalCloud()
      router.replace((route.query.redirect as string) || '/profile')
    }
  }
)
</script>

<template>
  <div class="login-page">
    <router-link to="/" class="logo">
      <img src="/static/svg/logo-BFLBP-GO.svg" alt="CodeCV简历" draggable="false" />
    </router-link>
    <div class="login-wrap">
      <img
        src="/static/svg/login-page-CxicEn1V.svg"
        class="illus"
        alt="登录插画"
        draggable="false"
      />
      <div class="vline"></div>
      <div class="login-card">
        <h1>登录 / 注册</h1>
        <p class="sub">登录开启沉浸式简历编写体验</p>
        <div class="tabs">
          <span :class="{ on: tab === 'qr' }" @click="tab = 'qr'">微信扫码</span>
          <span :class="{ on: tab === 'acct' }" @click="tab = 'acct'">账号密码</span>
        </div>
        <template v-if="tab === 'qr'">
          <div class="qr-box">
            <img src="/prod-assets/miniprogram.webp" alt="微信扫码登录" class="qr" />
          </div>
          <p class="qr-tip">请使用微信扫码完成登录</p>
        </template>
        <div v-else class="acct-form">
          <input v-model="form.username" class="acct-input" placeholder="用户名" maxlength="32" />
          <input
            v-model="form.password"
            class="acct-input"
            type="password"
            placeholder="密码"
            maxlength="64"
          />
          <div class="acct-verify">
            <input v-model="form.verify" class="acct-input" placeholder="验证码" maxlength="4" />
            <img
              :src="store.loginState.verifyImg"
              class="vimg"
              alt="验证码"
              title="点击换一张"
              @click="store.genVerify()"
            />
          </div>
          <div class="acct-btns">
            <button class="mock" @click="submit(true)">登录</button>
            <button class="mock ghost" @click="submit(false)">注册</button>
          </div>
        </div>
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
    margin: 10px 0 20px;
    font-size: 14px;
    color: #9ca3af;
  }
}
.tabs {
  display: flex;
  gap: 28px;
  margin-bottom: 20px;
  span {
    font-size: 15px;
    color: #9ca3af;
    cursor: pointer;
    padding-bottom: 6px;
    border-bottom: 2px solid transparent;
    &.on {
      color: var(--font-color);
      font-weight: 600;
      border-bottom-color: var(--theme);
    }
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
}
.qr-tip {
  margin-top: 18px;
  font-size: 13px;
  color: #9ca3af;
}
.acct-form {
  width: 280px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  .acct-input {
    border: 1px solid #e5e7eb;
    border-radius: 8px;
    padding: 10px 12px;
    font-size: 14px;
    outline: none;
    background: var(--background);
    color: var(--font-color);
    &:focus {
      border-color: var(--theme);
    }
  }
  .acct-verify {
    display: flex;
    gap: 8px;
    align-items: center;
    .acct-input {
      flex: 1;
    }
    .vimg {
      height: 38px;
      border-radius: 6px;
      border: 1px solid #eee;
      cursor: pointer;
    }
  }
  .acct-btns {
    display: flex;
    gap: 10px;
    margin-top: 6px;
  }
}
.mock {
  flex: 1;
  border: none;
  border-radius: 999px;
  background: var(--theme);
  color: #fff;
  font-size: 14px;
  padding: 10px 0;
  cursor: pointer;
  &:hover {
    opacity: 0.9;
  }
  &.ghost {
    background: transparent;
    color: var(--theme);
    border: 1px solid var(--theme);
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
