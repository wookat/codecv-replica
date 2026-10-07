<script setup lang="ts">
import outNav from '@/common/nav/outNav'
</script>

<template>
  <nav class="site-nav">
    <template v-for="(navItem, idx) in outNav" :key="idx">
      <a
        v-if="navItem.external"
        :href="navItem.path"
        target="_blank"
        rel="noopener noreferrer"
        class="nav-link"
        :class="{ checked: $route.path.startsWith(navItem.path) }"
        >{{ navItem.name
        }}<span v-if="navItem.badge" class="nav-badge">{{ navItem.badge }}</span></a
      >
      <router-link
        v-else
        :to="navItem.path"
        class="nav-link"
        :class="{ checked: $route.path.startsWith(navItem.path) }"
        >{{ navItem.name
        }}<span v-if="navItem.badge" class="nav-badge">{{ navItem.badge }}</span></router-link
      >
    </template>
  </nav>
</template>

<style lang="scss" scoped>
.site-nav {
  display: flex;
  align-items: center;
  /* 生产项间距 4px */
  gap: 4px;
  margin: 0;
  padding: 0;
  .nav-link {
    position: relative;
    display: inline-block;
    white-space: nowrap;
    /* 生产链接高 37px（y12）、横向内距 14px */
    padding: 8px 14px;
    font-size: 15px;
    font-weight: 500;
    color: var(--font-color);
    text-decoration: none;
    transition: color 0.2s;
    &:hover {
      color: var(--theme);
    }
    .nav-badge {
      position: absolute;
      top: 0;
      right: -4px;
      font-size: 9px;
      font-weight: 700;
      color: orangered;
    }
    &.checked {
      color: var(--theme);
      font-weight: 600;
      /* 生产当前页导航下短橙色指示条 */
      &::after {
        content: '';
        position: absolute;
        left: 50%;
        bottom: 0;
        transform: translateX(-50%);
        width: 60%;
        height: 2.5px;
        border-radius: 3px;
        background: var(--theme);
      }
    }
  }
}
</style>
