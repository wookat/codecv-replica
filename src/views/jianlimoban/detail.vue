<script setup lang="ts">
import { computed, ref, watchEffect } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { resolveTemplateType, templates } from '@/templates/config'
import { convertDOM } from '@/utils/moduleCombine'

const route = useRoute()
const router = useRouter()
const zoom = ref(false)

const type = computed(() => resolveTemplateType(route.params.type as string))
const tpl = computed<any>(() => templates.value.find(t => t.type === type.value))
// 生产固定推荐序（/jianlimoban/45 实测：46,18art,1internet_avatar,43,48,61,38,44）
const RELATED_ORDER = [
  '15simple_versatile',
  '16prominent_content',
  '31',
  '32',
  '33',
  '4internet',
  '49',
  '52'
]
const RELATED_DATE: Record<string, string> = {
  '46': '2025-03-22',
  '18art': '2024-03-18',
  '1internet_avatar': '2024-03-18',
  '43': '2024-03-18',
  '48': '2025-03-22',
  '61': '2025-09-17',
  '38': '2024-03-18',
  '44': '2024-03-18'
}
const related = computed<any[]>(() => {
  const byType = new Map(templates.value.map(t => [String(t.type), t]))
  return RELATED_ORDER.map(ty => byType.get(ty)).filter(
    t => t && String(t.type) !== String(type.value)
  )
})

const seoHtml = computed(() => {
  if (!tpl.value) return ''
  try {
    // 生产同款 sr-only SEO 块：页面 h1 只有一个（模板名），简历正文标题降为 h2
    return convertDOM(tpl.value.content)
      .innerHTML.replace(/<h1/g, '<h2')
      .replace(/<\/h1>/g, '</h2>')
  } catch {
    return ''
  }
})

watchEffect(() => {
  if (tpl.value) {
    const n = `${tpl.value.name}简历模板`
    document.title = `${n}免费下载_${n}制作 - CodeCV简历`
  }
})

const faqs = computed(() => {
  if (!tpl.value) return []
  const n = `${tpl.value.name}简历模板`
  return [
    {
      q: `${n}是免费的吗？`,
      a: `${n}可免费在线使用：登录后即可使用该模板创建简历，在线编辑与排版不收费。`
    },
    {
      q: `如何下载${n}？`,
      a: `无需下载模板文件。点击“免费使用该模板”将模板内容替换成你的经历，完成后可一键导出高清 PDF / PNG 文件，直接投递或打印。`
    },
    {
      q: `${n}适合哪些人？`,
      a: `该模板适合${(tpl.value.tags ?? [])
        .slice(0, 3)
        .join('、')}方向的求职者，实习、校招、社招等场景均可使用。`
    },
    {
      q: '可以修改模板的颜色和字体吗？',
      a: '可以。模板的主色调、字体颜色、正文字体、行距等都支持自定义，编辑时实时预览效果，改动不满意还可以从历史版本恢复。'
    },
    {
      q: '导出的简历清晰度如何？',
      a: '支持导出高清 PDF（文字可选中复制、打印不失真）与 PNG 图片两种格式，满足线上投递与线下打印需求。'
    }
  ]
})

const hotRank = computed(() =>
  [...templates.value].sort((a, b) => +(b.hot || 0) - +(a.hot || 0)).slice(0, 15)
)

function useTemplate() {
  router.push(`/editor/${type.value}`)
}
</script>

