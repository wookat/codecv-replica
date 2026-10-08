<script setup lang="ts">
withDefaults(defineProps<{ jobsFirst?: boolean }>(), { jobsFirst: true })

// 生产页面通用右侧栏：校招 banner + 可选插槽卡片（如微信群 QR）+ 热度排行榜；
// jobsFirst=false 时 banner 排在插槽卡片与热度榜之后（对齐 /strategy 生产顺序）。
// 榜单为生产实测静态数据（probe 抓取，与线上一致）
const hotRank = [
  {
    href: '/jianlimoban/45',
    text: '产品/运营/数分/算法/前端/校招/社招/实习/上海交通大学/后端',
    hot: 55799
  },
  { href: '/jianlimoban/1internet_avatar', text: '互联网/校招/社招/可拖拽证件照', hot: 23460 },
  { href: '/jianlimoban/43', text: '研发/工程师/校招/社招/互联网/通用/华东师范大学', hot: 23085 },
  { href: '/jianlimoban/48', text: 'Java/前端/Go/校招/社招/左对齐/通用', hot: 22869 },
  {
    href: '/jianlimoban/61',
    text: 'AI开发/AI应用/程序员/Agent开发/RAG应用开发/AI大模型应用/暑期实习/软件工程/Ai',
    hot: 20679
  },
  { href: '/jianlimoban/38', text: '运营/互联网/校招/社招/简洁', hot: 15339 },
  { href: '/jianlimoban/44', text: '运营/研发/校招/社招/互联网/通用/实习/应届生', hot: 15236 },
  {
    href: '/jianlimoban/55',
    text: '后端/Java/Go/微服务/分布式/高并发/校招/社招/计算机科学与技术',
    hot: 13517
  },
  { href: '/jianlimoban/27', text: '校招/社招/电气/极简', hot: 10014 },
  {
    href: '/jianlimoban/15simple_versatile',
    text: '简约/后端/前端/互联网/Java/实习/通用/证件照',
    hot: 10011
  },
  { href: '/jianlimoban/35', text: '测试/互联网/校招/社招', hot: 7970 },
  { href: '/jianlimoban/41', text: '运营/设计/研发/校招/渐变配色/新媒体/自媒体', hot: 7954 },
  { href: '/jianlimoban/33', text: '事业单位/通用/简约/校招', hot: 7213 },
  { href: '/jianlimoban/34', text: '研发/前端/后端/测试/通用/校招/互联网/社招', hot: 7048 },
  { href: '/jianlimoban/39', text: '运营/互联网/校招/一页', hot: 7026 }
]
</script>

<template>
  <aside class="rail-aside">
    <router-link v-if="jobsFirst" to="/jobs" class="aside-jobs">
      <div class="aj-title">2027校招信息汇总</div>
      <img src="/codecv-assets/recruitment.webp" alt="2027校招信息汇总" loading="lazy" />
      <p class="aj-cap">打破信息差，早就是机会 🎈</p>
    </router-link>
    <slot />
    <div class="aside-rank">
      <p class="ar-title">简历模板热度排行榜</p>
      <ol class="ar-list">
        <li v-for="(t, i) in hotRank" :key="t.href">
          <router-link :to="t.href" class="text-ellipsis">
            <span class="rk" :class="{ top: i < 3 }">{{ i + 1 }}</span
            >{{ t.text }}
          </router-link>
          <sub class="rh"><i class="iconfont icon-hot"></i> {{ t.hot }}</sub>
        </li>
      </ol>
    </div>
    <router-link v-if="!jobsFirst" to="/jobs" class="aside-jobs">
      <div class="aj-title">2027校招信息汇总</div>
      <img src="/codecv-assets/recruitment.webp" alt="2027校招信息汇总" loading="lazy" />
      <p class="aj-cap">打破信息差，早就是机会 🎈</p>
    </router-link>
  </aside>
</template>

<style lang="scss">
.rail-aside {
  width: 220px;
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
    padding: 16px;
    text-decoration: none;
    .aj-title {
      font-size: 16px;
      font-weight: 600;
      color: var(--theme);
      margin-bottom: 8px;
    }
    img {
      width: 100%;
      height: 146px;
      object-fit: cover;
      display: block;
      border-radius: 12px;
    }
    .aj-cap {
      margin: 8px 0 0;
      font-size: 14px;
      line-height: 1.6;
      color: var(--font-color);
    }
  }
  .aside-rank {
    background: var(--background);
    border-radius: 12px;
    padding: 20px;
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
      li {
        display: flex;
        align-items: center;
        justify-content: space-between;
        cursor: pointer;
        &:hover {
          opacity: 0.7;
        }
      }
      li a {
        flex: 1;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        font-size: 14px;
        line-height: 32px;
        color: var(--font-color);
        text-decoration: none;
        .rk {
          margin-right: 12px;
          color: var(--font-color);
          &.top {
            color: #ff4500;
            font-weight: 700;
          }
        }
      }
      .rh {
        flex-shrink: 0;
        color: #ff4500;
        font-weight: 700;
        font-size: 14px;
        margin-bottom: 8px;
        text-align: right;
        white-space: nowrap;
      }
    }
  }
}
</style>
