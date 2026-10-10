<script setup lang="ts">
import FloatTools from '@/components/FloatTools.vue'
</script>
<template>
  <div id="main-tools">
    <FloatTools />
    <slot />
  </div>
</template>
<style lang="scss" scoped>
#main-tools {
  min-height: 100vh;
}
</style>