<template>
  <div class="jld-page">
    <!-- SEO 用的隐藏渲染（对齐生产 sr-only） -->
    <div class="sr-only" aria-hidden="true" v-html="seoHtml"></div>

    <template v-if="tpl">
      <el-breadcrumb separator="/">
        <el-breadcrumb-item :to="{ path: '/' }">首页</el-breadcrumb-item>
        <el-breadcrumb-item :to="{ path: '/jianlimoban' }">简历模板中心</el-breadcrumb-item>
        <el-breadcrumb-item>{{ tpl.name }}简历模板</el-breadcrumb-item>
      </el-breadcrumb>

      <div class="jld-main">
        <section class="hero">
          <div class="preview" @click="zoom = true">
            <div class="pv-box">
              <img :src="tpl.img" :alt="`${tpl.name}简历模板预览`" draggable="false" />
              <div class="pv-tip"><span>点击查看大图</span></div>
            </div>
          </div>

          <div class="panel">
            <h1>{{ tpl.name }}简历模板</h1>
            <p class="desc">{{ tpl.description }}</p>
            <p class="meta">
              <b>{{ tpl.hot ?? 0 }}+</b> 人使用过 <i>·</i> PDF / PNG 导出 <i>·</i> 免费在线编辑
            </p>
            <div class="actions">
              <button class="primary" @click="useTemplate"><span>点击使用该模板</span></button>
              <router-link to="/jianlimoban" class="ghost">换一个模板</router-link>
            </div>
            <div class="fit">
              <p class="fit-label">适用方向</p>
              <div class="fit-tags">
                <router-link
                  v-for="t in tpl.tags ?? []"
                  :key="t"
                  :to="{ path: '/jianlimoban', query: { tags: t } }"
                  class="fit-tag"
                  >{{ t }}</router-link
                >
              </div>
            </div>
            <div class="params">
              <p class="fit-label">模板参数</p>
              <ul>
                <li>
                  <span>字体</span><b>{{ tpl.font || '默认字体' }}</b>
                </li>
                <li>
                  <span>行距</span><b>{{ tpl.lineHeight || 25 }}px</b>
                </li>
                <li>
                  <span>主色调</span>
                  <b
                    ><i class="sw" :style="{ background: tpl.primaryBackground }"></i
                    >{{ tpl.primaryBackground }}</b
                  >
                </li>
                <li>
                  <span>字体颜色</span>
                  <b
                    ><i class="sw" :style="{ background: tpl.primaryColor }"></i
                    >{{ tpl.primaryColor }}</b
                  >
                </li>
              </ul>
            </div>
          </div>
        </section>
        <div class="jld-row">
          <div class="jld-left">
            <div v-if="related.length" class="rel">
              <div class="rel-head">
                <h2>相关简历模板推荐</h2>
                <router-link to="/jianlimoban" class="more">更多模板 →</router-link>
              </div>
              <div class="rel-grid">
                <router-link
                  v-for="t in related"
                  :key="t.type"
                  :to="`/jianlimoban/${t.type}`"
                  class="resume-card"
                >
                  <div class="rc-img">
                    <img
                      :src="t.img"
                      :alt="`${t.name}简历模板`"
                      width="500"
                      height="707"
                      loading="lazy"
                      decoding="async"
                    />
                    <span v-if="(t.hot ?? 0) >= 1000" class="hot-badge">
                      <svg viewBox="0 0 1024 1024" fill="currentColor" aria-hidden="true">
                        <path
                          d="M326.3 981.3C261.2 850.5 295.5 775.3 346.9 706.6c54.8-78.5 68.5-153.7 68.5-153.7s44.5 52.4 27.4 137.4c75.4-81.8 89.1-212.6 78.8-261.7 171.3 114.5 246.7 366.3 147.4 549.5 527.7-287.8 130.2-716.2 61.7-762 24 49 27.4 130.8-20.6 170C631.3 98.3 436 42.7 436 42.7c24 147.2-82.2 307.4-185 428.4-3.4-58.9-6.8-98.1-41.1-157-6.8 108-92.5 193-116.5 300.9-30.8 147.2 24 251.8 232.9 366.3z"
                        />
                      </svg>
                      热门
                    </span>
                  </div>
                  <div class="rc-info">
                    <h3 class="rc-name">{{ t.name }}简历模板</h3>
                    <p class="rc-desc">{{ t.description }}</p>
                    <div class="rc-tags">
                      <span v-for="x in (t.tags ?? []).slice(0, 4)" :key="x">{{ x }}</span>
                    </div>
                    <div class="rc-meta">
                      <span class="rc-users">
                        <svg viewBox="0 0 1024 1024" fill="currentColor" aria-hidden="true">
                          <path
                            d="M519.8 574.1c115.7 0 209.5-97.3 209.5-217.3S635.4 139.6 519.8 139.6 310.3 236.9 310.3 356.8s93.8 217.3 209.5 217.3z"
                          />
                          <path
                            d="M519.8 170.7c96.1 0 174.3 81.4 174.3 181.4s-78.2 181.4-174.3 181.4-174.4-81.4-174.4-181.4 78.3-181.4 174.4-181.4z"
                            fill="#f8d02d"
                          />
                        </svg>
                        {{ t.hot ?? 0 }}人使用
                      </span>
                      <span class="rc-date">{{
                        RELATED_DATE[String(t.type)] || t.level || '通用'
                      }}</span>
                    </div>
                  </div>
                </router-link>
              </div>
            </div>

            <div class="faq">
              <div class="sec-head">
                <i></i>
                <h2>常见问题</h2>
              </div>
              <details v-for="f in faqs" :key="f.q" class="faq-item">
                <summary>
                  {{ f.q }}
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7" />
                  </svg>
                </summary>
                <p class="fa">{{ f.a }}</p>
              </details>
            </div>
          </div>
          <aside class="jld-aside">
            <article class="promo-card">
              <p class="promo-title">2027校招信息汇总</p>
              <img src="/prod-assets/recruitment.webp" alt="2027校招信息汇总" loading="lazy" />
              <p class="promo-desc">打破信息差，早就是机会 🎈</p>
            </article>
            <div class="rank-card">
              <strong>简历模板热度排行榜</strong>
              <ul>
                <li v-for="(t, i) in hotRank" :key="t.type">
                  <router-link :to="`/jianlimoban/${t.type}`"
                    ><span class="rk" :class="{ top: i < 3 }">{{ i + 1 }}</span
                    >{{ (t.tags ?? []).join('/') }}</router-link
                  >
                  <sub> {{ t.hot ?? 0 }}</sub>
                </li>
              </ul>
            </div>
          </aside>
        </div>
        <div class="cta-wrap">
          <div class="cta">
            <h2>立即使用「{{ tpl.name }}」简历模板</h2>
            <p class="cta-sub">在线编辑、自动排版，5 分钟制作一份专业简历</p>
            <button class="primary" @click="useTemplate"><span>使用该模板</span></button>
          </div>
          <nav class="cta-links">
            <router-link to="/jianlimoban">查看其他简历模板</router-link>
            <router-link to="/feedback">反馈问题</router-link>
            <a href="#faq">常见问题</a>
          </nav>
        </div>
      </div>
    </template>
    <el-empty v-else description="模板不存在" />

    <el-image-viewer v-if="zoom && tpl" :url-list="[tpl.img]" @close="zoom = false" />
  </div>
