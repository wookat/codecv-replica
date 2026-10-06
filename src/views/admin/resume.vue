<script setup lang="ts">
import { ElMessage, ElMessageBox } from 'element-plus'
import { useRouter } from 'vue-router'
import { admin } from '@/api/modules/admin'
import { useAdminPage, fmtTime } from './composables'

const router = useRouter()
const { rows, total, page, keyword, loading, load, search, changePage } = useAdminPage(
  admin.resumePage
)

async function del(r: any) {
  await ElMessageBox.confirm(`删除简历「${r.name}」？`, '删除', { type: 'warning' })
  const res = await admin.resumeDelete(r.id)
  if (res?.code === 200) {
    ElMessage.success('已删除')
    load()
  }
}
async function review(r: any, status: string) {
  const res = await admin.resumeReview(r.id, status)
  if (res?.code === 200) {
    ElMessage.success('已更新')
    load()
  }
}
</script>

<template>
  <div class="panel">
    <div class="bar">
      <el-input
        v-model="keyword"
        placeholder="搜索简历名/用户名"
        clearable
        style="width: 240px"
        @keyup.enter="search"
      />
      <el-button type="primary" @click="search">搜索</el-button>
    </div>
    <el-table v-loading="loading" :data="rows" size="small">
      <el-table-column prop="id" label="ID" width="60" />
      <el-table-column prop="name" label="简历名" min-width="160" />
      <el-table-column prop="resumeType" label="模板" width="150" />
      <el-table-column label="用户" width="140">
        <template #default="{ row }">{{ row.nickname || row.username }}</template>
      </el-table-column>
      <el-table-column prop="exportCount" label="导出" width="70" />
      <el-table-column prop="viewNum" label="分享阅读" width="90" />
      <el-table-column label="更新时间" width="170">
        <template #default="{ row }">{{ fmtTime(row.updatedAt) }}</template>
      </el-table-column>
      <el-table-column label="操作" width="230" fixed="right">
        <template #default="{ row }">
          <el-button
            link
            type="primary"
            size="small"
            @click="router.push(`/admin/resume/${row.id}`)"
            >编辑</el-button
          >
          <el-button
            v-if="row.reviewStatus !== 'approved'"
            link
            type="success"
            size="small"
            @click="review(row, 'approved')"
            >通过</el-button
          >
          <el-button
            v-if="row.reviewStatus !== 'rejected'"
            link
            type="warning"
            size="small"
            @click="review(row, 'rejected')"
            >驳回</el-button
          >
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
