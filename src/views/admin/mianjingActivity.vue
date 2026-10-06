<script setup lang="ts">
// 面经创作大赛：赛季列表 + 结算（快照热度榜写回 results）
import { onMounted, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { admin } from '@/api/modules/admin'
import { fmtTime } from './composables'

const seasons = ref<any[]>([])

async function load() {
  const res = await admin.mianjingSeasons()
  if (res?.code === 200) seasons.value = res.data || []
}
onMounted(load)

// 赛季创建：直接走 SQL？没有 add 端点——用 settle 的表结构，先插一行（经 topic 接口不合适），
// 这里复用 mianjing/activity/seasons 只读 + settle。新增赛季走后端无端点，
// 通过 vipCode 式？不——为完整性，直接调 save 不存在。简化：赛季由 D1 手工插入，
// 页面提供「结算」与查看结果。
async function settle(s: any) {
  await ElMessageBox.confirm(`结算赛季「${s.name}」？将按当前面经热度榜快照获奖名单。`, '结算', {
    type: 'warning'
  })
  const res = await admin.mianjingSettle(s.id)
  if (res?.code === 200) {
    ElMessage.success(`已结算，${res.data?.count ?? 0} 篇上榜`)
    load()
  }
}
function showResults(s: any) {
  const list = JSON.parse(s.results || '[]') as any[]
  ElMessageBox.alert(
    list.length
      ? `<ol style="padding-left:18px">${list
          .map(
            x => `<li>${x.title}（${x.company_name}）— ${x.nickname || '匿名'}，赞 ${x.likes}</li>`
          )
          .join('')}</ol>`
      : '暂无结果',
    `「${s.name}」结算榜单`,
    { dangerouslyUseHTMLString: true, customStyle: { width: '640px' } }
  )
}
</script>

<template>
  <div class="panel">
    <el-table :data="seasons" size="small">
      <el-table-column prop="id" label="ID" width="60" />
      <el-table-column prop="name" label="赛季" min-width="180" />
      <el-table-column label="周期" width="220">
        <template #default="{ row }">
          {{ row.start_at ? fmtTime(row.start_at).slice(0, 10) : '-' }} ~
          {{ row.end_at ? fmtTime(row.end_at).slice(0, 10) : '-' }}
        </template>
      </el-table-column>
      <el-table-column label="状态" width="90">
        <template #default="{ row }">
          <el-tag :type="row.status === 'settled' ? 'info' : 'success'" size="small">
            {{ row.status === 'settled' ? '已结算' : '进行中' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="160" fixed="right">
        <template #default="{ row }">
          <el-button
            v-if="row.status !== 'settled'"
            link
            type="warning"
            size="small"
            @click="settle(row)"
            >结算</el-button
          >
          <el-button v-if="row.results" link type="primary" size="small" @click="showResults(row)"
            >榜单</el-button
          >
        </template>
      </el-table-column>
    </el-table>
    <p class="hint">赛季由管理员在 D1 admin_seasons 表创建；本页负责结算与榜单查看。</p>
  </div>
</template>

<style scoped>
.panel {
  background: #fff;
  border-radius: 14px;
  padding: 16px 18px;
  border: 1px solid rgba(0, 0, 0, 0.05);
}
.hint {
  margin-top: 12px;
  font-size: 12px;
  color: rgba(0, 0, 0, 0.4);
}
</style>
