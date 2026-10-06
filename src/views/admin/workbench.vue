<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { admin } from '@/api/modules/admin'

const s = ref<Record<string, number>>({})
onMounted(async () => {
  const res = await admin.statistics()
  if (res?.code === 200) s.value = res.data
})
const CARDS = [
  { key: 'users', label: '注册用户' },
  { key: 'resumes', label: '简历数' },
  { key: 'orders', label: '订单数' },
  { key: 'orderAmount', label: '订单金额（分）' },
  { key: 'mianjing', label: '面经投稿' },
  { key: 'comments', label: '评论数' },
  { key: 'posts', label: '攻略文章' },
  { key: 'newUsers7d', label: '7日新增用户' },
  { key: 'exports7d', label: '7日导出次数' },
  { key: 'proofreads7d', label: '7日校对次数' }
]
</script>

<template>
  <div class="cards">
    <div v-for="c in CARDS" :key="c.key" class="card">
      <p class="n">{{ s[c.key] ?? '-' }}</p>
      <p class="l">{{ c.label }}</p>
    </div>
  </div>
</template>

<style scoped>
.cards {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(190px, 1fr));
  gap: 14px;
}
.card {
  background: #fff;
  border-radius: 14px;
  padding: 22px 20px;
  border: 1px solid rgba(0, 0, 0, 0.05);
  .n {
    font-size: 26px;
    font-weight: 700;
    color: var(--theme);
  }
  .l {
    margin-top: 6px;
    font-size: 13px;
    color: rgba(0, 0, 0, 0.5);
  }
}
</style>
