<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import useEditorStore from '@/store/modules/editor'

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

const editorStore = useEditorStore()

const tools = [
  {
    icon: 'problem',
    tip: '点击查看简历编写教程',
    act: () =>
      window.open(
        editorStore.writable
          ? 'https://www.yuque.com/xiongleixin/saqnu1/rxhlykmem82qbb8m'
          : 'https://www.yuque.com/xiongleixin/saqnu1/sl2ai75t6xgbhg86'
      )
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
    <Teleport to="body">
      <div v-if="panel" class="ft-mask" @click="panel = ''">
        <div
          v-if="panel === 'wechat'"
          class="flex justify-center bg-white flex-col gap-2 pt-5 rounded-xl items-center ft-card"
          @click.stop
        >
          <h4 class="text-black">微信扫码联系客服</h4>
          <img
            src="/prod-assets/wechat-qr.jpg"
            class="w-64 rounded-lg"
            draggable="false"
            alt="客服联系方式"
          />
        </div>
        <div v-else class="ft-group" @click.stop>
          <img
            src="/prod-assets/group-qr.webp"
            draggable="false"
            class="w-[300px] rounded-lg"
            alt="共建交流群"
          />
        </div>
      </div>
    </Teleport>
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
