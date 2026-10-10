<template>
  <el-config-provider :locale="zhCn">
    <router-view v-slot="{ Component }">
      <keep-alive :max="10" include="editor,home">
        <component :is="Component" />
      </keep-alive>
    </router-view>
  </el-config-provider>
</template>
<script setup lang="ts">
import AOS from 'aos'
import { onMounted } from 'vue'
import 'aos/dist/aos.css'
import zhCn from 'element-plus/es/locale/lang/zh-cn'

onMounted(() => AOS.init({ once: true }))
</script>
<style lang="scss">
* {
  box-sizing: border-box;
  padding: 0;
  margin: 0;
}

html,
body {
  overflow-x: clip;
}

body {
  background: var(--body-background);
}
</style>
