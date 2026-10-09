<script setup lang="ts">
// 数据统计：复用 workbench 指标 + 近30日导出/校对趋势折线图
import { computed, onMounted, ref } from 'vue'
import { use } from 'echarts/core'
import { LineChart } from 'echarts/charts'
import { GridComponent, TooltipComponent } from 'echarts/components'
import { CanvasRenderer } from 'echarts/renderers'
import VChart from 'vue-echarts'
import { admin } from '@/api/modules/admin'
import { fmtTime } from './composables'

use([LineChart, GridComponent, TooltipComponent, CanvasRenderer])

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

// 接口只回有数据的日期；统计口径是「近30天」，缺的日期补 0 让趋势轴连续
const last30 = (() => {
  const days: string[] = []
  const now = new Date()
  for (let i = 29; i >= 0; i--) {
    const d = new Date(now.getTime() - i * 86400000)
    days.push(d.toISOString().slice(0, 10))
  }
  return days
})()

const lineOption = (days: { day: string; n: number }[], name: string) => {
  const byDay = new Map(days.map(d => [d.day, d.n]))
  const axis = last30
  return {
    tooltip: { trigger: 'axis' as const },
    grid: { left: 40, right: 16, top: 20, bottom: 28 },
    xAxis: {
      type: 'category' as const,
      data: axis.map(d => d.slice(5)),
      axisLabel: { fontSize: 10 }
    },
    yAxis: { type: 'value' as const, minInterval: 1 },
    series: [
      {
        name,
        type: 'line' as const,
        smooth: true,
        showSymbol: false,
        areaStyle: { opacity: 0.12 },
        data: axis.map(d => byDay.get(d) ?? 0)
      }
    ]
  }
}

const exportOption = computed(() => lineOption(exportDays.value, '导出次数'))
const proofreadOption = computed(() => lineOption(proofreadDays.value, '校对次数'))
</script>

<template>
  <div class="grids">
    <section class="panel">
      <h3>导出趋势（近30天）</h3>
      <VChart class="chart" :option="exportOption" autoresize />
    </section>
    <section class="panel">
      <h3>校对趋势（近30天）</h3>
      <VChart class="chart" :option="proofreadOption" autoresize />
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
.chart {
  height: 280px;
}
.meta {
  margin-top: 14px;
  color: #999;
  font-size: 12px;
}
@media (max-width: 900px) {
  .grids {
    grid-template-columns: 1fr;
  }
}
</style>
