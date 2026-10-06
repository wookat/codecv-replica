<script setup lang="ts">
import { admin } from '@/api/modules/admin'
import { useAdminPage, fmtTime } from './composables'

const { rows, total, page, loading, changePage } = useAdminPage(admin.progressPage)
</script>

<template>
  <div class="panel">
    <el-table v-loading="loading" :data="rows" size="small">
      <el-table-column prop="id" label="ID" width="60" />
      <el-table-column label="用户" width="130">
        <template #default="{ row }">{{ row.nickname || row.username }}</template>
      </el-table-column>
      <el-table-column prop="name" label="公司" width="160" />
      <el-table-column prop="post" label="岗位" min-width="160" />
      <el-table-column prop="status" label="状态" width="100" />
      <el-table-column prop="channel" label="渠道" width="110" />
      <el-table-column label="更新时间" width="170">
        <template #default="{ row }">{{ fmtTime(row.update_time) }}</template>
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
