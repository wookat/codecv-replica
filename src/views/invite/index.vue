<script setup lang="ts">
import { ElMessage } from 'element-plus'
import { currentUser } from '@/utils/auth'
import { ref } from 'vue'

const user = ref(currentUser())
const link = `${location.origin}/?invite=${user.value ? 'u' : 'guest'}`

function copy() {
  navigator.clipboard?.writeText(link).then(() => ElMessage.success('邀请链接已复制'))
}
function goLogin() {
  location.hash = '#/login'
}
</script>

<template>
  <div class="iv-page">
    <h1 class="sr-only">邀请有赏_推荐好友_邀请返利_分享赚钱_邀请奖励计划</h1>
    <div class="iv-head">
      <div class="inner">
        <h1 class="t">🎁 邀请有赏活动</h1>
        <p class="d">
          感谢您喜欢我们的产品，如果您觉得好用的话，可以分享给您的同学朋友使用，邀请新人首次开通会员你将得到订单
          <span class="hl">10% 的佣金</span>（非优惠券/代金券）。
        </p>
        <button v-if="user" class="iv-btn" @click="copy">复制我的邀请链接</button>
        <button v-else class="iv-btn" @click="goLogin">登录后查看我的邀请链接</button>
      </div>
    </div>

    <div class="steps-card">
      <h2>邀请步骤</h2>
      <p class="sub">
        每成功邀请1位好友开通任何会员，立赚10%佣金!（举例：终身会员 99元/人，邀请10人轻松赚 99元）
      </p>
      <div class="steps">
        <div class="step">
          <img
            class="s-ic"
            src="/prod-assets/invite-share.svg"
            alt="一、分享链接 - 邀请奖励说明图"
            draggable="false"
          />
          <div class="st">一、分享链接</div>
          <div class="sd">分享邀请链接给好友，注册登录</div>
        </div>
        <div class="step">
          <img
            class="s-ic"
            src="/prod-assets/invite-join.svg"
            alt="二、加入会员 - 邀请奖励说明图"
            draggable="false"
          />
          <div class="st">二、加入会员</div>
          <div class="sd">好友开通了任意会员</div>
        </div>
        <div class="step">
          <img
            class="s-ic"
            src="/prod-assets/invite-money.svg"
            alt="三、获得佣金 - 邀请奖励说明图"
            draggable="false"
          />
          <div class="st">三、获得佣金</div>
          <div class="sd">你获得该笔订单 10% 的佣金（仅限好友首次开通）</div>
        </div>
      </div>
    </div>
  </div>
</template>

<style lang="scss">
.iv-page {
  max-width: var(--max-width);
  margin: 0 auto;
  padding: 20px;
  color: var(--font-color);
}
.iv-head {
  text-align: center;
  padding: 24px 16px;
  .t {
    font-size: 24px;
    font-weight: 700;
    margin-bottom: 32px;
  }
  .d {
    max-width: 560px;
    margin: 0 auto 24px;
    line-height: 1.9;
    .hl {
      color: var(--theme);
      font-weight: 700;
    }
  }
}
.iv-btn {
  border: none;
  border-radius: 999px;
  background: var(--theme);
  color: #fff;
  font-size: 14px;
  padding: 11px 28px;
  cursor: pointer;
  &:hover {
    opacity: 0.9;
  }
}
.steps-card {
  background: var(--background);
  border-radius: 12px;
  padding: 24px;
  h2 {
    margin: 0 0 16px;
    font-size: 18px;
  }
  .sub {
    color: #9ca3af;
    font-size: 14px;
    line-height: 1.7;
  }
  .steps {
    margin: 40px 0;
    display: flex;
    justify-content: center;
    flex-direction: column;
    gap: 40px;
    align-items: center;
    @media (min-width: 768px) {
      flex-direction: row;
      gap: 40px;
    }
  }
  .step {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 16px;
    justify-content: space-between;
    align-items: center;
    .s-ic {
      width: 96px;
      height: 96px;
      object-fit: contain;
      @media (max-width: 767px) {
        width: 50%;
        height: auto;
      }
    }
    .st {
      font-size: 18px;
      font-weight: 700;
    }
    .sd {
      color: #9ca3af;
      font-size: 14px;
      text-align: center;
    }
  }
}
</style>
