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
const related = computed<any[]>(() => {
  if (!tpl.value) return []
  const tags = new Set(tpl.value.tags ?? [])
  return templates.value
    .filter(t => t.type !== type.value && (t as any).tags?.some((x: string) => tags.has(x)))
    .sort((a, b) => +(b.hot || 0) - +(a.hot || 0))
    .slice(0, 8)
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

      <div class="jld-cols">
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
          <section v-if="related.length" class="rel">
            <div class="rel-head">
              <h2>相关简历模板推荐</h2>
              <router-link to="/jianlimoban" class="more">更多模板 →</router-link>
            </div>
            <div class="rel-grid">
              <div v-for="t in related" :key="t.type" class="rel-card">
                <div class="rc-row">
                  <router-link :to="`/jianlimoban/${t.type}`" class="rc-cover">
                    <span class="hot-badge">热门</span>
                    <img :src="t.img" :alt="`${t.name}简历模板`" loading="lazy" />
                    <span class="use-btn">使用模板</span>
                  </router-link>
                  <div class="rc-info">
                    <h3 class="rc-name">
                      <router-link :to="`/jianlimoban/${t.type}`">{{ t.name }}</router-link>
                    </h3>
                    <div class="rc-tags">
                      <span v-for="x in (t.tags ?? []).slice(0, 3)" :key="x">{{ x }}</span>
                    </div>
                    <p class="rc-meta">{{ t.hot ?? 0 }}人使用 · {{ t.level || '通用' }}</p>
                  </div>
                </div>
                <p class="rc-desc">{{ t.description }}</p>
              </div>
            </div>
          </section>

          <section class="faq">
            <h2>常见问题</h2>
            <div v-for="f in faqs" :key="f.q" class="faq-item">
              <p class="fq">{{ f.q }}</p>
              <p class="fa">{{ f.a }}</p>
            </div>
          </section>

          <section class="cta">
            <h2>立即使用「{{ tpl.name }}」简历模板</h2>
            <button class="primary" @click="useTemplate"><span>点击使用该模板</span></button>
          </section>
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
  max-width: 1280px;
  margin: 16px auto;
  padding: 0 16px 24px;
  color: var(--font-color);
  display: flex;
  flex-direction: column;
  gap: 16px;
}
.jld-cols {
  display: flex;
  gap: 24px;
  align-items: flex-start;
}
.jld-main {
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
    gap: 40px;
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
    -webkit-line-clamp: 5;
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
    margin-top: 24px;
    display: flex;
    flex-direction: column;
    gap: 10px;
    .primary {
      width: 100%;
      padding: 12px 0;
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
  margin-top: 32px;
  .rel-head {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    h2 {
      font-size: 18px;
      font-weight: 700;
      margin: 8px 0 12px;
    }
    .more {
      font-size: 13px;
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
    gap: 14px;
    @media (max-width: 640px) {
      grid-template-columns: 1fr;
    }
  }
  .rel-card {
    background: var(--background);
    border-radius: 12px;
    padding: 14px;
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
  }
  .rc-row {
    display: flex;
    gap: 12px;
  }
  .rc-cover {
    position: relative;
    flex-shrink: 0;
    width: 96px;
    display: block;
    .hot-badge {
      position: absolute;
      top: 0;
      left: 0;
      z-index: 2;
      background: linear-gradient(90deg, #ff7449, #ff9a44);
      color: #fff;
      font-size: 10px;
      padding: 2px 6px;
      border-radius: 6px 0 6px 0;
    }
    img {
      width: 100%;
      border-radius: 8px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.12);
      display: block;
    }
    .use-btn {
      position: absolute;
      left: 50%;
      bottom: 8px;
      transform: translateX(-50%);
      background: var(--theme);
      color: #fff;
      font-size: 10px;
      padding: 3px 8px;
      border-radius: 4px;
      white-space: nowrap;
    }
  }
  .rc-name {
    margin: 0;
    font-size: 14px;
    font-weight: 600;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    a {
      color: var(--font-color);
      text-decoration: none;
      &:hover {
        color: var(--theme);
      }
    }
  }
  .rc-tags {
    display: flex;
    gap: 4px;
    margin: 6px 0;
    span {
      font-size: 11px;
      color: #6b7280;
      border: 1px solid rgba(0, 0, 0, 0.08);
      border-radius: 4px;
      padding: 1px 5px;
    }
  }
  .rc-meta {
    font-size: 11px;
    color: #9ca3af;
    margin: 0;
  }
  .rc-desc {
    margin: 10px 0 0;
    font-size: 12px;
    color: #9ca3af;
    line-height: 1.7;
    display: -webkit-box;
    -webkit-line-clamp: 3;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }
}
.cta {
  margin-top: 40px;
  padding: 40px 0 48px;
  text-align: center;
  border-top: 1px solid rgba(0, 0, 0, 0.06);
  h2 {
    font-size: 20px;
    font-weight: 700;
    margin: 0 0 24px;
  }
  .primary {
    padding: 13px 56px;
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
.faq {
  margin-top: 32px;
  h2 {
    font-size: 18px;
    font-weight: 700;
    margin: 8px 0 12px;
  }
  .faq-item {
    padding: 14px 0;
    border-bottom: 1px solid rgba(0, 0, 0, 0.05);
    .fq {
      font-size: 14px;
      font-weight: 600;
      margin: 0 0 6px;
    }
    .fa {
      font-size: 13px;
      color: #6b7280;
      line-height: 1.8;
      margin: 0;
    }
  }
}
</style>
