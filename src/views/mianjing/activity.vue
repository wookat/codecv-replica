<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { mianjingList, mianjingMeta, MianjingItem } from '@/api/modules/site'
import { logoColor, localAsset } from '@/utils/article'

const list = ref<MianjingItem[]>([])
const loading = ref(false)

const PRIZES = [
  { range: '热度榜第 1-3 名', prize: '终身会员', desc: '终身有效，一次冲榜永久受益', crown: true },
  { range: '热度榜第 4-8 名', prize: '年度会员', desc: '会员时长自动顺延，不覆盖已有会员' },
  { range: '热度榜第 9-14 名', prize: '季度会员', desc: '会员时长自动顺延，不覆盖已有会员' },
  { range: '热度榜第 15-24 名', prize: '月度会员', desc: '会员时长自动顺延，不覆盖已有会员' }
]

onMounted(async () => {
  loading.value = true
  try {
    const [ts, res] = await Promise.all([
      mianjingMeta('topics'),
      mianjingList({ page: 1, pageSize: 100 })
    ])
    const topics = ts?.data ?? []
    const topic =
      topics.find((t: any) => t.slug === 'topic-2d075e13' || t.name?.includes('大赛')) ??
      topics[0] ??
      null
    const slug = topic?.slug
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
        <p class="stats">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
            <path d="M16 3.13a4 4 0 0 1 0 7.75" />
          </svg>
          {{ list.length }} 人参赛
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
            class="ic2"
          >
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <path d="M14 2v6h6" />
            <path d="M16 13H8" />
            <path d="M16 17H8" />
            <path d="M10 9H8" />
          </svg>
          {{ list.length }} 篇参赛作品
        </p>
        <div class="hero-actions">
          <router-link to="/mianjing/write" class="mj-btn">
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
            去写面经
          </router-link>
          <router-link to="/mianjing/t/topic-2d075e13" class="mj-btn ghost">看话题作品</router-link>
        </div>
      </div>
      <div class="hero-r">
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="1.6"
          stroke-linecap="round"
          stroke-linejoin="round"
          class="trophy"
        >
          <path d="M10 14.66v1.626a2 2 0 0 1-.976 1.696A5 5 0 0 0 7 21.978" />
          <path d="M14 14.66v1.626a2 2 0 0 0 .976 1.696A5 5 0 0 1 17 21.978" />
          <path d="M18 9h1.5a1 1 0 0 0 0-5H18" />
          <path d="M4 22h16" />
          <path d="M6 9a6 6 0 0 0 12 0V3a1 1 0 0 0-1-1H7a1 1 0 0 0-1 1z" />
          <path d="M6 9H4.5a1 1 0 0 1 0-5H6" />
        </svg>
        <p class="hr-t">本期已结算，奖励已发放</p>
        <p class="hr-s">下一期敬请期待</p>
      </div>
    </header>

    <h2 class="sec-t">
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
      >
        <circle cx="12" cy="8" r="6" />
        <path d="M15.477 12.89 17 22l-5-3-5 3 1.523-9.11" />
      </svg>
      奖励设置（共 24 名）
    </h2>
    <section class="prizes">
      <div v-for="p in PRIZES" :key="p.range" class="prize-card">
        <p class="pr">{{ p.range }}</p>
        <p class="pp">
          <svg
            v-if="p.crown"
            viewBox="0 0 24 24"
            fill="currentColor"
            stroke="currentColor"
            stroke-width="1"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <path d="M5 16 3 5l5.5 5L12 4l3.5 6L21 5l-2 11z" />
            <path d="M5 20h14" />
          </svg>
          {{ p.prize }}
        </p>
        <p class="pd">{{ p.desc }}</p>
      </div>
    </section>

    <section class="login-card">
      <p>登录后查看我的名次、热度与获奖记录</p>
      <router-link to="/login" class="mj-btn sm">立即登录</router-link>
    </section>

    <h2 class="sec-t">
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
      最终热度榜
    </h2>
    <section class="mj-card rank-card" v-loading="loading">
      <div class="items">
        <router-link
          v-for="(m, i) in list"
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
        <div v-if="!loading && !list.length" class="empty">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="1.4"
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
          <p>本期暂无参赛作品</p>
        </div>
      </div>
    </section>
  </div>
</template>

<style lang="scss">
@import './mianjing.scss';

.mj-activity {
  .act-hero {
    border-radius: 16px;
    padding: 36px 40px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 24px;
    background: linear-gradient(
      135deg,
      color-mix(in srgb, var(--theme) 14%, var(--background)),
      var(--background) 75%
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
    .stats {
      margin-top: 10px;
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 13px;
      opacity: 0.6;
      svg {
        width: 15px;
        height: 15px;
        color: var(--theme);
      }
      .ic2 {
        margin-left: 12px;
      }
    }
    .hero-actions {
      margin-top: 20px;
      display: flex;
      gap: 12px;
      .mj-btn {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        svg {
          width: 15px;
          height: 15px;
        }
      }
      .mj-btn.ghost {
        background: transparent;
        color: var(--theme);
        border: 1px solid var(--theme);
      }
    }
    .hero-r {
      flex-shrink: 0;
      text-align: center;
      .trophy {
        width: 56px;
        height: 56px;
        color: var(--theme);
      }
      .hr-t {
        margin-top: 8px;
        font-size: 15px;
        font-weight: 700;
      }
      .hr-s {
        margin-top: 4px;
        font-size: 12px;
        opacity: 0.5;
      }
    }
  }
  .sec-t {
    display: flex;
    align-items: center;
    gap: 8px;
    margin: 20px 0 12px;
    font-size: 17px;
    font-weight: 700;
    svg {
      width: 18px;
      height: 18px;
      color: var(--theme);
    }
  }
  .prizes {
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
    padding: 18px 20px;
    .pr {
      font-size: 13px;
      opacity: 0.55;
    }
    .pp {
      margin-top: 8px;
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 17px;
      font-weight: 700;
      color: var(--theme);
      svg {
        width: 17px;
        height: 17px;
      }
    }
    .pd {
      margin-top: 8px;
      font-size: 12px;
      opacity: 0.5;
      line-height: 1.6;
    }
  }
  .login-card {
    margin-top: 16px;
    background: var(--background);
    border-radius: 14px;
    padding: 16px 24px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
    p {
      font-size: 14px;
      opacity: 0.7;
    }
  }
  .rank-card {
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
    .empty {
      padding: 60px 0;
      text-align: center;
      color: rgba(0, 0, 0, 0.35);
      svg {
        width: 56px;
        height: 56px;
      }
      p {
        margin-top: 12px;
        font-size: 14px;
      }
    }
  }
  .mj-btn.sm {
    padding: 8px 18px;
    font-size: 13px;
    flex-shrink: 0;
  }
}
</style>
