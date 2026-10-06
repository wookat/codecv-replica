<script setup lang="ts">
// 校对统计：近30天趋势 + 事件明细
import { onMounted, ref } from 'vue'
import { admin } from '@/api/modules/admin'
import { useAdminPage, fmtTime } from './composables'

const stats = ref<{ days: { day: string; n: number }[]; total: number }>({ days: [], total: 0 })
const { rows, total, page, loading, changePage } = useAdminPage(admin.proofreadEvents)

onMounted(async () => {
  const res = await admin.proofreadStats()
  if (res?.code === 200) stats.value = res.data
})
</script>

<template>
  <div class="panel">
    <h3>校对趋势（近30天）· 累计 {{ stats.total }} 次</h3>
    <div class="chart">
      <div v-for="d in stats.days" :key="d.day" class="col" :title="`${d.day}: ${d.n}次`">
        <div
          class="bar"
          :style="{
            height: `${Math.max(4, (d.n / Math.max(...stats.days.map(x => x.n), 1)) * 120)}px`
          }"
        />
        <span>{{ d.day.slice(5) }}</span>
      </div>
      <p v-if="!stats.days.length" class="empty">暂无校对事件</p>
    </div>
  </div>
  <div class="panel">
    <h3>校对事件明细</h3>
    <el-table v-loading="loading" :data="rows" size="small">
      <el-table-column prop="id" label="ID" width="70" />
      <el-table-column label="用户" width="140">
        <template #default="{ row }">{{ row.nickname || row.username }}</template>
      </el-table-column>
      <el-table-column prop="resume_type" label="模板" width="160" />
      <el-table-column prop="meta" label="问题数" width="90" />
      <el-table-column label="时间" width="170">
        <template #default="{ row }">{{ fmtTime(row.created_at) }}</template>
      </el-table-column>
    </el-table>
    <el-pagination
      layout="total, prev, pager, next"
      :total="total"
      :page-size="20"
      :current-page="page"
      @current-change="changePage"
    />
  </div>
</template>

<style scoped>
.panel {
  background: #fff;
  border-radius: 14px;
  padding: 16px 18px;
  border: 1px solid rgba(0, 0, 0, 0.05);
  margin-bottom: 16px;
  h3 {
    font-size: 14px;
    margin-bottom: 14px;
  }
}
.chart {
  display: flex;
  align-items: flex-end;
  gap: 6px;
  min-height: 140px;
  .col {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 4px;
    font-size: 10px;
    color: rgba(0, 0, 0, 0.45);
  }
  .bar {
    width: 22px;
    border-radius: 4px 4px 0 0;
    background: var(--theme);
    opacity: 0.75;
  }
}
.empty {
  font-size: 13px;
  color: rgba(0, 0, 0, 0.4);
  margin: auto;
}
.el-pagination {
  margin-top: 14px;
  justify-content: flex-end;
}
</style>
