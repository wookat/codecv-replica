<script setup lang="ts">
import Header from '@/layout/header/header.vue'
import Footer from '@/layout/footer.vue'
import FloatTools from '@/components/FloatTools.vue'
</script>

<template>
  <Header />
  <div id="main">
    <FloatTools />
    <slot />
  </div>
  <Footer />
</template>

<style lang="scss" scoped>
#main {
  min-height: calc(100vh - 60px);
}
</style>
