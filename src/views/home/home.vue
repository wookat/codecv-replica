<script setup lang="ts">
// 生产首页「最新模板」为运营精选的 6 套固定卡片（名称与模板库展示名不同）
const RECENT = [
  { type: '45', img: '/static/webp/45-B6lizpRp.webp', name: '应届后端开发工程师' },
  { type: '1internet_avatar', img: '/static/webp/1-CJ2PN3sg.webp', name: '大数据开发工程师' },
  { type: '38', img: '/static/webp/38-XGXgWs1_.webp', name: '数据运营' },
  { type: '43', img: '/static/webp/43-DGmGKs4S.webp', name: '运营通用' },
  { type: '44', img: '/static/webp/44-O9bLJnm5.webp', name: '中高级数据运营通用' },
  {
    type: '15simple_versatile',
    img: '/static/webp/15-DVM_h8fX.webp',
    name: '后端Java开发工程师'
  }
]

const FEATURES = [
  { icon: '🎈', name: '不设限', desc: '简历模板中一切都是可控的 不被默认简历排版限制～' },
  { icon: '✨', name: '自动排版', desc: '只需关注简历内容本身 分页/排版自动生成～' },
  { icon: '✌🏻', name: '两种编辑模式', desc: '可选择适合自己的编写方式～' },
  { icon: '🔒', name: '隐私安全', desc: '不用担心个人信息泄露～' },
  { icon: '🌴', name: '所见即所得', desc: '简历导出效果与预览效果高度一致～' },
  { icon: '🎁', name: '至今已免费导出', strong: '20万+', desc: ' 简历!' }
]

// 生产首页右侧扇形简历图：5 张 /static/webp 封面 + rotate/z-index 叠扇 + 各自链接模板详情（prod DOM 逆向）
const FAN = [
  {
    src: '/static/webp/18-C2ddrgEb.webp',
    rotate: 40,
    z: 100,
    to: '/jianlimoban/18art',
    alt: 'CodeCV简历 - 简约/产品经理/商务/设计'
  },
  {
    src: '/static/webp/17-hAuO6TPg.webp',
    rotate: 20,
    z: 99,
    to: '/jianlimoban/17business',
    alt: 'CodeCV简历 - 商务/校招/互联网/设计'
  },
  {
    src: '/static/webp/16-Dfa-By72.webp',
    rotate: 0,
    z: 98,
    to: '/jianlimoban/16prominent_content',
    alt: 'CodeCV简历 - 设计/简约/通用/突出内容'
  },
  {
    src: '/static/webp/15-DVM_h8fX.webp',
    rotate: -20,
    z: 97,
    to: '/jianlimoban/15simple_versatile',
    alt: 'CodeCV简历 - 简约/后端/前端/互联网'
  },
  {
    src: '/static/webp/14-DeXkzOFm.webp',
    rotate: -40,
    z: 96,
    to: '/jianlimoban/14heading',
    alt: 'CodeCV简历 - 简约/设计/商务/运营'
  }
]

const newest = RECENT

const AI_CARDS = [
  {
    icon: '✨',
    title: '简历润色',
    desc: '给出需要润色的内容，自动识别并突出显示最相关的信息，让你的简历更加突出和吸引人，在求职过程中脱颖而出！'
  },
  {
    icon: '♻️',
    title: '中英互译',
    desc: '快速、精准的AI简历内容中英互译，助您轻松应对跨国求职～'
  },
  {
    icon: '✍🏻',
    title: '简历生成',
    desc: '让AI帮您撰写精美简历，通过强大的GPT生成，突出优势，脱颖而出！'
  }
]

const COMMENTS = [
  {
    content: '使用体验还不错呀，UI 做的也蛮好的，加油！',
    avatar: '/static/png/avatar1-155VfYeO.png',
    profession: '阿里巴巴前端'
  },
  {
    content:
      '在nk推荐中看到了这个工具，非常感谢作者大大的开发，虽然我不是前后端开发，但是直观感觉这玩意真好～',
    avatar: '/static/png/avatar2-Dk7PWhs9.png',
    profession: '嵌入式开发工程师'
  },
  {
    content: '这个简历工具实在是泰库辣！真的节省了我很多时间，简历模板也很实用，发现了宝藏工具！！',
    avatar: '/static/png/avatar3-CKCfc60R.png',
    profession: 'Java开发工程师'
  },
  {
    content:
      '简历写起来真的非常方便，因为我不懂UP说的markdown，所以我使用所见即所得方式编写，感觉就和写word一样简单，墙裂推荐～',
    avatar: '/static/png/avatar4-D4xNvzs7.png',
    profession: '用户运营'
  },
  {
    content:
      '周末在家搞网站发现的这个宝藏资源，写简历就跟写笔记一样简单了，所见即所得，以后写简历就在这上面了～',
    avatar: '/static/png/avatar5-CkIdX3WU.png',
    profession: '产品经理'
  }
]
</script>

