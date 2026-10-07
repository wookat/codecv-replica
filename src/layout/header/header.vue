<script setup lang="ts">
import Nav from './components/nav.vue'
import User from './components/user.vue'
import NavMoblie from './components/navMoblie.vue'
</script>

<template>
  <div class="header-out noto-sans-sc">
    <div class="header">
      <div class="nav-left" @click="$router.push('/home')">
        <img src="/static/svg/logo-BFLBP-GO.svg" alt="CodeCV 简历" draggable="false" />
      </div>
      <Nav />
      <User />
    </div>
    <div class="header-800">
      <NavMoblie />
    </div>
  </div>
</template>

<style lang="scss" scoped>
.header-out {
  width: 100%;
  background: var(--background);
  color: var(--font-color);
  height: 60px;
  z-index: 9;
  position: sticky;
  top: 0;
  overflow: hidden;
  font-weight: 600;

  .header {
    max-width: var(--max-width);
    height: 60px;
    margin: 0 auto;
    /* 生产 logo x=100（容器1300居中70 + 左右30px），导航 首页 x=204 */
    padding: 0 30px;
    display: flex;
    justify-content: flex-start;
    align-items: center;
    gap: 40px;
  }

  .nav-left {
    width: 64px;
    height: 42px;
    display: flex;
    align-items: center;
    flex-shrink: 0;
    cursor: pointer;
    img {
      width: 100%;
      max-height: 100%;
      object-fit: contain;
    }
  }

  .header-800 {
    display: none;
  }
}

@media screen and (max-width: 1024px) {
  .header-out .header {
    display: none;
  }

  .header-out .header-800 {
    display: block;
  }
}
</style>
