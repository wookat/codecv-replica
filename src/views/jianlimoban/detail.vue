<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { templates } from '@/templates/config'
import { convertDOM } from '@/utils/moduleCombine'

const route = useRoute()
const router = useRouter()
const zoom = ref(false)

const type = computed(() => route.params.type as string)
const tpl = computed<any>(() => templates.value.find(t => t.type === type.value))
const related = computed<any[]>(() => {
  if (!tpl.value) return []
  const tags = new Set(tpl.value.tags ?? [])
  return templates.value
    .filter(t => t.type !== type.value && (t as any).tags?.some((x: string) => tags.has(x)))
    .sort((a, b) => +(b.hot || 0) - +(a.hot || 0))
    .slice(0, 10)
})

const seoHtml = computed(() => {
  if (!tpl.value) return ''
  try {
    return convertDOM(tpl.value.content).innerHTML
  } catch {
    return ''
  }
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
        </div>
      </section>

      <section v-if="related.length" class="rel">
        <h2>相关模板</h2>
        <div class="rel-row">
          <router-link
            v-for="t in related"
            :key="t.type"
            :to="`/jianlimoban/${t.type}`"
            class="rel-card"
          >
            <img :src="t.img" :alt="`${t.name}简历模板`" loading="lazy" />
            <span class="rn">{{ t.name }}</span>
          </router-link>
        </div>
      </section>
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
  max-width: 1160px;
  margin: 16px auto;
  padding: 0 16px 24px;
  color: var(--font-color);
  display: flex;
  flex-direction: column;
  gap: 16px;
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
  max-width: 640px;
  flex: 1;
  cursor: zoom-in;
  .pv-box {
    position: relative;
    border-radius: 12px;
    overflow: hidden;
    background: var(--body-background);
    aspect-ratio: 210 / 297;
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
    margin-top: 32px;
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
  }
}
.rel {
  h2 {
    font-size: 18px;
    font-weight: 700;
    margin: 8px 0 12px;
  }
  .rel-row {
    display: flex;
    gap: 12px;
    overflow-x: auto;
    padding-bottom: 8px;
  }
  .rel-card {
    flex-shrink: 0;
    width: 120px;
    text-decoration: none;
    color: var(--font-color);
    img {
      width: 100%;
      border-radius: 8px;
      box-shadow: 0 1px 4px rgba(0, 0, 0, 0.1);
      display: block;
    }
    .rn {
      display: block;
      margin-top: 6px;
      font-size: 12px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    &:hover .rn {
      color: var(--theme);
    }
  }
}
</style>
