<script setup lang="ts">
import { onMounted, reactive, ref, watch } from 'vue'
import { getLocalStorage } from '@/common/localstorage'
import { syncLocalCloud } from '@/api/modules/cloudResume'
import useUserStore, { TOKEN } from '@/store/modules/user'

const emit = defineEmits<(e: 'close') => void>()

const store = useUserStore()
const accountMode = ref(false)
const form = reactive({ username: '', password: '', verify: '' })

onMounted(() => store.genVerify())

function submit(isLogin: boolean) {
  store.login(form, isLogin)
}

watch(
  () => store.loginState.logined,
  async v => {
    if (v) {
      await syncLocalCloud()
      emit('close')
    }
  }
)
// 已登录态直达（弹窗打开时已有 token）
if (getLocalStorage(TOKEN)) emit('close')
</script>

<template>
  <teleport to="body">
    <div class="lm-mask" @click.self="emit('close')">
      <div class="lm-box">
        <img
          class="lm-x"
          src="data:image/svg+xml,%3csvg%20width='20'%20fill='%23666'%20height='20'%20viewBox='-0.15%20-0.15%200.6%200.6'%20xmlns='http://www.w3.org/2000/svg'%20preserveAspectRatio='xMinYMin'%20class='jam%20jam-close'%3e%3cpath%20d='M.183.148.271.06A.025.025%200%201%200%20.236.024L.147.112.059.024a.025.025%200%201%200-.035.035l.088.088-.088.089a.025.025%200%201%200%20.035.035L.147.183l.088.088A.025.025%200%201%200%20.27.236L.183.147z'%20/%3e%3c/svg%3e"
          alt="关闭"
          @click="emit('close')"
        />
        <div class="lm-left">
          <h4>登录开启简历世界</h4>
          <p><span>☁️</span> 简历数据云端存储 确保数据不丢失</p>
          <p><span>🎉</span> AI 助你一臂之力 写简历不再困难</p>
          <p><span>🌈</span> 开启内容创作 不仅限于简历模板</p>
          <img class="lm-illus" src="/prod-assets/login-C4YS7qXb.svg" alt="CodeCV简历" />
        </div>
        <div class="lm-right">
          <template v-if="!accountMode">
            <h4>微信扫码登录</h4>
            <div class="lm-qr lm-qr-soon">微信扫码登录<br />即将开放</div>
            <p class="lm-tip">微信扫码登录即将开放，请使用账号密码登录</p>
            <p class="lm-agree">
              登录表示您同意该<a href="/agreement" target="_blank" rel="noopener"
                >用户隐私政策与服务协议</a
              >
            </p>
            <button class="lm-acct" @click="accountMode = true">使用账号密码登录 / 注册</button>
          </template>
          <template v-else>
            <h4>账号登录 / 注册</h4>
            <div class="lm-form">
              <input v-model="form.username" class="lm-input" placeholder="用户名" maxlength="32" />
              <input
                v-model="form.password"
                class="lm-input"
                type="password"
                placeholder="密码"
                maxlength="64"
              />
              <div class="lm-verify">
                <input v-model="form.verify" class="lm-input" placeholder="验证码" maxlength="4" />
                <img
                  :src="store.loginState.verifyImg"
                  class="lm-vimg"
                  alt="验证码"
                  title="点击换一张"
                  @click="store.genVerify()"
                />
              </div>
              <div class="lm-btns">
                <button class="lm-btn" @click="submit(true)">登录</button>
                <button class="lm-btn ghost" @click="submit(false)">注册</button>
              </div>
              <button class="lm-back" @click="accountMode = false">‹ 返回微信扫码</button>
            </div>
          </template>
        </div>
      </div>
    </div>
  </teleport>
</template>

<style lang="scss">
.lm-mask {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.55);
  z-index: 3000;
  display: flex;
  align-items: center;
  justify-content: center;
}
.lm-box {
  position: relative;
  display: flex;
  min-width: 550px;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.25);
  .lm-x {
    position: absolute;
    top: 8px;
    right: 8px;
    z-index: 50;
    width: 20px;
    height: 20px;
    padding: 2px;
    cursor: pointer;
  }
}
.lm-left {
  flex: 0 0 285px;
  background: var(--theme);
  color: #fff;
  padding: 28px 0 20px 20px;
  h4 {
    margin-top: 12px;
    font-size: 16px;
    font-weight: 700;
  }
  p {
    margin-top: 12px;
    font-size: 14px;
    line-height: 2;
    span {
      font-size: 14px;
      margin-right: 2px;
    }
  }
  .lm-illus {
    margin-top: 20px;
    margin-left: 8px;
    width: 176px;
    user-select: none;
  }
}
.lm-right {
  flex: 1;
  background: #fff;
  padding: 20px;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  h4 {
    padding-bottom: 20px;
    color: #333;
    font-size: 16px;
    font-weight: 600;
  }
  .lm-qr {
    width: 192px;
    height: 192px;
    border-radius: 999px;
    object-fit: cover;
    user-select: none;
    background: linear-gradient(100deg, #eee 40%, #f7f7f7 50%, #eee 60%);
    background-size: 300% 100%;
    animation: lm-shimmer 2.4s linear infinite;
    &.lm-qr-soon {
      display: flex;
      align-items: center;
      justify-content: center;
      text-align: center;
      color: #9aa2b1;
      font-size: 15px;
      line-height: 1.8;
      animation: none;
      background: #f3f5f7;
    }
  }
  @keyframes lm-shimmer {
    0% {
      background-position: 120% 0;
    }
    100% {
      background-position: -180% 0;
    }
  }
  .lm-tip {
    margin-top: 14px;
    font-size: 12px;
    color: #333;
    b {
      color: var(--theme);
      font-weight: 500;
      margin: 0 4px;
    }
  }
  .lm-agree {
    margin-top: 14px;
    font-size: 12px;
    color: #333;
    a {
      color: var(--theme);
      text-decoration: none;
      &:hover {
        opacity: 0.8;
      }
    }
  }
  .lm-acct {
    margin-top: 16px;
    border: none;
    background: none;
    color: var(--theme);
    font-size: 13px;
    cursor: pointer;
    text-decoration: underline;
  }
}
.lm-form {
  display: flex;
  flex-direction: column;
  gap: 12px;
  width: 100%;
  .lm-input {
    border: 1px solid #e5e7eb;
    border-radius: 8px;
    padding: 10px 12px;
    font-size: 14px;
    outline: none;
    &:focus {
      border-color: var(--theme);
    }
  }
  .lm-verify {
    display: flex;
    gap: 8px;
    align-items: center;
    .lm-input {
      flex: 1;
    }
    .lm-vimg {
      height: 38px;
      border-radius: 6px;
      cursor: pointer;
      border: 1px solid #eee;
    }
  }
  .lm-btns {
    display: flex;
    gap: 10px;
  }
  .lm-btn {
    flex: 1;
    border: none;
    border-radius: 999px;
    background: var(--theme);
    color: #fff;
    font-size: 14px;
    padding: 10px 0;
    cursor: pointer;
    &.ghost {
      background: #fff;
      color: var(--theme);
      border: 1px solid var(--theme);
    }
  }
  .lm-back {
    border: none;
    background: none;
    color: #9ca3af;
    font-size: 12px;
    cursor: pointer;
  }
}
@media (max-width: 640px) {
  .lm-box {
    min-width: 0;
    width: 92vw;
    flex-direction: column;
  }
}
</style>
