<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { mianjingList, mianjingMeta, MianjingItem } from '@/api/modules/site'
import { logoColor, localAsset } from '@/utils/article'

const topic = ref<any>(null)
const list = ref<MianjingItem[]>([])
const loading = ref(false)

const ranked = computed(() =>
  [...list.value].sort(
    (a, b) =>
      (b.viewCount ?? 0) + (b.likeCount ?? 0) * 5 - ((a.viewCount ?? 0) + (a.likeCount ?? 0) * 5)
  )
)

const PRIZES = [
  { rank: '第 1 名', prize: '终身会员', icon: '🥇' },
  { rank: '第 2 名', prize: '年度会员', icon: '🥈' },
  { rank: '第 3 名', prize: '季度会员', icon: '🥉' },
  { rank: '第 4-10 名', prize: '月度会员', icon: '🏅' }
]

onMounted(async () => {
  loading.value = true
  try {
    const [ts, res] = await Promise.all([
      mianjingMeta('topics'),
      mianjingList({ page: 1, pageSize: 100 })
    ])
    const topics = ts?.data ?? []
    topic.value =
      topics.find((t: any) => t.slug === 'topic-2d075e13' || t.name?.includes('大赛')) ??
      topics[0] ??
      null
    const slug = topic.value?.slug
    list.value = (res?.data ?? []).filter(m => m.topicSlug === slug || !slug)
  } catch (e) {
    console.error(e)
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <div class="mj-page mj-activity">
    <header class="act-hero">
      <div class="hero-in">
        <div class="hero-l">
          <div class="badges">
            <span class="status-badge">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              >
                <path d="M10 14.66v1.626a2 2 0 0 1-.976 1.696A5 5 0 0 0 7 21.978" />
                <path d="M14 14.66v1.626a2 2 0 0 0 .976 1.696A5 5 0 0 1 17 21.978" />
                <path d="M18 9h1.5a1 1 0 0 0 0-5H18" />
                <path d="M4 22h16" />
                <path d="M6 9a6 6 0 0 0 12 0V3a1 1 0 0 0-1-1H7a1 1 0 0 0-1 1z" />
                <path d="M6 9H4.5a1 1 0 0 1 0-5H6" />
              </svg>
              已结算
            </span>
            <span class="date">09-18 00:00 — 10-01 00:00</span>
          </div>
          <h1>面经创作大赛 - 第一期</h1>
          <p class="desc">
            投稿时携带话题 <b>#面经创作大赛</b> 即参赛：<b>热度冲榜</b>，赢终身 / 年度 / 季度 /
            月度会员。每期都是新起点，现在上车不算晚。
          </p>
          <div class="hero-actions">
            <router-link to="/mianjing/write" class="mj-btn">立即投稿</router-link>
            <router-link to="/mianjing" class="mj-btn ghost">面经大全</router-link>
          </div>
        </div>
      </div>
    </header>

    <section class="mj-card rules">
      <h2>活动规则</h2>
      <ul>
        <li>投稿面经时在话题中选择「面经创作大赛」即自动参赛</li>
        <li>榜单按面经热度排名（浏览 + 点赞 + 收藏加权），活动期间实时更新</li>
        <li>内容须为本人真实面试经历，抄袭/刷量取消资格</li>
        <li>奖品在活动结束后 3 个工作日内发放到账户</li>
      </ul>
    </section>

    <section class="prizes">
      <div v-for="p in PRIZES" :key="p.rank" class="prize-card">
        <span class="pi">{{ p.icon }}</span>
        <p class="pr">{{ p.rank }}</p>
        <p class="pp">{{ p.prize }}</p>
      </div>
    </section>

    <section class="mj-card rank-card" v-loading="loading">
      <div class="list-head">
        <h2>参赛榜单</h2>
        <router-link to="/mianjing/write" class="mj-btn sm">投稿参赛</router-link>
      </div>
      <div class="items">
        <router-link
          v-for="(m, i) in ranked"
          :key="m._id"
          :to="`/mianjing/p/${m._id}`"
          class="rank-row"
        >
          <span class="rank" :class="{ top: i < 3 }">{{ i + 1 }}</span>
          <span class="mj-logo" :style="{ '--mj-logo-bg': logoColor(m.companySlug || '') } as any">
            <img
              v-if="m.companyLogo"
              :src="localAsset(m.companyLogo)"
              class="mj-logo-img"
              :alt="m.companyName"
            />
            <template v-else>{{ (m.companyName || '?')[0] }}</template>
          </span>
          <span class="t">{{ m.title }}</span>
          <span class="v">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <path
                d="M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0"
              />
              <circle cx="12" cy="12" r="3" />
            </svg>
            {{ m.viewCount ?? 0 }}
          </span>
        </router-link>
        <el-empty v-if="!loading && !ranked.length" description="暂无参赛面经" />
      </div>
    </section>
  </div>
</template>

<style lang="scss">
@import './mianjing.scss';

.mj-activity {
  .act-hero {
    border-radius: 16px;
    padding: 40px;
    background: linear-gradient(
      135deg,
      color-mix(in srgb, var(--theme) 16%, var(--background)),
      var(--background) 70%
    );
    .badges {
      display: flex;
      align-items: center;
      gap: 10px;
      flex-wrap: wrap;
    }
    .status-badge {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      border-radius: 999px;
      padding: 4px 12px;
      font-size: 12px;
      font-weight: 600;
      color: #fff;
      background: var(--font-color);
      svg {
        width: 14px;
        height: 14px;
      }
    }
    .date {
      font-size: 12px;
      opacity: 0.55;
    }
    h1 {
      margin: 12px 0 0;
      font-size: 30px;
      font-weight: 700;
    }
    .desc {
      margin-top: 8px;
      font-size: 14px;
      opacity: 0.7;
      max-width: 36rem;
      line-height: 1.7;
      b {
        color: var(--theme);
      }
    }
    .hero-actions {
      margin-top: 20px;
      display: flex;
      gap: 12px;
      .mj-btn.ghost {
        background: transparent;
        color: var(--theme);
        border: 1px solid var(--theme);
      }
    }
  }
  .rules {
    margin-top: 16px;
    padding: 20px 24px;
    h2 {
      margin: 0 0 12px;
      font-size: 17px;
      font-weight: 700;
    }
    ul {
      margin: 0;
      padding-left: 20px;
      font-size: 14px;
      line-height: 2;
      opacity: 0.75;
    }
  }
  .prizes {
    margin-top: 16px;
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 12px;
    @media (min-width: 768px) {
      grid-template-columns: repeat(4, 1fr);
    }
  }
  .prize-card {
    background: var(--background);
    border-radius: 14px;
    padding: 20px;
    text-align: center;
    .pi {
      font-size: 28px;
    }
    .pr {
      margin-top: 8px;
      font-size: 13px;
      opacity: 0.55;
    }
    .pp {
      margin-top: 4px;
      font-size: 16px;
      font-weight: 700;
      color: var(--theme);
    }
  }
  .rank-card {
    margin-top: 16px;
    padding: 20px 24px;
    .rank-row {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 10px 0;
      border-bottom: 1px solid rgba(0, 0, 0, 0.05);
      text-decoration: none;
      color: var(--font-color);
      &:last-child {
        border-bottom: none;
      }
      .rank {
        width: 20px;
        font-weight: 700;
        text-align: center;
        color: #bbb;
        &.top {
          color: var(--theme);
        }
      }
      .t {
        flex: 1;
        min-width: 0;
        font-size: 14px;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
      &:hover .t {
        color: var(--theme);
      }
      .v {
        display: inline-flex;
        align-items: center;
        gap: 4px;
        font-size: 12px;
        opacity: 0.45;
        svg {
          width: 12px;
          height: 12px;
        }
      }
    }
  }
  .mj-btn.sm {
    padding: 8px 16px;
    font-size: 13px;
  }
}
</style>
