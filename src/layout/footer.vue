<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
// 生产 /progress 为极简页脚（仅版权行）
const route = useRoute()
const minimal = computed(() => route.path === '/progress')
</script>

<template>
  <div class="footer-wrap">
    <!-- 结构逐类对齐生产：flex-row 四组 + p-10 + justify-between -->
    <div v-if="!minimal" class="footer noto-sans-sc">
      <ul class="fcol">
        <strong class="ftitle">友情链接</strong>
        <li>
          <a href="https://markdown.com.cn/basic-syntax" target="_blank" rel="noopener noreferrer"
            >markdown教程</a
          >
        </li>
        <li>
          <a href="https://hao.logosc.cn" target="_blank" rel="noopener noreferrer">神器集</a>
        </li>
      </ul>
      <ul class="fcol">
        <strong class="ftitle">其他产品</strong>
        <li class="mr2">
          <a
            href="https://test.zalize.com?utm_source=codecv"
            target="_blank"
            rel="noopener noreferrer"
            >答对 - AI笔试面试辅助工具</a
          >
        </li>
        <li class="mr2">
          <a
            href="https://apply.zalize.com?utm_source=codecv"
            target="_blank"
            rel="noopener noreferrer"
            >速申 - 网申简历助手</a
          >
        </li>
        <li class="mr2">
          <a
            href="https://jobs.zalize.com?utm_source=codecv"
            target="_blank"
            rel="noopener noreferrer"
            >上岸雷达 - 校招进度追踪</a
          >
        </li>
      </ul>
      <ul class="fcol">
        <strong class="ftitle">帮助支持</strong>
        <li>
          <router-link to="/syntax/helper">简历编写指南</router-link>
        </li>
        <li>
          <router-link to="/feedback">意见反馈</router-link>
        </li>
        <li>
          <router-link to="/agreement">用户协议与隐私政策</router-link>
        </li>
      </ul>
    </div>
    <div v-if="!minimal" class="fline" />
    <div class="copyright">
      <p class="icp">CopyRight © 2025 CodeCV简历</p>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.footer-wrap {
  background: var(--body-background);
  color: var(--font-color);
}
.footer {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  max-width: var(--max-width);
  margin: 20px auto 0;
  /* 生产页脚内容 x=120 起（容器 1300 + 左右 50px） */
  padding: 40px 50px;
  overflow: hidden;
  @media (min-width: 768px) {
    flex-direction: row;
  }
}
.fcol {
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;
  margin: 0 0 16px;
  padding: 0;
  list-style: none;
  @media (min-width: 768px) {
    flex-direction: column;
  }
  .ftitle {
    margin: 0 16px 8px 0;
    width: 80px;
    font-size: 14px;
  }
  li {
    list-style: none;
    margin-right: 16px;
    cursor: pointer;
    line-height: 32px;
    letter-spacing: 0.05em;
    font-size: 14px;
    &.mr2 {
      margin-right: 8px;
    }
    a {
      text-decoration: none;
      color: rgb(107, 114, 128);
      &:hover {
        opacity: 0.6;
      }
    }
  }
}
.mp-row {
  display: flex;
  flex-direction: row;
  text-align: center;
  margin-top: 16px;
  padding: 0;
  font-size: 14px;
  list-style: none;
}
.mp-card {
  width: 80px;
  height: 80px;
  padding: 4px;
  background: #fff;
  border-radius: 6px;
  list-style: none;
  &.first {
    margin-right: 20px;
  }
  img {
    width: 100%;
    margin-bottom: 12px;
    display: block;
  }
  strong {
    font-size: 12px;
    font-weight: 400;
    white-space: nowrap;
  }
}
.fline {
  height: 1px;
  max-width: var(--max-width);
  margin: 0 auto;
  background: rgb(203, 213, 225);
  opacity: 0.4;
}
.copyright {
  display: flex;
  flex-direction: column;
  margin: 8px;
  align-items: center;
  font-size: 12px;
  letter-spacing: 0.05em;
  .icp {
    color: rgb(148, 163, 184);
    line-height: 24px;
    text-align: center;
    margin: 0;
    a {
      color: inherit;
      text-decoration: none;
    }
  }
}
</style>
