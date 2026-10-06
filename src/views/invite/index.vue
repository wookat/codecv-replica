<script setup lang="ts">
import { ElMessage, ElMessageBox } from 'element-plus'
import { currentUser } from '@/utils/auth'
import { getLocalStorage } from '@/common/localstorage'
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'

interface InviteRow {
  id: number
  userId: number
  orderNo: string
  nickname: string
  commission: number
  identity: string
  settleStatus: string
  createdAt: number
}

const user = ref(currentUser())
const records = ref<InviteRow[]>([])
// /invite = 落地页（生产登录态也显示落地页）；/user/invite = 邀请记录表
const route = useRoute()
const router = useRouter()
const isRecords = computed(() => route.name === 'user-invite')
const page = ref(1)
const PAGE_SIZE = 10

const username = () => (getLocalStorage('USERNAME') as string) || ''
const link = `${location.origin}/?invite=${username() || 'guest'}`
const paged = computed(() =>
  records.value.slice((page.value - 1) * PAGE_SIZE, page.value * PAGE_SIZE)
)
const pages = computed(() => Math.max(1, Math.ceil(records.value.length / PAGE_SIZE)))
const fmt = (ts: number) => new Date(ts).toLocaleString('zh-CN', { hour12: false })

function copy() {
  navigator.clipboard?.writeText(link).then(() => ElMessage.success('邀请链接已复制'))
}
function goLogin() {
  location.hash = '#/login'
}
function settle() {
  ElMessageBox.alert('请通过右下角客服联系管理员进行佣金结算', '结算佣金', {
    confirmButtonText: '知道了'
  }).catch(() => undefined)
}
async function load() {
  const token = getLocalStorage('TOKEN') as string
  if (!token) return
  try {
    const res = await fetch('/api/invite/records', {
      headers: { Authorization: `Bearer ${token}` }
    })
    const data = await res.json()
    if (data.code === 200) records.value = data.data
  } catch {
    /* 网络失败保持空表 */
  }
}
onMounted(load)
</script>

<template>
  <div class="iv-page">
    <h1 class="sr-only">邀请有赏_推荐好友_邀请返利_分享赚钱_邀请奖励计划</h1>

    <!-- /user/invite：我的邀请记录（与生产一致） -->
    <div v-if="isRecords" class="iv-card">
      <div class="iv-head-row">
        <h2>
          我的邀请记录 <span class="cnt">（{{ records.length }}条）</span>
        </h2>
        <div class="iv-ops">
          <button class="iv-btn sm" @click="copy">去邀请</button>
          <button class="iv-settle" @click="settle">结算佣金</button>
        </div>
      </div>
      <table class="iv-table">
        <thead>
          <tr>
            <th>用户ID</th>
            <th>关联订单ID</th>
            <th>用户昵称</th>
            <th>可获得佣金</th>
            <th>用户当前身份</th>
            <th>结算状态</th>
            <th>注册时间</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="r in paged" :key="r.id">
            <td>{{ r.userId }}</td>
            <td class="mono">{{ r.orderNo || '-' }}</td>
            <td>{{ r.nickname }}</td>
            <td>¥{{ (r.commission / 100).toFixed(2) }}</td>
            <td>{{ r.identity }}</td>
            <td>{{ r.settleStatus }}</td>
            <td>{{ fmt(r.createdAt) }}</td>
          </tr>
          <tr v-if="!paged.length">
            <td colspan="7" class="iv-empty">您还没有邀请过任何人，快去分享你的邀请链接吧～</td>
          </tr>
        </tbody>
      </table>
      <div class="iv-pager">
        <button :disabled="page <= 1" @click="page--">‹</button>
        <button v-for="n in pages" :key="n" :class="{ on: n === page }" @click="page = n">
          {{ n }}
        </button>
        <button :disabled="page >= pages" @click="page++">›</button>
      </div>
    </div>

    <!-- /invite：邀请有赏落地页（生产对游客与登录用户同一形态） -->
    <template v-else>
      <div class="iv-head">
        <div class="inner">
          <h1 class="t">🎁 邀请有赏活动</h1>
          <p class="d">
            感谢您喜欢我们的产品，如果您觉得好用的话，可以分享给您的同学朋友使用，邀请新人首次开通会员你将得到订单
            <span class="hl">10% 的佣金</span>（非优惠券/代金券）。
          </p>
          <button v-if="user" class="iv-btn" @click="router.push('/user/invite')">
            查看我的邀请记录
          </button>
          <button v-else class="iv-btn" @click="goLogin">登录后查看我的邀请链接</button>
        </div>
      </div>
      <div class="steps-card">
        <h2>邀请步骤</h2>
        <p class="sub">
          每成功邀请1位好友开通任何会员，立赚10%佣金!（举例：终身会员 99元/人，邀请10人轻松赚 99元）
        </p>
        <div class="steps">
          <div class="step">
            <img
              class="s-ic"
              src="/prod-assets/invite-share.svg"
              alt="一、分享链接 - 邀请奖励说明图"
              draggable="false"
            />
            <div class="st">一、分享链接</div>
            <div class="sd">分享邀请链接给好友，注册登录</div>
          </div>
          <div class="step">
            <img
              class="s-ic"
              src="/prod-assets/invite-join.svg"
              alt="二、加入会员 - 邀请奖励说明图"
              draggable="false"
            />
            <div class="st">二、加入会员</div>
            <div class="sd">好友开通了任意会员</div>
          </div>
          <div class="step">
            <img
              class="s-ic"
              src="/prod-assets/invite-money.svg"
              alt="三、获得佣金 - 邀请奖励说明图"
              draggable="false"
            />
            <div class="st">三、获得佣金</div>
            <div class="sd">你获得该笔订单 10% 的佣金（仅限好友首次开通）</div>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<style lang="scss">