<template>
  <div id="home">
    <!-- Hero：与线上版一致 -->
    <section class="hero noto-sans-sc">
      <div class="hero-l">
        <h1 class="sr-only">
          免费在线Markdown简历制作工具，专业中英文简历模板免费下载，涵盖前后端、产品、运营等岗位
        </h1>
        <p class="hero-title">互联网从业者都在用的专业简历工具</p>
        <ul class="hero-feats">
          <li v-for="f in FEATURES" :key="f.name">
            <span class="fi">{{ f.icon }}</span>
            <b>{{ f.name }}</b>
            <span class="fd"
              ><b v-if="f.strong" class="fstrong">{{ f.strong }}</b
              >{{ f.desc }}</span
            >
          </li>
        </ul>
        <div class="hero-cta">
          <router-link to="/jianlimoban" class="cta primary">免费生成专业简历</router-link>
          <a href="https://www.offerstar.cn" target="_blank" rel="noopener" class="cta ghost"
            >Ai笔试面试神器</a
          >
        </div>
      </div>
      <div class="hero-r">
        <router-link
          v-for="(f, i) in FAN"
          :key="i"
          :to="f.to"
          class="fan-a"
          :style="{ transform: `rotate(${f.rotate}deg)`, zIndex: f.z }"
        >
          <img :src="f.src" :alt="f.alt" loading="lazy" draggable="false" />
        </router-link>
      </div>
    </section>

    <!-- 最新模板 -->
    <section class="sec noto-sans-sc">
      <h2 data-aos="zoom-in">🤩 最新模板</h2>
      <p class="sub" data-aos="zoom-in">
        主打一个实用！如果你有喜欢的模板在这里没有，记得告诉我哦～
        等你下次再来的时候就能看到了，你永远可以相信作者的速度！
      </p>
      <ul class="tpl-grid">
        <li
          v-for="(t, i) in newest"
          :key="t.type"
          :data-aos="['fade-right', 'fade-up', 'fade-up', 'fade-down', 'fade-down', 'fade-left'][i]"
        >
          <router-link :to="`/jianlimoban/${t.type}`" class="tpl-card">
            <div class="tc-img">
              <span class="use-badge">999+ 人使用过</span>
              <img :src="t.img" :alt="`${t.name}简历模板`" loading="lazy" />
            </div>
            <p class="tc-name">{{ t.name }}简历模板</p>
          </router-link>
        </li>
      </ul>
    </section>

    <!-- AI 辅助写简历 -->
    <section class="sec ai noto-sans-sc">
      <h2 data-aos="fade-down">👋 AI 辅助写简历</h2>
      <p class="sub" data-aos="fade-up">
        简历内容不够丰富不知道如何下手？自己翻译简历觉得很困难？没关系，找 AI 这些都能解决～
      </p>
      <div class="ai-body">
        <img
          src="/static/svg/chat-Cr3bTpp1.svg"
          class="ai-illust"
          alt="AI小助手"
          data-aos="fade-right"
        />
        <ul class="ai-grid" data-aos="fade-right">
          <li v-for="(c, i) in AI_CARDS" :key="c.title" class="ai-card" :class="{ off: i === 1 }">
            <p class="ai-title">
              <span>{{ c.icon }}</span> {{ c.title }}
            </p>
            <p class="ai-desc">{{ c.desc }}</p>
          </li>
        </ul>
      </div>
    </section>

    <!-- 支持多文件导出 -->
    <section class="sec ext noto-sans-sc">
      <h2 data-aos="zoom-in">✌🏻 支持多文件导出</h2>
      <p class="sub" data-aos="zoom-in">
        除了 PDF 格式，我们还支持 Markdown、PNG格式的文件导出，基本涵盖大部分的使用场景
      </p>
      <div class="ext-body">
        <img
          src="/static/svg/ext-BRnvL-Al.svg"
          class="ext-illust"
          alt="支持多文件导出"
          data-aos="fade-right"
        />
        <div class="ext-labels" data-aos="zoom-in">
          <span class="pdf">.PDF</span>
          <span class="md">.MD</span>
          <span class="png">.PNG</span>
        </div>
        <p class="ext-desc" data-aos="fade-up">
          🚀 我们推出了多种导出方式，无论是制作图片还是 <b class="c-pdf">PDF</b> ，您只需编写简单的
          <b class="c-md">MD</b> 文本或者
          <b class="c-word">Word</b> ，其他的我们都助您轻松生成！快来尝试吧！✨
        </p>
      </div>
    </section>

    <!-- 好评如潮 -->
    <section class="sec comments noto-sans-sc">
      <h2 data-aos="zoom-in">😍 好评如潮</h2>
      <p class="sub" data-aos="zoom-in">
        CodeCV简历上线后得到了许多用户的喜欢，同时也收获了一些用户的反馈，看看他们是怎么说的吧～
      </p>
      <ul class="cm-grid">
        <li v-for="c in COMMENTS" :key="c.profession" class="cm-card" data-aos="zoom-in">
          <p class="cm-content">{{ c.content }}</p>
          <p class="cm-info">
            <img :src="c.avatar" alt="头像" /><sub>{{ c.profession }}</sub>
          </p>
        </li>
      </ul>
    </section>
  </div>
