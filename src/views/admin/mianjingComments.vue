<script setup lang="ts">
import { admin } from '@/api/modules/admin'
import { useAdminPage, fmtTime } from './composables'
import { ElMessage, ElMessageBox } from 'element-plus'

const { rows, total, page, keyword, loading, load, search, changePage } = useAdminPage(p =>
  admin.mianjingComments({ ...p, doc: keyword.value })
)
const fmt = fmtTime

async function del(row: { id: number }) {
  await ElMessageBox.confirm('删除该评论及其回复？', '删除评论', { type: 'warning' })
  const res = await admin.commentDelete(row.id)
  if (res?.code === 200) {
    ElMessage.success('已删除')
    load()
  } else ElMessage.error(res?.msg || '删除失败')
}
</script>

<template>
  <div class="panel">
    <div class="bar">
      <el-input
        v-model="keyword"
        placeholder="按 doc_id 过滤（如 srv-3）"
        clearable
        style="width: 260px"
        @keyup.enter="search"
      />
      <el-button type="primary" @click="search">过滤</el-button>
    </div>
    <el-table v-loading="loading" :data="rows" size="small">
      <el-table-column prop="id" label="ID" width="70" />
      <el-table-column prop="doc_id" label="帖子" width="110" />
      <el-table-column label="作者" width="130">
        <template #default="{ row }">{{ row.nickname || row.username }}</template>
      </el-table-column>
      <el-table-column prop="content" label="评论内容" min-width="260" />
      <el-table-column label="时间" width="170">
        <template #default="{ row }">{{ fmt(row.created_at) }}</template>
      </el-table-column>
      <el-table-column label="操作" width="90" fixed="right">
        <template #default="{ row }">
          <el-button type="danger" link size="small" @click="del(row)">删除</el-button>
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
