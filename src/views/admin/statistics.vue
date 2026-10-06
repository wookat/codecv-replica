<script setup lang="ts">
// 数据统计：复用 workbench 指标 + 近30日导出/校对趋势表
import { onMounted, ref } from 'vue'
import { admin } from '@/api/modules/admin'
import { fmtTime } from './composables'

const stats = ref<Record<string, number>>({})
const exportDays = ref<{ day: string; n: number }[]>([])
const proofreadDays = ref<{ day: string; n: number }[]>([])

onMounted(async () => {
  const [s, e, p] = await Promise.all([
    admin.statistics(),
    admin.exportStats(),
    admin.proofreadStats()
  ])
  if (s?.code === 200) stats.value = s.data
  if (e?.code === 200) exportDays.value = e.data.days
  if (p?.code === 200) proofreadDays.value = p.data.days
})
</script>

<template>
  <div class="grids">
    <section class="panel">
      <h3>导出趋势（近30天）</h3>
      <el-table :data="exportDays" size="small">
        <el-table-column prop="day" label="日期" width="140" />
        <el-table-column prop="n" label="导出次数" />
      </el-table>
    </section>
    <section class="panel">
      <h3>校对趋势（近30天）</h3>
      <el-table :data="proofreadDays" size="small">
        <el-table-column prop="day" label="日期" width="140" />
        <el-table-column prop="n" label="校对次数" />
      </el-table>
    </section>
  </div>
  <p class="meta">更新于 {{ fmtTime(Date.now()) }}</p>
</template>

<style scoped>
.grids {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}
.panel {
  background: #fff;
  border-radius: 14px;
  padding: 16px 18px;
  border: 1px solid rgba(0, 0, 0, 0.05);
  h3 {
    font-size: 14px;
    margin-bottom: 12px;
  }
}
.meta {
  margin-top: 14px;
  font-size: 12px;
  color: rgba(0, 0, 0, 0.4);
}
@media (max-width: 900px) {
  .grids {
    grid-template-columns: 1fr;
  }
}
</style>
