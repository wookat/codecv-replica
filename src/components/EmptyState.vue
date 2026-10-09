<script setup lang="ts">
// 通用空态卡片：图标 + 主文案 + 可选副文案 + 可选操作插槽
defineProps<{ icon?: string; title: string; desc?: string }>()
</script>

<template>
  <div class="empty-state">
    <p v-if="icon" class="es-icon">{{ icon }}</p>
    <p class="es-title">{{ title }}</p>
    <p v-if="desc" class="es-desc">{{ desc }}</p>
    <slot />
  </div>
</template>

<style scoped>
.empty-state {
  padding: 60px 20px;
  text-align: center;
  color: var(--font-color);
  .es-icon {
    font-size: 36px;
    margin-bottom: 10px;
  }
  .es-title {
    font-size: 15px;
    font-weight: 600;
    margin-bottom: 6px;
  }
  .es-desc {
    font-size: 13px;
    opacity: 0.65;
    margin-bottom: 14px;
  }
}
</style>
