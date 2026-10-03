<script setup lang="ts">
import { ref } from 'vue'
import { ElMessage } from 'element-plus'

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
    name: '月度会员',
    price: '18.99',
    unit: '约 0.63元 / 天',
    gradient: 'bg-gradient-to-br from-slate-700 to-slate-400',
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
  },
  {
    name: '季度会员',
    price: '35.99',
    unit: '约 0.40元 / 天',
    gradient: 'bg-gradient-to-br from-indigo-500 to-indigo-300',
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
    name: '年度会员',
    price: '69.99',
    unit: '约 0.19元 / 天',
    gradient: 'bg-gradient-to-br from-amber-600 to-amber-400',
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
    name: '终身会员',
    price: '99.99',
    del: '¥188',
    unit: '权益永久有效',
    gradient: 'lifetime-grad',
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
  }
]

const paying = ref(false)
function upgrade(t: Tier) {
  paying.value = true
  // 复刻版：支付通道未接入，提示后关闭
  setTimeout(() => {
    paying.value = false
    ElMessage.info(`「${t.name}」支付通道接入后开放，敬请期待`)
  }, 400)
}
</script>

<template>
  <div class="mb-page">
    <h1 class="sr-only">会员中心_VIP会员特权_简历制作高级功能_专业简历模板下载</h1>
    <div class="mb-head">
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

    <div class="tiers">
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
          <div class="tbtn" :class="t.btnGradient || ''" @click="upgrade(t)">升级会员</div>
        </div>
        <div class="rights">
          <div class="rights-title">功能权益</div>
          <div class="rights-list">
            <div v-for="[k, v] in t.rights" :key="k" class="right-row">
              <div>{{ k }}</div>
              <div>{{ v }}</div>
            </div>
          </div>
        </div>
      </div>
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
  &.lifetime-grad {
    background: linear-gradient(135deg, rgba(0, 0, 0, 0.65), #374151);
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
  background: var(--background);
  .rights-title {
    text-align: center;
    font-weight: 700;
    font-size: 14px;
    margin-bottom: 24px;
  }
  .rights-list {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }
  .right-row {
    display: flex;
    justify-content: space-between;
    font-size: 14px;
    align-items: center;
  }
}
</style>
