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

const FEATURES: { icon: string; name: string; pre?: string; strong?: string; desc: string }[] = [
  { icon: '🎈', name: '不设限', desc: '简历模板中一切都是可控的 不被默认简历排版限制～' },
  { icon: '✨', name: '自动排版', desc: '只需关注简历内容本身 分页/排版自动生成～' },
  { icon: '✌🏻', name: '两种编辑模式', desc: '可选择适合自己的编写方式～' },
  { icon: '🔒', name: '隐私安全', desc: '不用担心个人信息泄露～' },
  { icon: '🌴', name: '所见即所得', desc: '简历导出效果与预览效果高度一致～' },
  { icon: '🎁', name: '', pre: '至今已免费导出', strong: '20万+', desc: ' 简历!' }
]

// 生产首页右侧扇形简历图：DOM 顺序 18/17/16/15/14，旋转 40/20/0/-20/-40，z 100→96，img 250px
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
    <!-- Hero：与线上版一致（h-100vh / mt-[-80px] / 左文右扇） -->
    <section class="hero noto-sans-sc">
      <div class="introduce">
        <div class="introduce-l">
          <h1 class="sr-only">
            免费在线Markdown简历制作工具，专业中英文简历模板免费下载，涵盖前后端、产品、运营等岗位
          </h1>
          <h2 class="hero-title">互联网从业者都在用的专业简历工具</h2>
          <div v-for="f in FEATURES" :key="f.name" class="feat">
            <span class="fi">{{ f.icon }}</span>
            <strong v-if="f.name" class="text-shine">{{ f.name }}</strong>
            {{ f.pre }}
            <strong v-if="f.strong" class="text-shine big">{{ f.strong }}</strong>
            {{ f.desc }}
          </div>
          <div class="hero-cta">
            <router-link to="/jianlimoban" class="cta primary">
              免费生成专业简历
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                <path d="M9 6l6 6-6 6" />
              </svg>
            </router-link>
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
        <!-- 生产同款模糊椭圆彩色光晕 mask -->
        <div class="mask">
          <svg viewBox="0 0 800 450" opacity="0.19" preserveAspectRatio="none">
            <defs>
              <filter id="bbblurry" x="-100%" y="-100%" width="400%" height="400%">
                <feGaussianBlur stdDeviation="50" />
              </filter>
            </defs>
            <g filter="url(#bbblurry)">
              <ellipse rx="74" ry="79" cx="303" cy="196" fill="hsla(290,87%,47%,1)" />
              <ellipse rx="74" ry="79" cx="136" cy="235" fill="hsla(272,99%,54%,1)" />
              <ellipse rx="74" ry="79" cx="373" cy="224" fill="hsla(37,91%,55%,1)" />
              <ellipse rx="74" ry="79" cx="201" cy="158" fill="hsla(167,72%,60%,1)" />
            </g>
          </svg>
        </div>
      </div>
    </section>

    <!-- 最新模板（生产：标题为灰底卡片 p-10 bg-body-background rounded-xl mb-2） -->
    <section class="sec noto-sans-sc">
      <div class="sec-head">
        <h2 data-aos="zoom-in">🤩 最新模板</h2>
        <p class="sub" data-aos="zoom-in">
          主打一个实用！如果你有喜欢的模板在这里没有，记得告诉我哦～
          等你下次再来的时候就能看到了，你永远可以相信作者的速度！
        </p>
      </div>
      <ul class="tpl-grid">
        <li
          v-for="(t, i) in newest"
          :key="t.type"
          :data-aos="['fade-right', 'fade-up', 'fade-up', 'fade-down', 'fade-down', 'fade-left'][i]"
          @click="$router.push(`/jianlimoban/${t.type}`)"
        >
          <!-- 生产实测：a 仅覆盖卡底文字区(y1305 h80)，img 在 a 外为 li 直接子级 -->
          <img :src="t.img" :alt="`模板使用人数统计`" loading="lazy" class="tc-img" />
          <router-link :to="`/jianlimoban/${t.type}`" class="tpl-card">
            <span class="use-badge">999+ 人使用过</span>
            <p class="tc-name">{{ t.name }}简历模板</p>
          </router-link>
        </li>
      </ul>
    </section>

    <!-- AI 辅助写简历（生产整区为灰底宽条，头部透明） -->
    <section class="sec ai noto-sans-sc">
      <div class="sec-head nobg">
        <h2 data-aos="fade-down">👋 AI 辅助写简历</h2>
        <p class="sub" data-aos="fade-up">
          简历内容不够丰富不知道如何下手？自己翻译简历觉得很困难？没关系，找 AI 这些都能解决～
        </p>
      </div>
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
      <div class="sec-head">
        <h2 data-aos="zoom-in">✌🏻 支持多文件导出</h2>
        <p class="sub" data-aos="zoom-in">
          除了 PDF 格式，我们还支持 Markdown、PNG格式的文件导出，基本涵盖大部分的使用场景
        </p>
      </div>
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

    <!-- 好评如潮（生产标题卡额外 mb-20） -->
    <section class="sec comments noto-sans-sc">
      <div class="sec-head mb20">
        <h2 data-aos="zoom-in">😍 好评如潮</h2>
        <p class="sub" data-aos="zoom-in">
          CodeCV简历上线后得到了许多用户的喜欢，同时也收获了一些用户的反馈，看看他们是怎么说的吧～
        </p>
      </div>
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
  /* 生产 #introduce：h-100vh / mt-[-80px] / max-w-screen-xl / items-center / xl:overflow-visible */
  position: relative;
  overflow: hidden;
  margin-top: -80px;
  @media (min-width: 1280px) {
    overflow: visible;
  }
  .introduce {
    position: relative;
    display: flex;
    align-items: center;
    height: 100vh;
    max-width: 1280px;
    margin: 0 auto;
    box-sizing: border-box;
  }
  .introduce-l {
    padding: 16px;
    width: 100%;
    min-width: 250px;
    z-index: 10;
  }
}
.mask {
  position: absolute;
  left: 0;
  top: 0;
  width: 100%;
  pointer-events: none;
  svg {
    width: 100%;
    height: auto;
    display: block;
  }
}
.hero-title {
  /* 生产 text-4xl leading-50px mb-5 */
  font-size: 36px;
  font-weight: 700;
  line-height: 50px;
  margin: 0 0 20px;
  white-space: nowrap;
}
.feat {
  /* 生产 tracking-widest whitespace-nowrap，行间 mt-1 */
  letter-spacing: 0.1em;
  white-space: nowrap;
  margin-top: 4px;
  font-size: 16px;
  line-height: 36px;
  .fi {
    /* 生产 text-3xl emoji */
    font-size: 30px;
    line-height: 1;
    vertical-align: -2px;
  }
  .text-shine {
    /* 生产 text-xl m-3 text-shine（橙色渐变加粗字） */
    font-size: 20px;
    font-weight: 700;
    margin: 0 12px;
    background: linear-gradient(90deg, #ff7d31, #ff1480);
    -webkit-background-clip: text;
    background-clip: text;
    color: transparent;
  }
  .big {
    font-size: 24px;
  }
}
.hero-cta {
  /* 生产 flex gap-4 mt-10 */
  display: flex;
  gap: 16px;
  margin-top: 40px;
}
.cta {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  padding: 8px 20px;
  border-radius: 30px;
  font-size: 18px;
  font-weight: 400;
  text-decoration: none;
  white-space: nowrap;
  cursor: pointer;
  transition: all 0.2s;
  svg {
    width: 18px;
    height: 18px;
  }
  &.primary {
    /* 生产 from-[#ff7d31] to-[#ff1480] + shadow-xl */
    background: linear-gradient(90deg, #ff7d31, #ff1480);
    color: #fff;
    box-shadow: 0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1);
  }
  &.ghost {
    background: #fff;
    color: #000;
    border: 1px solid #d1d5db;
  }
  &:hover {
    transform: scale(1.05);
    opacity: 0.9;
  }
}
.hero-r {
  /* 生产实测容器被压到 x1045 w315：定宽 320 + shrink:0 让左栏拿 640 */
  display: flex;
  width: 320px;
  flex-shrink: 0;
  margin-left: 320px;
  height: 100%;
  align-items: center;
  justify-content: center;
  .fan-a {
    display: inline-block;
    position: relative;
    img {
      width: 250px;
      max-width: none;
      box-shadow: 0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1);
      display: block;
      cursor: pointer;
      transition: transform 0.3s;
      &:hover {
        transform: scale(1.05);
      }
    }
  }
}
.sec {
  /* 生产区块自身无垂直间距——全由标题卡 p-10 与 ul mt-4/pb-5 承担 */
  width: 100%;
  padding: 0 4px;
  text-align: center;
  .sec-head {
    padding: 40px;
    text-align: center;
    background: var(--body-background);
    border-radius: 12px;
    margin-bottom: 8px;
    &.nobg {
      background: transparent;
      margin-bottom: 0;
    }
    &.mb20 {
      margin-bottom: 36px;
    }
    h2 {
      font-size: 36px;
      font-weight: 700;
      line-height: 60px;
      margin: 0 0 12px;
    }
    .sub {
      color: #999;
      font-size: 14px;
      margin: 0;
    }
  }
}
.tpl-grid {
  /* 生产：ul grid-cols-6 max-w-screen-xl(1280) mt-4 mx-auto pb-5，li 外边距 20px 作间距 */
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  gap: 0;
  list-style: none;
  max-width: 1280px;
  padding: 0 0 20px;
  margin: 16px auto 0;
  overflow: hidden;
  > li {
    margin: 20px;
    position: relative;
    text-align: center;
  }
  /* 生产断点 grid-cols-2 / md(768):cols-3 / xl(1280):cols-6 */
  @media (max-width: 1279px) {
    grid-template-columns: repeat(3, 1fr);
  }
  @media (max-width: 767px) {
    grid-template-columns: repeat(2, 1fr);
  }
}
.tc-img {
  /* li 的 margin:20 已承担卡距，img 铺满内容盒（实测 w173=li 宽） */
  width: 100%;
  margin: 0;
  border-radius: 6px;
  box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);
  display: block;
  cursor: pointer;
}
.tpl-card {
  /* 生产 a.no-underline：内联元素，实测盒 y1305 h80（顶部盖住图底 ~35px） */
  text-decoration: none;
  display: inline-block;
  margin-top: -35px;
  padding-top: 35px;
  .use-badge {
    position: absolute;
    top: 0;
    left: 0;
    z-index: 2;
    padding: 5px 10px;
    border-radius: 6px 0 6px 0;
    background: var(--theme);
    color: #fff;
    font-size: 12px;
    font-weight: 400;
    line-height: 18px;
  }
  .tc-name {
    margin: 8px 0 0;
    font-size: 16px;
    color: var(--font-color);
    letter-spacing: 0.05em;
    text-align: center;
  }
  &:hover .tc-name {
    color: var(--theme);
  }
}
.sec.ai {
  /* 生产 AI 区为整宽灰底条；顶距由透明标题卡 p-10 提供，底部留 20 */
  background: var(--body-background);
  padding: 0 4px;
  /* 生产标题卡底到图距 ~48px：透明头卡底 padding 收到 25；h2→sub 距归零 */
  .sec-head {
    /* h2→sub 距并入底 padding（总高不变，svg 不受影响） */
    padding-bottom: 37px;
    h2 {
      margin-bottom: 0;
    }
  }
  .ai-body {
    max-width: 1280px;
    margin: 0 auto;
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
  margin: 40px 0 0;
  text-align: left;
  @media (min-width: 768px) {
    margin: 0 20px 0 0;
  }
}
.ai-card {
  /* 生产：bg-background rounded-2xl shadow-xl tracking-widest leading-6 p-5 */
  background: var(--background);
  border-radius: 16px;
  padding: 20px;
  max-width: 300px;
  letter-spacing: 0.1em;
  line-height: 24px;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
  &.off {
    @media (min-width: 768px) {
      transform: translateX(-100px);
    }
  }
  .ai-title {
    /* 生产 strong.text-shine 渐变标题 mb-3 block */
    display: block;
    font-size: 16px;
    font-weight: 700;
    margin: 0 0 12px;
    background: linear-gradient(90deg, #ff7d31, #ff1480);
    -webkit-background-clip: text;
    background-clip: text;
    color: transparent;
    width: fit-content;
  }
  .ai-desc {
    font-size: 16px;
    color: var(--font-color);
    margin: 0;
  }
}
.ext-body {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  /* 生产 .ext：整宽 p-5 space-around → 图 x140 / 描述 x1000 */
  padding: 0 20px;
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
  /* 生产的格式徽标用 serif（实测 Times New Roman） */
  font-family: 'Times New Roman', Times, serif;
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
  font-size: 16px;
  /* 生产：leading-10 tracking-widest p-5 ml-5 */
  line-height: 40px;
  letter-spacing: 0.1em;
  padding: 20px;
  margin-left: 20px;
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
  /* 生产 ul.grid xl:cols-5 max-w-screen-xl mx-auto：卡 240 起 x88、间距 20 */
  grid-template-columns: repeat(5, 1fr);
  gap: 20px;
  list-style: none;
  padding: 0;
  max-width: 1280px;
  margin: 0 auto;
  text-align: left;
  @media (max-width: 1279px) {
    grid-template-columns: repeat(3, 1fr);
  }
  @media (max-width: 767px) {
    grid-template-columns: 1fr;
  }
}
.sec.comments {
  padding-bottom: 60px;
}
.sec.ext {
  /* 生产导出区底到评论头卡间留 ~20px */
  padding-bottom: 20px;
}
.cm-card {
  /* 生产评论卡灰底：内容区固定 140px + 40px 头像行 → 整卡 228px */
  background: #f3f5f7;
  border-radius: 12px;
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  .cm-content {
    font-size: 14px;
    line-height: 1.8;
    color: #4b5563;
    margin: 0;
    min-height: 140px;
  }
  .cm-info {
    display: flex;
    align-items: center;
    gap: 8px;
    margin: 0;
    height: 40px;
    img {
      width: 40px;
      height: 40px;
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
    margin-top: 0;
    .introduce {
      height: auto;
      padding: 44px 20px 36px;
    }
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
