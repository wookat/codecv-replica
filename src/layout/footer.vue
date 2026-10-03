<template>
  <div class="footer-wrap">
    <div class="footer noto-sans-sc">
      <ul>
        <strong class="title">友情链接</strong>
        <li><a href="https://markdown.com.cn" target="_blank" rel="noopener">markdown教程</a></li>
        <li>
          <a href="https://github.com/acmenlei/codecv" target="_blank" rel="noopener">开源代码</a>
        </li>
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
        <li class="mp-line">
          <el-popover placement="top" :width="150" trigger="hover">
            <template #reference><span class="mp-ref">客服微信</span></template>
            <img src="/prod-assets/wechat.jpg" alt="客服微信" class="mp-img" />
          </el-popover>
        </li>
        <li><router-link to="/progress">投递进度管理</router-link></li>
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
      a,
      .mp-ref {
        text-decoration: none;
        color: #999;
        font-size: 14px;
        cursor: pointer;
        &:hover {
          opacity: 0.6;
        }
      }
      .mp-img {
        width: 130px;
        display: block;
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
