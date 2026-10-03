<script setup lang="ts">
import { ref } from 'vue'
import { currentUser } from '@/utils/auth'

const user = ref(currentUser())
const orders = ref<any[]>(JSON.parse(localStorage.getItem('codecv-orders') || '[]'))
</script>

<template>
  <div class="od-page">
    <h1 class="sr-only">我的订单_会员订单_支付记录</h1>
    <div class="od-card">
      <div class="od-head">
        <h2>我的订单</h2>
      </div>
      <el-table v-if="orders.length" :data="orders">
        <el-table-column prop="id" label="订单号" min-width="160" />
        <el-table-column prop="name" label="商品" min-width="120" />
        <el-table-column prop="price" label="金额" width="100" />
        <el-table-column prop="status" label="状态" width="100" />
        <el-table-column prop="time" label="下单时间" min-width="160" />
      </el-table>
      <div v-else class="empty">
        <svg
          class="e-ic"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="1.5"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" />
          <path d="M3 6h18" />
          <path d="M16 10a4 4 0 0 1-8 0" />
        </svg>
        <h3>暂无订单</h3>
        <p>{{ user ? '开通会员可解锁全部高级功能' : '登录后可查看订单记录' }}</p>
        <router-link to="/member" class="od-btn">去看会员</router-link>
      </div>
    </div>
  </div>
</template>

<style lang="scss">
.od-page {
  max-width: var(--max-width);
  margin: 0 auto;
  padding: 20px;
  color: var(--font-color);
}
.od-card {
  background: var(--background);
  border-radius: 16px;
  padding: 24px;
  min-height: 300px;
}
.od-head h2 {
  margin: 0 0 20px;
  font-size: 18px;
  font-weight: 700;
}
.empty {
  padding: 48px 0;
  text-align: center;
  .e-ic {
    width: 48px;
    height: 48px;
    color: #d1d5db;
    margin: 0 auto;
  }
  h3 {
    margin: 16px 0 8px;
    font-size: 17px;
  }
  p {
    color: #9ca3af;
    font-size: 14px;
    margin-bottom: 20px;
  }
}
.od-btn {
  display: inline-flex;
  border-radius: 999px;
  background: var(--theme);
  color: #fff;
  font-size: 13px;
  padding: 9px 20px;
  text-decoration: none;
}
</style>
