<script setup lang="ts">
import { admin } from '@/api/modules/admin'
import { useAdminPage, fmtTime } from './composables'

const { rows, total, page, loading, changePage } = useAdminPage(admin.invitePage)
</script>

<template>
  <div class="panel">
    <el-table v-loading="loading" :data="rows" size="small">
      <el-table-column prop="id" label="ID" width="60" />
      <el-table-column prop="inviterName" label="邀请人" width="140" />
      <el-table-column prop="inviteeName" label="被邀请人" width="140" />
      <el-table-column prop="order_no" label="订单号" min-width="150" />
      <el-table-column label="佣金" width="100">
        <template #default="{ row }">{{
          row.commission ? `¥${(row.commission / 100).toFixed(2)}` : '-'
        }}</template>
      </el-table-column>
      <el-table-column label="结算" width="90">
        <template #default="{ row }">
          <el-tag :type="row.settle_status === '已结算' ? 'success' : 'info'" size="small">{{
            row.settle_status
          }}</el-tag>
        </template>
      </el-table-column>
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
}
.el-pagination {
  margin-top: 14px;
  justify-content: flex-end;
}
</style>
