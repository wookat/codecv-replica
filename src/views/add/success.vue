<script setup lang="ts"></script>

<template>
  <div class="as-page">
    <div class="as-card">
      <svg
        class="ok"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
      >
        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
        <path d="m9 11 3 3L22 4" />
      </svg>
      <h2>投稿成功</h2>
      <p>你的文章已提交，审核通过后将展示在求职攻略板块</p>
      <div class="acts">
        <router-link to="/strategy" class="b primary">去看攻略</router-link>
        <router-link to="/" class="b">回首页</router-link>
      </div>
    </div>
  </div>
</template>

<style lang="scss">
.as-page {
  min-height: 60vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
}
.as-card {
  background: var(--background);
  border-radius: 16px;
  padding: 48px 40px;
  text-align: center;
  max-width: 420px;
  color: var(--font-color);
  .ok {
    width: 64px;
    height: 64px;
    color: #22c55e;
    margin: 0 auto;
  }
  h2 {
    margin: 20px 0 8px;
    font-size: 22px;
  }
  p {
    color: #9ca3af;
    font-size: 14px;
    margin-bottom: 28px;
  }
  .acts {
    display: flex;
    gap: 12px;
    justify-content: center;
    .b {
      padding: 10px 24px;
      border-radius: 999px;
      font-size: 14px;
      text-decoration: none;
      color: var(--theme);
      border: 1px solid var(--theme);
      &.primary {
        background: var(--theme);
        color: #fff;
      }
    }
  }
}
</style>
