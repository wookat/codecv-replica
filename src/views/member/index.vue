<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getLocalStorage } from '@/common/localstorage'

// 生产 member 页 nav/文本主题为 #555（探针实测），其余页 #1e293b——进出本页时切换全局变量
onMounted(() => document.body.style.setProperty('--font-color', '#555'))
onUnmounted(() => document.body.style.setProperty('--font-color', '#1e293b'))

interface Tier {
  name: string
  price: string
  del?: string
  unit: string
  gradient: string
  badge?: string
  priceColor?: string
  btnGradient?: string
  rights: [string, string][]
}

const tiers: Tier[] = [
  {
    name: '终身会员',
    price: '99.99',
    del: '¥188',
    unit: '权益永久有效',
    gradient: 'navy-grad',
    badge: '秋招限时优惠',
    priceColor: '#FEECCA',
    btnGradient: 'lifetime-btn',
    rights: [
      ['会员有效时长', '终身有效'],
      ['导入/导出简历', '无限制'],
      ['导出简历水印', '无水印'],
      ['可上传证件照/图片大小', '10MB内'],
      ['支持导出格式', 'PDF/PNG/MD'],
      ['可拥有简历份数', '不限'],
      ['AI助手使用次数', '无限制'],
      ['保存历史记录恢复', '✅'],
      ['简历分享', '✅'],
      ['所有模板可用', '✅'],
      ['后续更新功能', '✅'],
      ['简历模板定制', '✅']
    ]
  },
  {
    name: '年度会员',
    price: '69.99',
    del: '¥99.99',
    unit: '约 0.19元 / 天',
    gradient: 'blue-grad',
    badge: '立减30元',
    rights: [
      ['会员有效时长', '365天'],
      ['导入/导出简历', '无限制'],
      ['导出简历水印', '无水印'],
      ['可上传证件照/图片大小', '2MB内'],
      ['支持导出格式', 'PDF/PNG/MD'],
      ['可拥有简历份数', '15份'],
      ['AI助手使用次数', '无限制'],
      ['保存历史记录恢复', '✅'],
      ['简历分享', '✅'],
      ['所有模板可用', '✅'],
      ['后续更新功能', '✅'],
      ['简历模板定制', '❌']
    ]
  },
  {
    name: '季度会员',
    price: '35.99',
    del: '¥49.99',
    unit: '约 0.40元 / 天',
    gradient: 'blue-grad',
    badge: '立减14元',
    rights: [
      ['会员有效时长', '90天'],
      ['导入/导出简历', '无限制'],
      ['导出简历水印', '无水印'],
      ['可上传证件照/图片大小', '2MB内'],
      ['支持导出格式', 'PDF/PNG/MD'],
      ['可拥有简历份数', '5份'],
      ['AI助手使用次数', '无限制'],
      ['保存历史记录恢复', '✅'],
      ['简历分享', '✅'],
      ['所有模板可用', '✅'],
      ['后续更新功能', '✅'],
      ['简历模板定制', '❌']
    ]
  },
  {
    name: '月度会员',
    price: '18.99',
    unit: '约 0.63元 / 天',
    gradient: 'blue-grad',
    rights: [
      ['会员有效时长', '30天'],
      ['导入/导出简历', '无限制'],
      ['导出简历水印', '无水印'],
      ['可上传证件照/图片大小', '2MB内'],
      ['支持导出格式', 'PDF/PNG/MD'],
      ['可拥有简历份数', '4份'],
      ['AI助手使用次数', '无限制'],
      ['保存历史记录恢复', '✅'],
      ['简历分享', '✅'],
      ['所有模板可用', '✅'],
      ['后续更新功能', '✅'],
      ['简历模板定制', '❌']
    ]
  }
]

// 与首页一致的用户评价（生产同文案）
const COMMENTS = [
  {
    content: '使用体验还不错呀，UI 做的也蛮好的，加油！',
    avatar: '/static/png/avatar1-155VfYeO.png',
    profession: '阿里巴巴前端'
  },
  {
    content:
      '在nk推荐中看到了这个工具，非常感谢作者大大的开发，虽然我不是前后端开发，但是直观感觉这玩意真好～',
    avatar: '/static/png/avatar2-Dk7PWhs9.png',
    profession: '嵌入式开发工程师'
  },
  {
    content: '这个简历工具实在是泰库辣！真的节省了我很多时间，简历模板也很实用，发现了宝藏工具！！',
    avatar: '/static/png/avatar3-CKCfc60R.png',
    profession: 'Java开发工程师'
  },
  {
    content:
      '简历写起来真的非常方便，因为我不懂UP说的markdown，所以我使用所见即所得方式编写，感觉就和写word一样简单，墙裂推荐～',
    avatar: '/static/png/avatar4-D4xNvzs7.png',
    profession: '用户运营'
  },
  {
    content:
      '周末在家搞网站发现的这个宝藏资源，写简历就跟写笔记一样简单了，所见即所得，以后写简历就在这上面了～',
    avatar: '/static/png/avatar5-CkIdX3WU.png',
    profession: '产品经理'
  }
]

