<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
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
const page = ref(1)
const PAGE_SIZE = 10

const token = () => (getLocalStorage('TOKEN') as string) || ''
const headers = () => ({
  'Content-Type': 'application/json',
  Authorization: `Bearer ${token()}`
})
const fmt = (ts: number | null) =>
  ts ? new Date(ts).toLocaleString('zh-CN', { hour12: false }) : '-'
const paged = computed(() =>
  orders.value.slice((page.value - 1) * PAGE_SIZE, page.value * PAGE_SIZE)
)
const pages = computed(() => Math.max(1, Math.ceil(orders.value.length / PAGE_SIZE)))

async function load() {
  if (!token()) return
  try {
    const res = await fetch('/api/order/list', { headers: headers() })
    const data = await res.json()
    if (data.code === 200) orders.value = data.data
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

// 生产的客服链接是空 href + 点击打开聊天窗，对齐为唤起页面客服入口
function openChat() {
  const crisp = (window as unknown as { $crisp?: { push: (args: unknown[]) => void } }).$crisp
  if (crisp) {
    crisp.push(['do', 'chat:open'])
    return
  }
  ;(document.querySelector('.float-dock button, .chat-fab') as HTMLElement | null)?.click()
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
        <h2>
          我的订单 <span class="od-count">（{{ orders.length }}条）</span>
        </h2>
        <button class="od-cs" type="button" @click="openChat">遇到问题？点击联系客服</button>
      </div>
      <table class="od-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>订单ID</th>
            <th>购买商品</th>
            <th>支付方式</th>
            <th>金额</th>
            <th>支付时间</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(o, i) in paged" :key="o.orderNo">
            <td>{{ (page - 1) * PAGE_SIZE + i + 1 }}</td>
            <td class="mono">{{ o.orderNo }}</td>
            <td>{{ o.plan }}</td>
            <td>
              <template v-if="o.status === 'paid'">微信支付</template>
              <button v-else class="pay-link" @click="pay(o)">模拟支付</button>
            </td>
            <td>¥{{ (o.amount / 100).toFixed(2) }}</td>
            <td>{{ fmt(o.paid_at) }}</td>
          </tr>
          <tr v-if="!paged.length">
            <td colspan="6" class="od-empty">没有订单</td>
          </tr>
        </tbody>
      </table>
      <div class="od-pager">
        <button :disabled="page <= 1" @click="page--">‹</button>
        <button v-for="n in pages" :key="n" :class="{ on: n === page }" @click="page = n">
          {{ n }}
        </button>
        <button :disabled="page >= pages" @click="page++">›</button>
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
  padding: 20px 24px;
  min-height: 220px;
}
.od-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
  h2 {
    margin: 0;
    font-size: 16px;
    font-weight: 700;
  }
  .od-count {
    color: #9ca3af;
    font-size: 13px;
    font-weight: 400;
  }
  .od-cs {
    border: none;
    background: none;
    padding: 0;
    color: #9ca3af;
    font-size: 13px;
    cursor: pointer;
    &:hover {
      color: var(--theme);
    }
  }
}
.od-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
  th {
    text-align: left;
    color: #9ca3af;
    font-weight: 500;
    padding: 10px 8px;
    border-bottom: 1px solid rgba(0, 0, 0, 0.06);
  }
  td {
    padding: 14px 8px;
    border-bottom: 1px solid rgba(0, 0, 0, 0.04);
    color: var(--font-color);
    &.mono {
      font-family: ui-monospace, monospace;
      font-size: 12px;
    }
  }
  .od-empty {
    text-align: center;
    color: #9ca3af;
    padding: 28px 0;
  }
}
.pay-link {
  border: none;
  background: none;
  color: var(--theme);
  font-size: 13px;
  cursor: pointer;
  padding: 0;
  text-decoration: underline;
}
.od-pager {
  display: flex;
  gap: 6px;
  margin-top: 14px;
  button {
    min-width: 28px;
    height: 28px;
    border: none;
    border-radius: 6px;
    background: rgba(0, 0, 0, 0.04);
    color: var(--font-color);
    font-size: 13px;
    cursor: pointer;
    &:disabled {
      opacity: 0.4;
      cursor: default;
    }
    &.on {
      background: linear-gradient(90deg, #ff7449, #ff9a44);
      color: #fff;
    }
  }
}
</style>
