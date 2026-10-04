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
        <button class="lm-x" aria-label="关闭" @click="emit('close')">✕</button>
        <div class="lm-left">
          <h4>登录开启简历世界</h4>
          <p><span>☁️</span> 简历数据云端存储 确保数据不丢失</p>
          <p><span>🎉</span> AI 助你一臂之力 写简历不再困难</p>
          <p><span>🌈</span> 开启内容创作 不仅限于简历模板</p>
          <img class="lm-illus" src="/prod-assets/login-modal.svg" alt="CodeCV简历" />
        </div>
        <div class="lm-right">
          <template v-if="!accountMode">
            <h4>微信扫码登录</h4>
            <img class="lm-qr" src="/prod-assets/miniprogram.webp" alt="微信扫码登录二维码" />
            <p class="lm-tip">有效期 <b>1分钟</b> 请及时扫码完成登录</p>
            <p class="lm-agree">
              登录表示您同意该<a
                href="https://www.yuque.com/xiongleixin/saqnu1/qkvrw80dm615kai4"
                target="_blank"
                rel="noopener"
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
    top: 10px;
    right: 12px;
    z-index: 2;
    border: none;
    background: transparent;
    font-size: 14px;
    color: #999;
    cursor: pointer;
    &:hover {
      color: #333;
    }
  }
}
.lm-left {
  flex: 1;
  background: var(--theme);
  color: #fff;
  padding: 20px 0 20px 20px;
  h4 {
    margin-top: 20px;
    font-size: 17px;
    font-weight: 600;
  }
  p {
    margin-top: 12px;
    font-size: 14px;
    span {
      font-size: 18px;
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