const router = useRouter()
const paying = ref(false)
function scrollTop() {
  window.scrollTo({ top: 0, behavior: 'smooth' })
}
async function upgrade(t: Tier) {
  const token = getLocalStorage('TOKEN') as string
  if (!token) {
    router.push('/login?redirect=/member')
    return
  }
  paying.value = true
  try {
    const res = await fetch('/api/order/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ plan: t.name, amount: +t.price })
    })
    const data = await res.json()
    if (data.code !== 200) return ElMessage.error(data.msg || '下单失败')
    await ElMessageBox.confirm(
      `订单 ${data.data.orderNo} 已创建（¥${t.price}）。真实收款渠道未接入，点击确定模拟支付完成。`,
      '确认支付',
      { type: 'info', confirmButtonText: '模拟支付', cancelButtonText: '取消' }
    )
    const pay = await fetch('/api/order/pay', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ orderNo: data.data.orderNo })
    })
    const pd = await pay.json()
    if (pd.code === 200) {
      ElMessage.success(`「${t.name}」已开通（模拟支付）`)
      router.push('/order')
    } else {
      ElMessage.error(pd.msg || '支付失败')
    }
  } catch (e) {
    if (e !== 'cancel') ElMessage.error('网络异常，请稍后重试')
  } finally {
    paying.value = false
  }
}
</script>

<template>
  <div class="mb-page">
    <h1 class="sr-only">会员中心_VIP会员特权_简历制作高级功能_专业简历模板下载</h1>
    <div class="mb-head" data-aos="fade-down">
      <img
        src="/static/png/vipIcon-wax61BPq.png"
        class="vip"
        draggable="false"
        alt="CodeCV简历VIP会员图标"
      />
      <div>
        <div class="t">CodeCV 简历会员</div>
        <sub class="s">尊享 6 大特权，一份好简历祝您斩获理想 OFFER！</sub>
      </div>
    </div>

    <div class="tiers" data-aos="zoom-out">
      <div v-for="t in tiers" :key="t.name" class="tier-wrap">
        <div class="tier" :class="t.gradient">
          <div v-if="t.badge" class="badge">{{ t.badge }}</div>
          <div class="tname">{{ t.name }}</div>
          <div class="tprice" :style="{ color: t.priceColor || '#fff' }">
            <span class="sym">¥</span> {{ t.price }} <span class="yuan">元</span>
          </div>
          <del v-if="t.del" class="tdel">{{ t.del }}</del>
          <del v-else class="tdel op0">0</del>
          <div class="tunit">{{ t.unit }}</div>
          <div class="tbtn" :class="t.btnGradient || ''" @click="!paying && upgrade(t)">
            升级会员
          </div>
        </div>
        <div class="rights">
          <div class="rights-title">
            功能权益
            <img
              src="/static/svg/quanquan-CjIjpzSc.svg"
              draggable="false"
              class="quanquan"
              alt="功能权益装饰图标"
            />
          </div>
          <div class="rights-list">
            <div v-for="[k, v] in t.rights" :key="k" class="right-row">
              <div>{{ k }}</div>
              <div>{{ v }}</div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 用户评价（生产同板块） -->
    <div class="mb-comments">
      <h2 data-aos="zoom-in">看看用户的真实评价</h2>
      <p class="sub" data-aos="zoom-in">
        看看用户的真实评价，用户说好才是真的好，已经有 5000+ 用户使用CodeCV简历制作简历成功入职拿到
        OFFER!
      </p>
      <ul class="cm-grid">
        <li v-for="c in COMMENTS" :key="c.profession" class="cm-card" data-aos="zoom-in">
          <p class="cm-content">{{ c.content }}</p>
          <p class="cm-info">
            <img :src="c.avatar" alt="头像" /><sub>{{ c.profession }}</sub>
          </p>
        </li>
      </ul>
    </div>

    <!-- 黑色 CTA 横幅 -->
    <div class="mb-banner">
      <p>目前已累计导出 150000+ 简历 ｜ 帮助 5000+ 用户成功入职!</p>
      <a class="banner-btn" href="#top" @click.prevent="scrollTop">升级会员</a>
    </div>
  </div>
</template>

