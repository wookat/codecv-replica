<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { convertDOM } from '@/utils/moduleCombine'
import { applyTemplateTheme, importCSS } from '@/utils'
import { getCurrentTypeContent } from '@/store/modules/editor'
import { resolveTemplateType } from '@/templates/config'

const route = useRoute()
const router = useRouter()
const html = ref('')
const type = ref('')

onMounted(() => {
  const id = resolveTemplateType(route.params.id as string)
  type.value = id
  importCSS(id)
  applyTemplateTheme(id)
  let md = ''
  try {
    const raw = localStorage.getItem(`markdown-content-${id}`)
    md = raw ? JSON.parse(raw).value ?? '' : ''
  } catch {
    /* ignore */
  }
  // 未编辑过的模板：回落到模板内置内容，保证打印/导出永远有简历
  if (!md) md = getCurrentTypeContent(id)
  if (md) html.value = convertDOM(md).innerHTML
})

function printPdf() {
  window.print()
}
</script>

<template>
  <div class="ex-page">
    <div v-if="html" class="ex-wrap">
      <div class="ex-bar">
        <h1>导出简历</h1>
        <div class="acts">
          <button class="ex-btn" @click="printPdf">打印 / 存为 PDF</button>
          <button class="ex-btn ghost" @click="router.push(`/editor/${type}`)">返回编辑</button>
        </div>
      </div>
      <div class="ex-paper markdown-transform-html jufe" v-html="html"></div>
    </div>
    <div v-else class="ex-empty">
      <h2>简历不存在</h2>
      <router-link to="/jianlimoban" class="ex-btn">去模板中心</router-link>
    </div>
  </div>
</template>

<style lang="scss">
.ex-page {
  max-width: 900px;
  margin: 0 auto;
  padding: 20px;
}
.ex-bar {
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
  .acts {
    display: flex;
    gap: 10px;
  }
}
.ex-btn {
  display: inline-flex;
  border: none;
  border-radius: 999px;
  background: var(--theme);
  color: #fff;
  font-size: 13px;
  padding: 9px 20px;
  cursor: pointer;
  text-decoration: none;
  &.ghost {
    background: transparent;
    color: var(--theme);
    border: 1px solid var(--theme);
  }
}
.ex-paper {
  background: #fff;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
}
.ex-empty {
  text-align: center;
  padding: 80px 20px;
  h2 {
    color: var(--font-color);
    margin-bottom: 24px;
  }
}
@media print {
  .ex-bar {
    display: none;
  }
}
</style>
