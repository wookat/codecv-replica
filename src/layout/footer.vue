<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
// 生产 /progress 为极简页脚（仅版权行）
const minimal = computed(() => useRoute().path === '/progress')
</script>

<template>
  <div class="footer-wrap">
    <div v-if="!minimal" class="footer noto-sans-sc">
      <ul>
        <strong class="title">友情链接</strong>
        <li><a href="https://markdown.com.cn" target="_blank" rel="noopener">markdown教程</a></li>
        <li><a href="https://shenqiji.com" target="_blank" rel="noopener">神器集</a></li>
      </ul>
      <ul>
        <strong class="title">其他产品</strong>
        <li>
          <a href="https://www.offerstar.cn" target="_blank" rel="noopener"
            >OfferStar - Ai笔试面试辅助工具</a
          >
        </li>
        <li>
          <a href="https://www.yanjiushe.cn" target="_blank" rel="noopener"
            >言究社 - 免费英语学习平台</a
          >
        </li>
        <li>
          <a href="https://www.niubi.xyz" target="_blank" rel="noopener">牛笔AI - 极简AI发文助手</a>
        </li>
      </ul>
      <ul>
        <strong class="title">社交媒体</strong>
        <li><a href="https://www.xiaohongshu.com" target="_blank" rel="noopener">小红书</a></li>
        <li><a href="https://www.bilibili.com" target="_blank" rel="noopener">B站</a></li>
      </ul>
      <ul>
        <strong class="title">联系方式/小程序</strong>
        <li class="mp-imgs">
          <div class="mp-one">
            <img src="/static/jpg/wechat-BjrEoHaI.jpg" alt="微信客服" />
            <strong>客服微信</strong>
          </div>
          <router-link to="/progress" class="mp-one">
            <img src="/static/webp/miniprogram-Ceuprux3.webp" alt="投递进度管理" />
            <strong>投递进度管理</strong>
          </router-link>
        </li>
      </ul>
    </div>
    <div class="copyright">CopyRight © 2023 CodeCV简历 | 赣ICP备2023009154号</div>
  </div>
</template>

<style lang="scss" scoped>
.footer-wrap {
  background: var(--background);
  color: var(--font-color);
  border-top: 1px solid rgba(0, 0, 0, 0.05);
}
.footer {
  display: flex;
  justify-content: space-around;
  flex-wrap: wrap;
  gap: 16px;
  padding: 36px 20px 12px;
  max-width: var(--max-width);
  margin: 0 auto;

  ul {
    display: flex;
    flex-direction: column;
    list-style: none;
    line-height: 30px;
    padding: 0;
    margin: 0;
    .title {
      margin-bottom: 12px;
      font-size: 15px;
    }
    li {
      letter-spacing: 0.5px;
      font-size: 14px;
      color: #555;
      a,
      .mp-ref {
        text-decoration: none;
        color: #6b7280;
        font-size: 14px;
        cursor: pointer;
        &:hover {
          opacity: 0.6;
        }
      }
      &.mp-imgs {
        flex-direction: row;
        gap: 20px;
        margin-top: 16px;
        .mp-one {
          display: flex;
          flex-direction: column;
          align-items: center;
          width: 80px;
          height: 80px;
          padding: 2px;
          background: #fff;
          border-radius: 6px;
          text-decoration: none;
          img {
            width: 100%;
            margin-bottom: 12px;
            display: block;
          }
          strong {
            font-size: 12px;
            color: var(--font-color);
            font-weight: 400;
            white-space: nowrap;
          }
        }
      }
    }
  }
}
.copyright {
  text-align: center;
  font-size: 12px;
  color: #9ca3af;
  padding: 14px 0 20px;
}
</style>