<style lang="scss">
.mb-page {
  max-width: var(--max-width);
  margin: 0 auto;
  padding: 20px;
  color: var(--font-color);
  display: flex;
  flex-direction: column;
  align-items: center;
}
.mb-head {
  display: flex;
  align-items: center;
  gap: 16px;
  justify-content: center;
  margin-bottom: 32px;
  .vip {
    height: 80px;
  }
  .t {
    font-weight: 700;
    font-size: 24px;
  }
  .s {
    color: #6b7280;
    font-size: 13px;
  }
}
.tiers {
  display: flex;
  gap: 16px;
  flex-wrap: wrap;
  justify-content: center;
}
.tier-wrap {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  border-radius: 12px;
  transition: transform 0.4s;
  cursor: pointer;
  &:hover {
    transform: translateY(8px);
  }
}
.tier {
  width: 280px;
  position: relative;
  padding: 28px 20px 20px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  text-align: center;
  border-radius: 12px 12px 0 0;
  &.navy-grad {
    background: linear-gradient(135deg, rgba(0, 0, 0, 0.65), #374151);
  }
  &.blue-grad {
    background: linear-gradient(135deg, #627a92, #4c5f74);
  }
  .badge {
    position: absolute;
    top: -10px;
    left: 0;
    font-size: 12px;
    background: linear-gradient(90deg, #ef4444, #eab308);
    color: #fff;
    border-radius: 12px 0 12px 0;
    padding: 4px 10px;
  }
  .tname {
    color: #fff;
    font-weight: 700;
    font-size: 20px;
  }
  .tprice {
    color: #fff;
    font-weight: 700;
    font-size: 30px;
    .sym {
      font-size: 16px;
    }
    .yuan {
      font-size: 18px;
    }
  }
  .tdel {
    color: #d1d5db;
    font-size: 14px;
    margin-top: -10px;
    &.op0 {
      opacity: 0;
    }
  }
  .tunit {
    color: #d1d5db;
    font-size: 14px;
  }
  .tbtn {
    background: #fff;
    padding: 8px 0;
    color: #000;
    font-weight: 700;
    border-radius: 999px;
    &.lifetime-btn {
      background: linear-gradient(135deg, #e5e7eb, #fef3c7, #facc15);
    }
  }
}
.rights {
  border-radius: 0 0 12px 12px;
  padding: 16px;
  min-height: 416px;
  box-sizing: border-box;
  background: var(--background);
  text-align: center;
  .rights-title {
    position: relative;
    display: inline-block;
    text-align: center;
    font-weight: 700;
    font-size: 14px;
    margin-bottom: 24px;
    .quanquan {
      position: absolute;
      top: 66%;
      left: 50%;
      transform: translate(-50%, -50%);
      opacity: 0.6;
      pointer-events: none;
    }
  }
  .rights-list {
    display: flex;
    flex-direction: column;
    gap: 16px;
    text-align: left;
  }
  .right-row {
    display: flex;
    justify-content: space-between;
    font-size: 14px;
    align-items: center;
  }
}
.mb-comments {
  width: 100%;
  text-align: center;
  padding: 32px 0 20px;
  h2 {
    font-size: 28px;
    font-weight: 800;
    margin: 0 0 12px;
  }
  .sub {
    color: #9ca3af;
    font-size: 14px;
    margin: 0 0 34px;
  }
}
.cm-grid {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 0;
  list-style: none;
  padding: 0;
  margin: 0;
  text-align: left;
  @media (max-width: 1024px) {
    grid-template-columns: repeat(2, 1fr);
  }
  @media (max-width: 640px) {
    grid-template-columns: 1fr;
  }
}
.cm-card {
  background: #f3f4f6;
  border-radius: 12px;
  padding: 20px;
  margin: 8px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  min-height: 280px;
  .cm-content {
    font-size: 13px;
    line-height: 1.8;
    color: #4b5563;
    margin: 0 0 14px;
  }
  .cm-info {
    display: flex;
    align-items: center;
    gap: 8px;
    margin: 0;
    img {
      width: 30px;
      height: 30px;
      border-radius: 50%;
    }
    sub {
      font-size: 12px;
      color: #9ca3af;
    }
  }
}
.mb-banner {
  width: 100vw;
  margin-left: calc(50% - 50vw);
  background: #0d0d0d;
  text-align: center;
  padding: 42px 20px;
  margin-top: 40px;
  p {
    color: #fff;
    font-size: 16px;
    margin: 0 0 22px;
  }
  .banner-btn {
    display: inline-block;
    background: linear-gradient(90deg, #f6e05e, #ecc94b);
    color: #1a1a1a;
    font-weight: 700;
    font-size: 14px;
    padding: 10px 26px;
    border-radius: 8px;
    text-decoration: none;
    &:hover {
      filter: brightness(1.05);
    }
  }
}
</style>
