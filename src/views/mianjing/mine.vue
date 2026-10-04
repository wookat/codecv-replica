<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { delMianjing, myMianjing } from '@/api/modules/share'
import { currentUser } from '@/utils/auth'

interface MineItem {
  _id: string
  title: string
  companyName?: string
  positionSlug?: string
  round?: string
  batch?: string
  grade?: string
  result?: string
  contentMd?: string
  status?: string
  create_time?: number
}

const MINE_KEY = 'mianjing-mine'
const localMine = () => JSON.parse(localStorage.getItem(MINE_KEY) || '[]') as MineItem[]
const mine = ref<MineItem[]>(localMine())
const has = computed(() => mine.value.length > 0)

onMounted(async () => {
  if (!currentUser()) return
  try {
    const res = await myMianjing()
    if (res?.code !== 200) return
    // 服务端为准（跨端可见），本地遗留条目并入显示
    const srv = (res.data ?? []) as MineItem[]
    const srvIds = new Set(srv.map(m => String(m._id)))
    const merged = [
      ...srv.map(m => ({ ...m, _id: `srv-${m._id}` })),
      ...localMine().filter(m => m._id.startsWith('local-') && !srvIds.has(String(m._id)))
    ]
    merged.sort((a, b) => (b.create_time ?? 0) - (a.create_time ?? 0))
    mine.value = merged
  } catch {
    /* 服务端失败用本地 */
  }
})

const fmt = (ts?: number) => (ts ? new Date(ts).toLocaleString() : '')

async function remove(id: string) {
  await ElMessageBox.confirm('确定删除这篇投稿吗？', '删除', { type: 'warning' })
  if (id.startsWith('srv-')) {
    const res = await delMianjing(id.slice(4))
    if (res?.code !== 200) return ElMessage.error(res?.msg || '删除失败')
  }
  mine.value = mine.value.filter(m => m._id !== id)
  localStorage.setItem(MINE_KEY, JSON.stringify(mine.value.filter(m => m._id.startsWith('local-'))))
  ElMessage.success('已删除')
}
</script>

<template>
  <div class="mj-page mj-mine">
    <nav class="crumb">
      <router-link to="/mianjing">面经</router-link>
      <svg
        class="sep"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
      >
        <path d="m9 18 6-6-6-6" />
      </svg>
      <span>我的投稿</span>
    </nav>

    <div class="list-head">
      <h2>我的投稿</h2>
      <router-link to="/mianjing/write" class="mj-btn sm">投稿面经</router-link>
    </div>

    <div v-if="has" class="items">
      <div v-for="m in mine" :key="m._id" class="mj-item">
        <div class="item-top">
          <div class="item-head">
            <div class="item-title-row">
              <h3>{{ m.title }}</h3>
              <span class="mj-chip mj-chip--amber">{{
                m.status === 'pending' ? '审核中' : m.status
              }}</span>
            </div>
            <div class="item-chips">
              <span class="mj-chip mj-chip--gray">{{ m.companyName }}</span>
              <span class="mj-chip mj-chip--gray">{{ m.grade }}届 · {{ m.batch }}</span>
              <span class="mj-chip mj-chip--gray">{{ m.round }}</span>
              <span
                class="mj-chip"
                :class="m.result === '已offer' ? 'mj-chip--green' : 'mj-chip--amber'"
                >{{ m.result }}</span
              >
            </div>
          </div>
        </div>
        <div class="item-foot">
          <span class="f-ic">{{ fmt(m.create_time) }}</span>
          <span class="f-ic grow"></span>
          <button class="del" @click="remove(m._id)">删除</button>
        </div>
      </div>
    </div>

    <div v-else class="mj-card empty">
      <h3>还没有投稿</h3>
      <p>分享你的真实面经，帮助更多同学上岸。</p>
      <router-link to="/mianjing/write" class="mj-btn">去投稿</router-link>
    </div>
  </div>
</template>

<style lang="scss">
@import './mianjing.scss';

.mj-mine {
  .crumb {
    display: flex;
    align-items: center;
    gap: 4px;
    font-size: 13px;
    opacity: 0.55;
    margin-bottom: 16px;
    a {
      color: var(--font-color);
      text-decoration: none;
      &:hover {
        color: var(--theme);
      }
    }
    .sep {
      width: 14px;
      height: 14px;
    }
  }
  .mj-btn.sm {
    padding: 8px 16px;
    font-size: 13px;
  }
  .del {
    border: none;
    background: transparent;
    color: #f56c6c;
    font-size: 12px;
    cursor: pointer;
    &:hover {
      text-decoration: underline;
    }
  }
  .empty {
    padding: 48px 24px;
    text-align: center;
    h3 {
      font-size: 18px;
      margin: 0 0 8px;
    }
    p {
      opacity: 0.55;
      font-size: 14px;
      margin-bottom: 20px;
    }
    .mj-btn {
      display: inline-flex;
    }
  }
}
</style>
