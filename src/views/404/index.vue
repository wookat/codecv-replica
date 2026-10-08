<template>
  <div class="nf-page">
    <p class="nf-code">404</p>
    <p class="nf-msg">哎呀！您访问了一个不存在的页面</p>
    <router-link to="/home" class="nf-btn">回到首页</router-link>
  </div>
</template>

<style lang="scss" scoped>
.nf-page {
  min-height: calc(100vh + 8px);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}
.nf-code {
  font-size: 50px;
  color: var(--theme);
  text-align: center;
  margin: 0;
}
.nf-msg {
  font-size: 24px;
  line-height: 32px;
  color: rgb(68, 68, 68);
  margin: 20px 0 0;
}
.nf-btn {
  display: inline-block;
  background: var(--theme);
  color: #fff;
  border-radius: 4px;
  padding: 12px 16px;
  font-size: 13.333px;
  margin-top: 20px;
  transition: transform 0.2s;
  text-decoration: none;
  &:hover {
    transform: scale(1.05);
  }
}
</style>
