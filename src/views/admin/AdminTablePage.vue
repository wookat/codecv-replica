<script setup lang="ts">
// 后台表格页统一外壳：工具条插槽 + 表格主体 + 分页
defineProps<{ total: number; page: number; pageSize?: number }>()
const emit = defineEmits(['update:page'])
</script>

<template>
  <div class="panel">
    <div v-if="$slots.toolbar" class="bar"><slot name="toolbar" /></div>
    <slot />
    <el-pagination
      layout="total, prev, pager, next"
      :total="total"
      :page-size="pageSize ?? 30"
      :current-page="page"
      @current-change="emit('update:page', $event)"
    />
  </div>
</template>

<style scoped>
.panel {
  background: #fff;
  border-radius: 14px;
  padding: 16px 18px;
  border: 1px solid rgba(0, 0, 0, 0.05);
}
.bar {
  display: flex;
  gap: 10px;
  margin-bottom: 14px;
}
.el-pagination {
  margin-top: 14px;
  justify-content: flex-end;
}
</style>
