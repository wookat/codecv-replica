<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'

const route = useRoute()
const router = useRouter()
const showTop = ref(false)

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
    act: () => router.push('/syntax/helper')
  },
  {
    icon: 'edit',
    tip: '想提建议？点击反馈问题',
    act: () => router.push('/feedback')
  }
]
</script>

<template>
  <nav class="ft-bar">
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
  </nav>
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
.ft-mask {
  position: fixed;
  inset: 0;
  z-index: 10000;
  background: rgba(0, 0, 0, 0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  .ft-card {
    padding: 20px 24px 24px;
    cursor: default;
    h4 {
      color: #111;
      font-size: 16px;
      margin: 0;
    }
    img {
      width: 256px;
    }
  }
  .ft-group img {
    width: 300px;
    border-radius: 8px;
    cursor: default;
  }
}
</style>
