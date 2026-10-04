<script setup lang="ts">
import outNav from '@/common/nav/outNav'
import User from './user.vue'
</script>

<template>
  <div class="header-moblie">
    <div class="m-logo" @click="$router.push('/home')">
      <img src="/prod-assets/logo.svg" alt="CodeCV 简历" draggable="false" />
    </div>
    <div class="m-right">
      <el-dropdown trigger="click">
        <button class="m-burger" aria-label="打开导航菜单">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="4" y1="7" x2="20" y2="7" />
            <line x1="4" y1="12" x2="20" y2="12" />
            <line x1="4" y1="17" x2="20" y2="17" />
          </svg>
        </button>
        <template #dropdown>
          <el-dropdown-menu>
            <el-dropdown-item
              :key="idx"
              v-for="(navItem, idx) in outNav"
              @click="$router.push(navItem.path)"
              >{{ navItem.name }}</el-dropdown-item
            >
          </el-dropdown-menu>
        </template>
      </el-dropdown>
      <User />
    </div>
  </div>
</template>

<style lang="scss" scoped>
.header-moblie {
  height: 60px;
  padding: 0 12px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 10px;
  .m-logo {
    height: 40px;
    cursor: pointer;
    img {
      height: 100%;
      object-fit: contain;
    }
  }
  .m-right {
    display: flex;
    align-items: center;
    gap: 10px;
  }
  .m-burger {
    width: 36px;
    height: 36px;
    border: none;
    background: transparent;
    color: var(--font-color);
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    svg {
      width: 22px;
      height: 22px;
    }
  }
  /* 移动端头部精简：仅汉堡+登录钮（与线上一致），隐藏主题/小程序入口 */
  :deep(.mp-entry),
  :deep(.divider),
  :deep(.tt-wrap) {
    display: none;
  }
}
</style>
