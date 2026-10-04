<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'

const route = useRoute()
const router = useRouter()
const showTop = ref(false)
const panel = ref<'' | 'wechat' | 'group'>('')

function onScroll() {
  showTop.value = route.path.startsWith('/mianjing/p/') && window.scrollY > window.innerHeight
}
function toTop() {
  window.scrollTo(0, 0)
}
onMounted(() => {
  onScroll()
  window.addEventListener('scroll', onScroll, { passive: true })
})
onUnmounted(() => window.removeEventListener('scroll', onScroll))

const tools = [
  {
    icon: 'problem',
    tip: '点击查看简历编写教程',
    act: () => window.open('https://www.yuque.com/xiongleixin/saqnu1/sl2ai75t6xgbhg86')
  },
  {
    icon: 'wechat',
    tip: '作者微信联系方式',
    act: () => (panel.value = panel.value === 'wechat' ? '' : 'wechat')
  },
  {
    icon: 'group',
    tip: '加入产品共建交流群',
    act: () => (panel.value = panel.value === 'group' ? '' : 'group')
  },
  {
    icon: 'edit',
    tip: '想提建议？点击反馈问题',
    act: () => router.push('/feedback')
  }
]
</script>

<template>
  <div class="ft-bar">
    <div v-if="showTop" class="ft-btn" title="回到顶部" @click="toTop">
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
      >
        <path d="m18 15-6-6-6 6" />
      </svg>
    </div>
    <div v-if="showTop" class="ft-sep"></div>
    <template v-for="(t, i) in tools" :key="t.icon">
      <div v-if="i > 0" class="ft-sep"></div>
      <div class="ft-btn" :title="t.tip" @click="t.act">
        <i :class="`icon-${t.icon}`" class="iconfont"></i>
      </div>
    </template>
    <div v-if="panel" class="ft-panel" @click="panel = ''">
      <img
        :src="panel === 'wechat' ? '/prod-assets/wechat.jpg' : '/prod-assets/feedback-qr.png'"
        :alt="panel === 'wechat' ? '作者微信' : '产品共建交流群'"
      />
      <p>{{ panel === 'wechat' ? '扫码添加作者微信' : '扫码加入交流群' }}</p>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.ft-bar {
  display: none;
  position: fixed;
  right: 36px;
  bottom: 112px;
  z-index: 500;
  background: var(--background);
  border-radius: 8px;
  padding: 4px;
  flex-direction: column;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12);
  @media (min-width: 768px) {
    display: flex;
  }
}
.ft-btn {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 6px;
  cursor: pointer;
  color: var(--font-color);
  svg {
    width: 18px;
    height: 18px;
  }
  i {
    font-size: 20px;
  }
  &:hover {
    background: rgba(0, 0, 0, 0.08);
  }
}
.ft-sep {
  height: 1px;
  margin: 4px 0;
  background: rgba(0, 0, 0, 0.08);
}
.ft-panel {
  position: absolute;
  right: 44px;
  top: 0;
  width: 180px;
  background: var(--background);
  border-radius: 10px;
  padding: 12px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
  cursor: pointer;
  img {
    width: 100%;
    border-radius: 8px;
    display: block;
  }
  p {
    margin-top: 8px;
    text-align: center;
    font-size: 12px;
    color: var(--font-color);
  }
}
</style>
