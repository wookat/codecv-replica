<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { getLocalStorage } from '@/common/localstorage'
import { currentUser } from '@/utils/auth'
import LoginModal from '@/components/LoginModal.vue'

interface Order {
  orderNo: string
  plan: string
  amount: number
  status: string
  created_at: number
  paid_at: number | null
}

const router = useRouter()
const user = ref(currentUser())
const loginModal = ref(!user.value)
const orders = ref<Order[]>([])

const token = () => (getLocalStorage('TOKEN') as string) || ''
const headers = () => ({
  'Content-Type': 'application/json',
  Authorization: `Bearer ${token()}`
})
const fmt = (ts: number) => new Date(ts).toLocaleString('zh-CN', { hour12: false })
const statusText = (s: string) => (s === 'paid' ? '已支付' : '待支付')

async function load() {
  if (!token()) return
  try {
    const res = await fetch('/api/order/list', { headers: headers() })
    const data = await res.json()
    if (data.code === 200) {
      orders.value = data.data
    }
  } catch {
    /* 网络失败保持空表 */
  }
}

async function pay(o: Order) {
  const res = await fetch('/api/order/pay', {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify({ orderNo: o.orderNo })
  })
  const data = await res.json()
  if (data.code === 200) {
    ElMessage.success('支付成功（模拟）')
    load()
  } else {
    ElMessage.error(data.msg || '支付失败')
  }
}

function onClose() {
  loginModal.value = false
  if (!user.value) router.push('/profile')
  else load()
}

onMounted(load)
</script>

<template>
  <div class="od-page">
    <h1 class="sr-only">我的订单_会员订单_支付记录</h1>
    <div class="od-card">
      <div class="od-head">
        <h2>我的订单</h2>
      </div>
      <el-table v-if="orders.length" :data="orders">
        <el-table-column prop="orderNo" label="订单号" min-width="180" />
        <el-table-column prop="plan" label="商品" min-width="110" />
        <el-table-column label="金额" width="100">
          <template #default="{ row }">¥{{ (row.amount / 100).toFixed(2) }}</template>
        </el-table-column>
        <el-table-column label="状态" width="100">
          <template #default="{ row }">{{ statusText(row.status) }}</template>
        </el-table-column>
        <el-table-column label="下单时间" min-width="160">
          <template #default="{ row }">{{ fmt(row.created_at) }}</template>
        </el-table-column>
        <el-table-column label="操作" width="110">
          <template #default="{ row }">
            <el-button v-if="row.status === 'pending'" size="small" @click="pay(row)"
              >模拟支付</el-button
            >
          </template>
        </el-table-column>
      </el-table>
      <div v-else class="empty">
        <img class="e-img" src="/prod-assets/empty.svg" alt="暂无订单" />
        <h3>暂无订单</h3>
        <p>{{ user ? '开通会员可解锁全部高级功能' : '登录后可查看订单记录' }}</p>
        <router-link v-if="user" to="/member" class="od-btn">去看会员</router-link>
        <button v-else class="od-btn" @click="loginModal = true">去登录</button>
      </div>
    </div>
    <LoginModal v-if="loginModal" @close="onClose" />
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
  .e-img {
    width: 120px;
    user-select: none;
    margin: 0 auto;
    display: block;
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
  border: none;
  border-radius: 999px;
  background: var(--theme);
  color: #fff;
  font-size: 13px;
  padding: 9px 20px;
  text-decoration: none;
  cursor: pointer;
}
</style>
