<script setup lang="ts">
// /notify 在生产站返回 404 页（Nuxt 兜底路由同款）
import { useRouter } from 'vue-router'

const router = useRouter()
</script>

<template>
  <div class="nf-page">
    <p class="nf-code">404</p>
    <p class="nf-msg">哎呀！您访问了一个不存在的页面</p>
    <button class="nf-btn" @click="router.push('/')">回到首页</button>
  </div>
</template>

<style lang="scss" scoped>
.nf-page {
  min-height: calc(100vh - 60px);
  background: var(--body-background);
  display: flex;
  flex-direction: column;
  align-items: center;
  padding-top: 360px;
}
.nf-code {
  font-size: 56px;
  font-weight: 600;
  color: var(--theme);
  line-height: 72px;
  margin: 0;
}
.nf-msg {
  margin: 12px 0 36px;
  font-size: 15px;
  color: #4b5563;
}
.nf-btn {
  border: none;
  background: linear-gradient(90deg, #ff7449, #ff9a44);
  color: #fff;
  font-size: 14px;
  padding: 14px 28px;
  border-radius: 8px;
  cursor: pointer;
  transition: filter 0.2s;
  &:hover {
    filter: brightness(1.05);
  }
}
</style>