</template>

<script lang="ts">
export default { name: 'jianlimoban-detail' }
</script>

<style lang="scss">
.jld-page {
  max-width: 1128px;
  margin: 16px auto;
  padding: 0 0 24px;
  font-family: 'Times New Roman', Times, serif;
  color: var(--font-color);
  display: flex;
  flex-direction: column;
  gap: 16px;
}
.jld-row {
  display: flex;
  gap: 24px;
  align-items: flex-start;
  margin-top: 16px;
}
.jld-left {
  flex: 1;
  min-width: 0;
}
.hero {
  display: flex;
  flex-direction: column;
  gap: 32px;
  align-items: flex-start;
  @media (min-width: 768px) {
    flex-direction: row;
    gap: 48px;
  }
}
.preview {
  width: 100%;
  max-width: 720px;
  flex: 1;
  cursor: zoom-in;
  .pv-box {
    position: relative;
    border-radius: 12px;
    overflow: hidden;
    background: var(--body-background);
    aspect-ratio: 210 / 297;
    box-shadow: 0 4px 18px rgba(0, 0, 0, 0.1);
    img {
      position: absolute;
      inset: 0;
      width: 100%;
      height: 100%;
      object-fit: cover;
      object-position: top;
    }
    .pv-tip {
      position: absolute;
      inset-inline: 0;
      bottom: 0;
      display: flex;
      justify-content: center;
      padding: 16px 0;
      background: linear-gradient(to top, rgba(0, 0, 0, 0.35), transparent);
      opacity: 0;
      transition: opacity 0.3s;
      span {
        color: rgba(255, 255, 255, 0.95);
        font-size: 12px;
        letter-spacing: 0.1em;
      }
    }
    &:hover .pv-tip {
      opacity: 1;
    }
  }
}
.panel {
  width: 100%;
  flex-shrink: 0;
  @media (min-width: 768px) {
    width: 360px;
    padding-top: 8px;
  }
  h1 {
    font-size: 24px;
    font-weight: 700;
    line-height: 1.4;
    margin: 0;
  }
  .desc {
    margin-top: 12px;
    font-size: 14px;
    line-height: 1.7;
    color: #6b7280;
    display: -webkit-box;
    -webkit-line-clamp: 3;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }
  .meta {
    margin-top: 16px;
    font-size: 14px;
    color: #6b7280;
    b {
      color: var(--font-color);
      font-weight: 500;
    }
    i {
      margin: 0 8px;
      color: #d1d5db;
      font-style: normal;
    }
  }
  .actions {
    margin-top: 34px;
    display: flex;
    flex-direction: column;
    gap: 10px;
    .primary {
      width: 100%;
      padding: 14px 0;
      border: none;
      border-radius: 999px;
      color: #fff;
      font-size: 15px;
      font-weight: 500;
      background: linear-gradient(90deg, #ff7449, #ff9a44);
      cursor: pointer;
      transition: all 0.2s;
      &:hover {
        filter: brightness(1.05);
        transform: scale(0.99);
      }
    }
    .ghost {
      width: 100%;
      text-align: center;
      padding: 10px 0;
      border-radius: 999px;
      font-size: 14px;
      color: #6b7280;
      text-decoration: none;
      background: rgba(0, 0, 0, 0.04);
      transition: all 0.2s;
      &:hover {
        color: var(--theme);
        background: rgba(0, 0, 0, 0.07);
      }
    }
  }
  .fit {
    margin-top: 28px;
  }
  .fit-label {
    font-size: 12px;
    color: #9ca3af;
    margin: 0 0 10px;
  }
  .fit-tags {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }
  .fit-tag {
    padding: 6px 12px;
    border-radius: 999px;
    font-size: 13px;
    color: #6b7280;
    text-decoration: none;
    background: rgba(0, 0, 0, 0.04);
    white-space: nowrap;
    transition: all 0.2s;
    &:hover {
      color: var(--theme);
    }
  }
  .params {
    margin-top: 24px;
    ul {
      list-style: none;
      padding: 0;
      margin: 0;
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 10px 16px;
    }
    li {
      display: flex;
      align-items: center;
      gap: 10px;
      font-size: 13px;
      span {
        color: #9ca3af;
        flex-shrink: 0;
      }
      b {
        font-weight: 500;
        display: flex;
        align-items: center;
        gap: 6px;
      }
      .sw {
        display: inline-block;
        width: 14px;
        height: 14px;
        border-radius: 4px;
      }
    }
  }
}
.rel {
  margin-top: 4px;
  .rel-head {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    padding: 0 14px;
    h2 {
      font-size: 18px;
      font-weight: 700;
      line-height: 28px;
      margin: 0 0 20px;
    }
    .more {
      font-size: 14px;
      color: #9ca3af;
      text-decoration: none;
      &:hover {
        color: var(--theme);
      }
    }
  }
  .rel-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 12px;
    max-width: 828px;
    @media (min-width: 768px) {
      grid-template-columns: repeat(4, 1fr);
      gap: 16px;
    }
    @media (min-width: 1024px) {
      gap: 20px;
    }
    @media (max-width: 640px) {
      grid-template-columns: 1fr;
    }
  }
  .resume-card {
    position: relative;
    display: flex;
    flex-direction: column;
    text-decoration: none;
    color: var(--font-color);
    cursor: pointer;
    border-radius: 12px;
    overflow: hidden;
    background: var(--background);
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
    transition: transform 0.3s, box-shadow 0.3s;
    &:hover {
      transform: translateY(-4px);
      box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
      .rc-name {
        color: var(--theme);
      }
    }
  }
  .rc-img {
    position: relative;
    aspect-ratio: 210 / 297;
    overflow: hidden;
    background: var(--body-background);
    .hot-badge {
      position: absolute;
      top: 8px;
      left: 8px;
      z-index: 2;
      display: flex;
      align-items: center;
      gap: 2px;
      background: linear-gradient(90deg, #ff7449, #ff9a44);
      color: #fff;
      font-size: 12px;
      padding: 2px 8px 2px 6px;
      border-radius: 999px;
      box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
      svg {
        width: 12px;
        height: 12px;
      }
    }
    img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      object-position: top;
      display: block;
      transition: transform 0.3s;
    }
  }
  .resume-card:hover .rc-img img {
    transform: scale(1.03);
  }
  .rc-info {
    display: flex;
    flex-direction: column;
    gap: 6px;
    flex: 1;
    padding: 10px;
    @media (min-width: 768px) {
      padding: 12px;
    }
  }
  .rc-name {
    margin: 0;
    font-size: 14px;
    font-weight: 600;
    line-height: 20px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    @media (min-width: 768px) {
      font-size: 15px;
    }
  }
  .rc-desc {
    display: none;
    margin: 0;
    font-size: 12px;
    line-height: 20px;
    color: #6b7280;
    @media (min-width: 768px) {
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }
  }
  .rc-tags {
    display: none;
    flex-wrap: wrap;
    gap: 4px;
    overflow: hidden;
    max-height: 20px;
    @media (min-width: 768px) {
      display: flex;
    }
    span {
      font-size: 12px;
      line-height: 20px;
      color: #6b7280;
      background: rgba(0, 0, 0, 0.04);
      border-radius: 4px;
      padding: 0 6px;
      white-space: nowrap;
    }
  }
  .rc-meta {
    margin-top: auto;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
    font-size: 12px;
    color: #9ca3af;
    .rc-users {
      display: flex;
      align-items: center;
      gap: 4px;
      white-space: nowrap;
      svg {
        width: 14px;
        height: 14px;
      }
    }
    .rc-date {
      flex-shrink: 0;
    }
  }
}
.cta {
  margin-top: 6px;
  padding: 56px 24px 53px;
  text-align: center;
  border-radius: 16px;
  background: linear-gradient(180deg, #fff4ec, #ffece1);
  h2 {
    font-size: 20px;
    font-weight: 700;
    line-height: 28px;
    margin: 0 0 10px;
  }
  .cta-sub {
    font-size: 14px;
    line-height: 20px;
    color: #6b7280;
    margin: 0 0 28px;
  }
  .primary {
    padding: 14px 34px;
    border: none;
    border-radius: 999px;
    color: #fff;
    font-size: 15px;
    font-weight: 500;
    background: linear-gradient(90deg, #ff7449, #ff9a44);
    cursor: pointer;
    transition: all 0.2s;
    &:hover {
      filter: brightness(1.05);
    }
  }
}
.cta-links {
  margin-top: 48px;
  display: flex;
  justify-content: center;
  gap: 20px;
  a {
    font-size: 12px;
    color: #9ca3af;
    &:hover {
      color: var(--theme);
    }
  }
}
.sec-head {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 16px;
  i {
    width: 4px;
    height: 16px;
    border-radius: 999px;
    background: linear-gradient(180deg, #ff7449, #ff9a44);
  }
  h2 {
    font-size: 18px;
    font-weight: 700;
    line-height: 28px;
    margin: 0;
  }
}
.faq {
  margin-top: 66px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  .sec-head {
    margin-bottom: 6px;
  }
  .faq-item {
    border-radius: 12px;
    background: rgba(0, 0, 0, 0.03);
    padding: 0 20px;
    summary {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      cursor: pointer;
      list-style: none;
      padding: 16px 0;
      font-size: 14px;
      color: var(--font-color);
      &:hover {
        color: var(--theme);
      }
      &::-webkit-details-marker {
        display: none;
      }
      svg {
        width: 14px;
        height: 14px;
        flex-shrink: 0;
        color: #d1d5db;
        transition: transform 0.3s;
      }
    }
    &[open] summary svg {
      transform: rotate(180deg);
    }
    .fa {
      font-size: 14px;
      color: #6b7280;
      line-height: 1.7;
      margin: -2px 0 0;
      padding-bottom: 16px;
    }
  }
}
.jld-aside {
  width: 254px;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  gap: 16px;
  position: sticky;
  top: 80px;
  .promo-card {
    background: var(--background);
    border-radius: 12px;
    padding: 16px;
    cursor: pointer;
    .promo-title {
      font-size: 16px;
      font-weight: 600;
      color: var(--theme);
      margin: 0;
    }
    img {
      width: 100%;
      border-radius: 12px;
      margin-top: 8px;
      display: block;
    }
    .promo-desc {
      font-size: 14px;
      color: var(--font-color);
      line-height: 1.6;
      margin: 8px 0 0;
    }
  }
  .rank-card {
    background: var(--background);
    border-radius: 12px;
    padding: 20px;
    strong {
      display: inline-block;
      font-size: 15px;
      color: var(--theme);
      margin-bottom: 8px;
    }
    ul {
      list-style: none;
      margin: 0;
      padding: 0;
      max-width: 200px;
      li {
        display: flex;
        align-items: center;
        justify-content: space-between;
        a {
          flex: 1;
          min-width: 0;
          font-size: 14px;
          line-height: 32px;
          color: inherit;
          text-decoration: none;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          &:hover {
            opacity: 0.7;
          }
        }
        .rk {
          margin-right: 12px;
          font-weight: 700;
          &.top {
            color: orangered;
          }
        }
        sub {
          color: orangered;
          font-weight: 700;
          white-space: nowrap;
        }
      }
    }
  }
}
@media (max-width: 1023px) {
  .jld-aside {
    display: none;
  }
}
</style>
