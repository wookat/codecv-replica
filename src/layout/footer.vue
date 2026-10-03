<template>
  <div class="footer flex noto-sans-sc">
    <ul class="flex" data-aos="fade-right">
      <strong class="title">关于项目</strong>
      <li>
        <a href="https://github.com/acmenlei/codecv" target="_blank">开源代码</a>
      </li>
      <li>
        <a href="https://github.com/acmenlei/typenet" target="_blank">typenet</a>
      </li>
      <li>
        <a href="https://github.com/acmenlei/a4view" target="_blank">a4view</a>
      </li>
    </ul>
    <ul class="flex" data-aos="fade-right">
      <strong class="title">致谢</strong>
      <li>
        <a href="https://github.com/acmenlei/codecv" target="_blank">codecv 上游项目</a>
      </li>
      <li>
        <a href="https://github.com/acmenlei" target="_blank"
          ><i class="iconfont icon-github"></i> 原作者 GitHub</a
        >
      </li>
    </ul>
    <ul class="flex" data-aos="fade-left">
      <strong class="title">说明</strong>
      <li>模板与排版引擎基于 codecv 授权复刻</li>
      <li>数据默认保存在本地浏览器</li>
    </ul>
  </div>
</template>

<style lang="scss" scoped>
.footer {
  justify-content: space-around;
  padding: 20px;
  max-width: var(--max-width);
  margin: 0 auto;

  ul {
    flex-direction: column;
    list-style: none;
    line-height: 30px;
    margin-top: 20px;
    .title {
      margin-bottom: 10px;
    }
    &.row {
      flex-direction: row;
      text-align: center;
      li {
        display: inline-block;
        margin: 0 10px;
        font-size: 12px;
        &:first-child {
          margin-left: 0;
        }
        &:last-child {
          margin-right: 0;
        }
      }
    }
    strong {
      display: block;
    }
    img {
      width: 80px;
    }
    li {
      cursor: pointer;
      letter-spacing: 0.5px;

      a {
        text-decoration: none;
        color: #999;
        font-size: 14px;
      }
      &:hover {
        opacity: 0.6;
      }
      .icon-juejin {
        color: #2582ff;
      }
      .icon-bilibili {
        color: #00a1d6;
      }
      .icon-zhihu {
        color: #066de8;
      }
      .icon-gitee {
        color: #c71d23;
      }
      .icon-github {
        color: #777;
      }
    }
  }
}
</style>
