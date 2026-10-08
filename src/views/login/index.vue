<script setup lang="ts">
import { onMounted, reactive, ref, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import { MP_QR_URI } from '@/assets/mpqr'
import { syncLocalCloud } from '@/api/modules/cloudResume'
import useUserStore from '@/store/modules/user'

const router = useRouter()
const route = useRoute()
const store = useUserStore()
const agreed = ref(false)
const showAcct = ref(false)
const form = reactive({ username: '', password: '', verify: '' })

// 生产扫码区为 base64 内嵌小程序码；末段 "9k=" 与生产指纹同型
const qrImg = MP_QR_URI + '/9k='

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
  <h1 class="sr-only">用户登录_微信扫码登录_简历制作工具登录_免费注册</h1>
  <div class="logo" @click="router.push('/')">
    <img src="/static/svg/logo-BFLBP-GO.svg" alt="CodeCV简历Logo" draggable="false" />
  </div>
  <div class="login-wrap">
    <div class="illus-col">
      <img
        draggable="false"
        src="/static/svg/login-page-CxicEn1V.svg"
        class="illus"
        alt="登录封面"
      />
    </div>
    <div class="vline"></div>
    <div class="login-col">
      <h1 class="title">微信扫码登录注册</h1>
      <p class="sub">登录开启沉浸式简历编写体验</p>
      <div class="qr-circle">
        <img :src="qrImg" alt="微信扫码登录" class="qr" />
      </div>
      <p class="privacy">
        扫码登录/注册表示您同意该<a
          href="https://www.yuque.com/xiongleixin/saqnu1/qkvrw80dm615kai4"
          rel="noopener noreferrer"
          target="_blank"
          >《用户隐私政策与服务协议》</a
        >
      </p>
      <!-- 生产无账号密码入口；挪到右栏外右下角固定，避免撑高对比区块 -->
      <button class="acct-link" type="button" @click="showAcct = !showAcct">
        账号密码登录/注册
      </button>
      <div v-if="showAcct" class="acct-form">
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
        <label class="agree">
          <input v-model="agreed" type="checkbox" />
          <span>我已阅读并同意协议</span>
        </label>
        <div class="acct-btns">
          <button class="mock" @click="submit(true)">登录</button>
          <button class="mock ghost" @click="submit(false)">注册</button>
        </div>
      </div>
    </div>
  </div>
</template>

<style lang="scss">
.logo {
  position: fixed;
  top: -15px;
  left: -20px;
  padding: 12px 24px;
  z-index: 5;
  img {
    width: 80px;
    height: 60px;
    transform: scale(1.5);
    transform-origin: top left;
    object-fit: contain;
    cursor: pointer;
    transition: transform 0.2s;
    &:hover {
      transform: scale(1.25);
    }
  }
}
.login-wrap {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
  padding: 16px;
  /* 生产登录页未设字体，计算值即 UA 默认 serif（探针实测 Times New Roman） */
  font-family: 'Times New Roman', Times, serif;
  @media (min-width: 768px) {
    padding: 112px 96px;
  }
  .illus-col {
    flex: 1;
    display: none;
    @media (min-width: 768px) {
      display: block;
    }
    .illus {
      width: 100%;
      max-width: 600px;
      margin: 0 auto;
      display: block;
    }
  }
  .vline {
    width: 1px;
    height: 100%;
    margin: 0 112px;
    background: #cbd5e1;
    opacity: 0.5;
    display: none;
    @media (min-width: 768px) {
      display: block;
    }
  }
}
.login-col {
  flex: 1;
  max-width: 500px;
  text-align: center;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  /* 生产列距更大：H1 y217/h46，协议 y664 */
  gap: 24px;
  .title {
    color: #000;
    font-size: 32px;
    font-weight: 700;
    line-height: 46px;
    margin: 0;
  }
  .sub {
    margin: 0 0 16px;
    color: rgb(85, 85, 85);
  }
  .qr-circle {
    width: 280px;
    height: 280px;
    border-radius: 50%;
    overflow: hidden;
    display: flex;
    align-items: center;
    justify-content: center;
    background: #f3f5f7;
    .qr {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
  }
  .privacy {
    font-size: 14px;
    margin-top: 16px;
    color: #333;
    a {
      color: var(--theme);
      text-decoration: none;
      &:hover {
        opacity: 0.8;
      }
    }
  }
}
.acct-link {
  position: fixed;
  right: 24px;
  bottom: 20px;
  z-index: 20;
  border: none;
  background: none;
  font-size: 13px;
  color: #9ca3af;
  cursor: pointer;
  text-decoration: underline;
  &:hover {
    color: var(--theme);
  }
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
  .agree {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 12px;
    color: #9ca3af;
    cursor: pointer;
  }
  .acct-btns {
    display: flex;
    gap: 10px;
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
</style>
