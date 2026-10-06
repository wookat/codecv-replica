<template>
  <div class="nf-page">
    <div class="nf-code">404</div>
    <p class="nf-msg">哎呀！您访问了一个不存在的页面</p>
    <router-link to="/home" class="nf-btn">回到首页</router-link>
  </div>
</template>

<style lang="scss" scoped>
.nf-page {
  text-align: center;
  padding: 80px 20px 120px;
}
.nf-code {
  font-size: 110px;
  font-weight: 800;
  color: #e4e7ed;
  letter-spacing: 8px;
  line-height: 1.2;
}
.nf-msg {
  font-size: 15px;
  color: #909399;
  margin: 18px 0 34px;
}
.nf-btn {
  display: inline-block;
  background: var(--theme);
  color: #fff;
  border-radius: 8px;
  padding: 10px 38px;
  font-size: 14px;
}
</style>
