<script setup lang="ts">
import { computed } from 'vue'
import { templates } from '@/templates/config'

// 生产页面通用右侧栏：校招 banner + 可选插槽卡片（如微信群 QR）+ 热度排行榜
const hotRank = computed(() =>
  [...templates.value].sort((a, b) => +(b.hot || 0) - +(a.hot || 0)).slice(0, 15)
)
</script>

<template>
  <aside class="rail-aside">
    <router-link to="/jobs" class="aside-jobs">
      <img src="/prod-assets/offerstar-recruit.webp" alt="2027校招信息汇总" />
      <p class="aj-cap">打破信息差，早就是机会 🎈</p>
    </router-link>
    <slot />
    <div class="aside-rank">
      <p class="ar-title">简历模板热度排行榜</p>
      <ol class="ar-list">
        <li v-for="(t, i) in hotRank" :key="t.type">
          <router-link :to="`/jianlimoban/${t.type}`">
            <span class="rk" :class="{ top: i < 3 }">{{ i + 1 }}</span>
            <span class="rt">{{ (t.tags ?? []).slice(0, 6).join('/') || t.name }}</span>
            <span class="rh">🔥{{ t.hot }}</span>
          </router-link>
        </li>
      </ol>
    </div>
  </aside>
</template>

<style lang="scss">
.rail-aside {
  width: 260px;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  gap: 14px;
  @media (max-width: 900px) {
    display: none;
  }
  .aside-jobs {
    border-radius: 12px;
    overflow: hidden;
    display: block;
    background: var(--background);
    img {
      width: 100%;
      display: block;
    }
    .aj-cap {
      margin: 0;
      padding: 10px;
      font-size: 12px;
      color: #6b7280;
      text-align: center;
    }
  }
  .aside-rank {
    background: var(--background);
    border-radius: 12px;
    padding: 14px;
    .ar-title {
      font-size: 14px;
      font-weight: 700;
      color: var(--theme);
      margin: 0 0 10px;
    }
    .ar-list {
      list-style: none;
      padding: 0;
      margin: 0;
      li a {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 5px 0;
        font-size: 12px;
        color: var(--font-color);
        text-decoration: none;
        .rk {
          width: 16px;
          flex-shrink: 0;
          font-weight: 700;
          color: #9ca3af;
          &.top {
            color: var(--theme);
          }
        }
        .rt {
          flex: 1;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          color: #6b7280;
        }
        .rh {
          flex-shrink: 0;
          color: #9ca3af;
          font-size: 11px;
        }
        &:hover .rt {
          color: var(--theme);
        }
      }
    }
  }
}
</style>
