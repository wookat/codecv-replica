<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { currentUser } from '@/utils/auth'
import LoginModal from '@/components/LoginModal.vue'

const router = useRouter()
const user = ref(currentUser())
const loginModal = ref(!user.value)
const orders = ref<any[]>(JSON.parse(localStorage.getItem('codecv-orders') || '[]'))
function onClose() {
  loginModal.value = false
  if (!user.value) router.push('/profile')
}
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
