<script setup lang="ts">
import { ElMessage, ElMessageBox } from 'element-plus'
import { admin } from '@/api/modules/admin'
import { useAdminPage, fmtTime } from './composables'

const { rows, total, page, loading, load, changePage } = useAdminPage(admin.historyPage)

async function view(r: any) {
  const res = await admin.historyGet(r.id)
  if (res?.code === 200) {
    await ElMessageBox.alert(
      `<pre style="max-height:50vh;overflow:auto;white-space:pre-wrap">${String(res.data.md || '')
        .replace(/</g, '&lt;')
        .slice(0, 4000)}</pre>`,
      `版本 #${r.id} 内容预览`,
      { dangerouslyUseHTMLString: true, customStyle: { width: '720px' } }
    )
  }
}
async function restore(r: any) {
  await ElMessageBox.confirm(`把简历「${r.name || r.resumeId}」回滚到版本 #${r.id}？`, '回滚', {
    type: 'warning'
  })
  const res = await admin.historyRestore(r.id)
  if (res?.code === 200) ElMessage.success('已回滚')
}
async function del(r: any) {
  await ElMessageBox.confirm(`删除历史版本 #${r.id}？`, '删除', { type: 'warning' })
  const res = await admin.historyDelete(r.id)
  if (res?.code === 200) {
    ElMessage.success('已删除')
    load()
  }
}
</script>

<template>
  <div class="panel">
    <el-table v-loading="loading" :data="rows" size="small">
      <el-table-column prop="id" label="版本" width="80" />
      <el-table-column prop="name" label="简历" min-width="140" />
      <el-table-column prop="resumeType" label="模板" width="150" />
      <el-table-column label="用户" width="140">
        <template #default="{ row }">{{ row.nickname || row.username }}</template>
      </el-table-column>
      <el-table-column label="快照时间" width="170">
        <template #default="{ row }">{{ fmtTime(row.createdAt) }}</template>
      </el-table-column>
      <el-table-column label="操作" width="200" fixed="right">
        <template #default="{ row }">
          <el-button link type="primary" size="small" @click="view(row)">预览</el-button>
          <el-button link type="warning" size="small" @click="restore(row)">回滚</el-button>
          <el-button link type="danger" size="small" @click="del(row)">删除</el-button>
        </template>
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
}
.el-pagination {
  margin-top: 14px;
  justify-content: flex-end;
}
</style>