</template>

<style lang="scss" scoped>
#home {
  width: 100%;
  color: var(--font-color);
}
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip: rect(0 0 0 0);
}
.hero {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 40px;
  max-width: var(--max-width);
  margin: 0 auto;
  padding: 90px 20px 70px;
  background: linear-gradient(120deg, var(--background) 55%, rgba(255, 116, 73, 0.07));
}
.hero-l {
  max-width: 560px;
}
.hero-title {
  font-size: 40px;
  font-weight: 800;
  line-height: 1.3;
  margin: 0 0 30px;
}
.hero-feats {
  list-style: none;
  padding: 0;
  margin: 0 0 36px;
  li {
    display: flex;
    align-items: baseline;
    gap: 10px;
    font-size: 15px;
    line-height: 2.1;
    .fi {
      width: 24px;
      flex-shrink: 0;
    }
    b {
      font-weight: 700;
      flex-shrink: 0;
      white-space: nowrap;
    }
    .fd {
      color: #6b7280;
      font-size: 14px;
    }
    .fstrong {
      color: var(--theme);
      font-size: 18px;
    }
  }
}
.hero-cta {
  display: flex;
  gap: 16px;
}
.cta {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  height: 46px;
  padding: 0 30px;
  border-radius: 999px;
  font-size: 15px;
  font-weight: 600;
  text-decoration: none;
  transition: all 0.2s;
  &.primary {
    background: linear-gradient(90deg, #ff7449, #ff9a44);
    color: #fff;
    box-shadow: 0 6px 18px rgba(255, 116, 73, 0.35);
  }
  &.ghost {
    background: var(--background);
    color: var(--font-color);
    border: 1px solid rgba(0, 0, 0, 0.1);
  }
  &:hover {
    transform: translateY(-2px);
    filter: brightness(1.04);
  }
}
.hero-r {
  position: relative;
  flex-shrink: 0;
  width: 460px;
  height: 460px;
  display: flex;
  align-items: center;
  justify-content: center;
  .fan-a {
    position: absolute;
    display: inline-block;
    img {
      width: 190px;
      border-radius: 10px;
      box-shadow: 0 12px 32px rgba(0, 0, 0, 0.16);
      transition: transform 0.4s;
      display: block;
      cursor: pointer;
      &:hover {
        transform: scale(1.05);
      }
    }
  }
}
.sec {
  max-width: var(--max-width);
  margin: 0 auto;
  padding: 60px 20px 30px;
  text-align: center;
  h2 {
    font-size: 28px;
    font-weight: 800;
    margin: 0 0 12px;
  }
  .sub {
    color: #9ca3af;
    font-size: 14px;
    margin: 0 0 34px;
  }
}
.tpl-grid {
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  gap: 18px;
  list-style: none;
  padding: 0;
  margin: 0;
  @media (max-width: 1024px) {
    grid-template-columns: repeat(3, 1fr);
  }
  @media (max-width: 640px) {
    grid-template-columns: repeat(2, 1fr);
  }
}
.tpl-card {
  display: block;
  text-decoration: none;
  color: var(--font-color);
  .tc-img {
    position: relative;
    border-radius: 8px;
    overflow: hidden;
    box-shadow: 0 4px 14px rgba(0, 0, 0, 0.12);
    img {
      width: 100%;
      display: block;
    }
    .use-badge {
      position: absolute;
      top: 0;
      left: 0;
      z-index: 2;
      padding: 4px 8px;
      border-radius: 0 0 8px 0;
      background: linear-gradient(90deg, #ff7449, #ff9a44);
      color: #fff;
      font-size: 11px;
      font-weight: 600;
    }
  }
  .tc-name {
    margin: 10px 0 0;
    font-size: 13px;
    letter-spacing: 0.05em;
    text-align: center;
  }
  &:hover .tc-name {
    color: var(--theme);
  }
}
.ai-body {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 24px;
  @media (min-width: 768px) {
    flex-direction: row;
    justify-content: space-between;
  }
}
.ai-illust {
  width: 50%;
  min-width: 300px;
  margin-right: 20px;
  user-select: none;
  @media (max-width: 767px) {
    width: 100%;
    margin-right: 0;
  }
}
.ai-grid {
  display: flex;
  flex-direction: column;
  gap: 16px;
  list-style: none;
  padding: 0;
  margin: 0;
  text-align: left;
}
.ai-card {
  background: var(--background);
  border-radius: 14px;
  padding: 20px;
  max-width: 300px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
  &.off {
    @media (min-width: 768px) {
      transform: translateX(-100px);
    }
  }
  .ai-title {
    font-size: 16px;
    font-weight: 700;
    margin: 0 0 12px;
  }
  .ai-desc {
    font-size: 14px;
    line-height: 1.6;
    color: #6b7280;
    margin: 0;
  }
}
.ext-body {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20px;
  padding: 20px 0;
  @media (min-width: 768px) {
    flex-direction: row;
    justify-content: space-around;
  }
}
.ext-illust {
  max-width: 300px;
  user-select: none;
}
.ext-labels {
  display: flex;
  flex-direction: column;
  gap: 20px;
  font-size: 30px;
  font-weight: 700;
  .pdf {
    color: #e92423;
  }
  .md {
    color: #518bf8;
  }
  .png {
    color: #03c782;
  }
}
.ext-desc {
  max-width: 300px;
  font-size: 15px;
  line-height: 2.4;
  color: var(--font-color);
  b {
    font-weight: 700;
  }
  .c-pdf {
    color: #e92423;
  }
  .c-md {
    color: var(--theme);
  }
  .c-word {
    color: #518bf8;
  }
}
.cm-grid {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 16px;
  list-style: none;
  padding: 0;
  margin: 0;
  text-align: left;
  @media (max-width: 1024px) {
    grid-template-columns: repeat(2, 1fr);
  }
  @media (max-width: 640px) {
    grid-template-columns: 1fr;
  }
}
.cm-card {
  background: var(--background);
  border-radius: 14px;
  padding: 20px;
  box-shadow: 0 4px 14px rgba(0, 0, 0, 0.06);
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  min-height: 150px;
  .cm-content {
    font-size: 13px;
    line-height: 1.8;
    color: #4b5563;
    margin: 0 0 14px;
  }
  .cm-info {
    display: flex;
    align-items: center;
    gap: 8px;
    margin: 0;
    img {
      width: 30px;
      height: 30px;
      border-radius: 50%;
    }
    sub {
      font-size: 12px;
      color: #9ca3af;
    }
  }
}
@media (max-width: 1024px) {
  .hero {
    padding: 44px 20px 36px;
  }
  .hero-r {
    display: none;
  }
  .hero-title {
    font-size: 30px;
  }
}
@media (max-width: 640px) {
  .hero-title {
    font-size: 26px;
  }
  .hero-cta {
    flex-wrap: wrap;
    gap: 12px;
    .cta {
      height: 42px;
      padding: 0 22px;
      font-size: 14px;
    }
  }
  .sec {
    padding: 40px 16px 20px;
    h2 {
      font-size: 22px;
    }
  }
  .ext-illust {
    max-width: 100%;
  }
}
</style>
