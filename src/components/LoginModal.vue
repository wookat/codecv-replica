<script setup lang="ts">
const emit = defineEmits<(e: 'close') => void>()
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
          <h4>微信扫码登录</h4>
          <img class="lm-qr" src="/prod-assets/wechat.jpg" alt="微信扫码登录二维码" />
          <p class="lm-tip">有效期 <b>1分钟</b> 请及时扫码完成登录</p>
          <p class="lm-agree">
            登录表示您同意该<a
              href="https://www.yuque.com/xiongleixin/saqnu1/qkvrw80dm615kai4"
              target="_blank"
              rel="noopener"
              >用户隐私政策与服务协议</a
            >
          </p>
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
}
@media (max-width: 640px) {
  .lm-box {
    min-width: 0;
    width: 92vw;
    flex-direction: column;
  }
}
</style>
