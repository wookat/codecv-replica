<script setup lang="ts">
import { admin } from '@/api/modules/admin'
import { useAdminPage, fmtTime } from './composables'

const { rows, total, page, loading, changePage } = useAdminPage(admin.orderPage)
</script>

<template>
  <div class="panel">
    <el-table v-loading="loading" :data="rows" size="small">
      <el-table-column prop="id" label="ID" width="60" />
      <el-table-column prop="order_no" label="订单号" min-width="160" />
      <el-table-column label="用户" width="130">
        <template #default="{ row }">{{ row.nickname || row.username }}</template>
      </el-table-column>
      <el-table-column prop="plan" label="商品" width="140" />
      <el-table-column label="金额" width="90">
        <template #default="{ row }">¥{{ (row.amount / 100).toFixed(2) }}</template>
      </el-table-column>
      <el-table-column label="状态" width="90">
        <template #default="{ row }">
          <el-tag :type="row.status === 'paid' ? 'success' : 'warning'" size="small">{{
            row.status
          }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="支付时间" width="170">
        <template #default="{ row }">{{ fmtTime(row.paid_at || row.created_at) }}</template>
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
