<script setup lang="ts">
import outNav from '@/common/nav/outNav'
</script>

<template>
  <ul class="nav">
    <li
      v-for="(navItem, idx) in outNav"
      :key="idx"
      :class="{ checked: $route.path.startsWith(navItem.path) }"
    >
      <a
        v-if="navItem.external"
        :href="navItem.path"
        target="_blank"
        rel="noopener noreferrer"
        class="nav-link"
        >{{ navItem.name
        }}<span v-if="navItem.badge" class="nav-badge">{{ navItem.badge }}</span></a
      >
      <router-link v-else :to="navItem.path" class="nav-link"
        >{{ navItem.name
        }}<span v-if="navItem.badge" class="nav-badge">{{ navItem.badge }}</span></router-link
      >
    </li>
    <li class="sr-only"><router-link to="/shixisheng">专题模板</router-link></li>
  </ul>
</template>

<style lang="scss" scoped>
.nav {
  display: flex;
  align-items: center;
  list-style: none;
  gap: 2px;
  margin: 0;
  padding: 0;
  li {
    white-space: nowrap;
  }
  .nav-link {
    position: relative;
    display: inline-block;
    padding: 6px 10px;
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
  }
  .checked .nav-link {
    color: var(--theme);
    font-weight: 600;
  }
}
</style>
