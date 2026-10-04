<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import { convertDOM } from '@/utils/moduleCombine'
import { templates } from '@/templates/config'
import { applyTemplateTheme, importCSS } from '@/utils'

const route = useRoute()
const html = ref('')
const tpl = computed(() => templates.value.find(t => t.type === (route.params.type as string)))

onMounted(() => {
  const type = route.params.type as string
  const t = templates.value.find(x => x.type === type)
  importCSS(type)
  applyTemplateTheme(type)
  // 公开简历页：优先取本地已存内容，否则展示模板原文
  let md = ''
  try {
    const raw = localStorage.getItem(`markdown-content-${type}`)
    md = raw ? JSON.parse(raw).value ?? '' : ''
  } catch {
    /* ignore */
  }
  if (!md) md = t?.content ?? ''
  if (md) html.value = convertDOM(md).innerHTML
})
</script>

<template>
  <div class="cvv-page">
    <div v-if="html" class="cvv-wrap">
      <div class="cvv-head">
        <h1>{{ tpl?.name ?? '简历' }}</h1>
        <router-link :to="`/editor/${route.params.type}`" class="cvv-btn">用此模板</router-link>
      </div>
      <div class="cv-paper markdown-transform-html jufe" v-html="html"></div>
    </div>
    <div v-else class="cvv-empty">
      <h2>简历不存在</h2>
      <router-link to="/jianlimoban" class="cvv-btn">去模板中心</router-link>
    </div>
  </div>
</template>

<style lang="scss">
.cvv-page {
  max-width: 900px;
  margin: 0 auto;
  padding: 20px;
}
.cvv-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
  h1 {
    margin: 0;
    font-size: 20px;
    font-weight: 700;
    color: var(--font-color);
  }
}
.cvv-btn {
  display: inline-flex;
  border-radius: 999px;
  background: var(--theme);
  color: #fff;
  font-size: 13px;
  padding: 9px 20px;
  text-decoration: none;
}
.cv-paper {
  background: #fff;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
}
.cvv-empty {
  text-align: center;
  padding: 80px 20px;
  h2 {
    color: var(--font-color);
    margin-bottom: 24px;
  }
}
</style>
