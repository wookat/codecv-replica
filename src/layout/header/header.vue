<script setup lang="ts">
import { onMounted, ref } from 'vue'
import Nav from './components/nav.vue'
import User from './components/user.vue'
import NavMoblie from './components/navMoblie.vue'

// 含弹层组件的交互区只在客户端渲染，SSR/水合首帧保持一致
const mounted = ref(false)
onMounted(() => {
  mounted.value = true
})
</script>

<template>
  <div class="header-out noto-sans-sc">
    <div class="header">
      <div class="nav-left" @click="$router.push('/home')">
        <img src="/static/svg/logo-BFLBP-GO.svg" alt="CodeCV 简历" draggable="false" />
      </div>
      <Nav />
      <User v-if="mounted" />
    </div>
    <div class="header-800">
      <NavMoblie v-if="mounted" />
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