.iv-page {
  max-width: var(--max-width);
  margin: 0 auto;
  padding: 20px;
  color: var(--font-color);
}
.iv-card {
  background: var(--background);
  border-radius: 16px;
  padding: 20px 24px;
  min-height: 220px;
}
.iv-head-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
  h2 {
    margin: 0;
    font-size: 16px;
    font-weight: 700;
    .cnt {
      color: #9ca3af;
      font-size: 13px;
      font-weight: 400;
    }
  }
  .iv-ops {
    display: flex;
    align-items: center;
    gap: 14px;
  }
}
.iv-settle {
  border: none;
  background: none;
  padding: 0;
  color: var(--theme);
  font-size: 13px;
  cursor: pointer;
}
.iv-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
  th {
    text-align: left;
    color: #9ca3af;
    font-weight: 500;
    padding: 10px 8px;
    border-bottom: 1px solid rgba(0, 0, 0, 0.06);
    white-space: nowrap;
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
  .iv-empty {
    text-align: center;
    color: #9ca3af;
    padding: 28px 0;
  }
}
.iv-pager {
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
.iv-head {
  text-align: center;
  padding: 24px 16px;
  .t {
    font-size: 24px;
    font-weight: 700;
    margin-bottom: 32px;
  }
  .d {
    max-width: 560px;
    margin: 0 auto 24px;
    line-height: 1.9;
    .hl {
      color: var(--theme);
      font-weight: 700;
    }
  }
}
.iv-btn {
  border: none;
  border-radius: 999px;
  background: var(--theme);
  color: #fff;
  font-size: 14px;
  padding: 11px 28px;
  cursor: pointer;
  &.sm {
    padding: 7px 18px;
    font-size: 13px;
  }
  &:hover {
    opacity: 0.9;
  }
}
.steps-card {
  background: var(--background);
  border-radius: 12px;
  padding: 24px;
  h2 {
    margin: 0 0 16px;
    font-size: 18px;
  }
  .sub {
    color: #9ca3af;
    font-size: 14px;
    line-height: 1.7;
  }
  .steps {
    margin: 40px 0;
    display: flex;
    justify-content: center;
    flex-direction: column;
    gap: 40px;
    align-items: center;
    @media (min-width: 768px) {
      flex-direction: row;
      gap: 40px;
    }
  }
  .step {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 16px;
    justify-content: space-between;
    align-items: center;
    .s-ic {
      width: 96px;
      height: 96px;
      object-fit: contain;
      @media (max-width: 767px) {
        width: 50%;
        height: auto;
      }
    }
    .st {
      font-size: 18px;
      font-weight: 700;
    }
    .sd {
      color: #9ca3af;
      font-size: 14px;
      text-align: center;
    }
  }
}
</style>
