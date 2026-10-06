<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { delMianjing, myFavMianjing, myMianjing } from '@/api/modules/share'
import { currentUser } from '@/utils/auth'
import { fmtCN } from '@/utils/time'

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

const router = useRouter()
const MINE_KEY = 'mianjing-mine'
const localMine = () => JSON.parse(localStorage.getItem(MINE_KEY) || '[]') as MineItem[]
const mine = ref<MineItem[]>(localMine())
const tab = ref<'mine' | 'fav'>('mine')
interface FavItem {
  id: string
  title?: string
  company_name?: string
  round?: string
  batch?: string
  grade?: string
  result?: string
  fav_time?: number
}
const favs = ref<FavItem[]>([])
const favCount = computed(() => favs.value.length)
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
  try {
    const fr = await myFavMianjing()
    if (fr?.code === 200) favs.value = fr.data?.list ?? []
  } catch {
    /* ignore */
  }
})

const fmt = (ts?: number) => (ts ? fmtCN(ts, true) : '')

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
    <!-- 生产同款页头：返回圆钮 + 标题 + 副文案 + 右上投稿钮 -->
    <div class="mm-head">
      <button class="mm-back" title="返回" @click="router.back()">
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2.2"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <path d="M19 12H5" />
          <path d="m12 19-7-7 7-7" />
        </svg>
      </button>
      <div class="mm-head-t">
        <h1>我的面经</h1>
        <p>同一家公司可按轮次拆多篇，发布即时可见，可随时编辑或删除</p>
      </div>
      <router-link to="/mianjing/write" class="mj-btn mm-pub">
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <path d="M12 20h9" />
          <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4Z" />
        </svg>
        投稿面经
      </router-link>
    </div>

    <div class="mm-tabs">
      <button class="mm-tab" :class="{ on: tab === 'mine' }" @click="tab = 'mine'">
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <path d="M14 2v6h6" />
          <path d="M16 13H8" />
          <path d="M16 17H8" />
          <path d="M10 9H8" />
        </svg>
        我的投稿 <i>{{ mine.length }}</i>
      </button>
      <button class="mm-tab" :class="{ on: tab === 'fav' }" @click="tab = 'fav'">
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <path
            d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
          />
        </svg>
        我的收藏 <i>{{ favCount }}</i>
      </button>
    </div>

    <template v-if="tab === 'mine'">
      <div v-if="has" class="items">
        <div v-for="m in mine" :key="m._id" class="mj-item">
          <div class="item-top">
            <div class="item-head">
              <div class="item-title-row">
                <router-link :to="`/mianjing/p/${m._id}`" class="t-link"
                  ><h3>{{ m.title }}</h3></router-link
                >
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

      <div v-else class="mm-empty">
        <img src="/prod-assets/empty.svg" alt="还没有投稿" />
        <p>还没有投稿，分享第一篇面经吧</p>
      </div>
    </template>

    <template v-else>
      <div v-if="favs.length" class="items">
        <router-link v-for="f in favs" :key="f.id" :to="`/mianjing/p/srv-${f.id}`" class="mj-item">
          <div class="item-top">
            <div class="item-head">
              <div class="item-title-row">
                <h3>{{ f.title || '已收藏的面经' }}</h3>
              </div>
              <div class="item-chips">
                <span v-if="f.company_name" class="mj-chip mj-chip--gray">{{
                  f.company_name
                }}</span>
                <span v-if="f.grade" class="mj-chip mj-chip--gray"
                  >{{ f.grade }}届 · {{ f.batch }}</span
                >
                <span v-if="f.round" class="mj-chip mj-chip--gray">{{ f.round }}</span>
              </div>
            </div>
          </div>
        </router-link>
      </div>
      <div v-else class="mm-empty">
        <img src="/prod-assets/empty.svg" alt="还没有收藏" />
        <p>还没有收藏，去面经大全看看</p>
      </div>
    </template>
  </div>
</template>

<style lang="scss">
@import './mianjing.scss';

.mj-mine {
  .mm-head {
    display: flex;
    align-items: flex-start;
    gap: 14px;
    .mm-back {
      width: 36px;
      height: 36px;
      flex-shrink: 0;
      margin-top: 4px;
      border: none;
      border-radius: 999px;
      background: rgba(0, 0, 0, 0.05);
      color: var(--font-color);
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      svg {
        width: 16px;
        height: 16px;
      }
      &:hover {
        background: rgba(0, 0, 0, 0.09);
      }
    }
    .mm-head-t {
      flex: 1;
      h1 {
        margin: 0;
        font-size: 24px;
        font-weight: 700;
      }
      p {
        margin-top: 6px;
        font-size: 13px;
        opacity: 0.5;
      }
    }
    .mm-pub {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      flex-shrink: 0;
      svg {
        width: 15px;
        height: 15px;
      }
    }
  }
  .mm-tabs {
    margin: 20px 0;
    display: flex;
    gap: 10px;
    .mm-tab {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 8px 16px;
      border: none;
      border-radius: 999px;
      font-size: 13.5px;
      background: rgba(0, 0, 0, 0.04);
      color: var(--font-color);
      cursor: pointer;
      svg {
        width: 15px;
        height: 15px;
      }
      i {
        font-style: normal;
        font-size: 12px;
        opacity: 0.6;
      }
      &.on {
        background: color-mix(in srgb, var(--theme) 14%, var(--background));
        color: var(--theme);
        i {
          opacity: 0.8;
        }
      }
    }
  }
  .t-link {
    text-decoration: none;
    color: var(--font-color);
    &:hover h3 {
      color: var(--theme);
    }
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
  .mm-empty {
    padding: 90px 0 120px;
    text-align: center;
    img {
      width: 200px;
      opacity: 0.9;
    }
    p {
      margin-top: 18px;
      font-size: 14px;
      color: rgba(0, 0, 0, 0.5);
    }
  }
}
</style>
