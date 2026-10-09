<script setup lang="ts">
import { mdContentKey } from '@/common/storageKeys'
import { computed, onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import { allOverlaysHTML, convertDOM } from '@/utils/moduleCombine'
import { loadTemplateContent, resolveTemplateType, templates } from '@/templates/config'
import { applyTemplateTheme, importCSS } from '@/utils'
import { getShare, shareView } from '@/api/modules/share'

const route = useRoute()
const html = ref('')
const tpl = computed(() =>
  templates.value.find(t => t.type === resolveTemplateType(route.params.type as string))
)

onMounted(async () => {
  const type = resolveTemplateType(route.params.type as string)
  importCSS(type)
  applyTemplateTheme(type)
  // 公开简历页：/cv/<type>/<id> 先按 id 解析实例内容（分享快照/云端简历/实例键），
  // 再回落本地已存，最后回落模板原文
  const id = route.params.id as string
  let md = ''
  try {
    const res = await getShare(id)
    if (res?.code === 200 && res.data?.content) md = res.data.content
  } catch {
    /* ignore */
  }
  if (!md && id) {
    try {
      const res = await shareView(id)
      if (res?.code === 200 && res.data?.content) md = res.data.content
    } catch {
      /* ignore */
    }
  }
  if (!md) {
    try {
      for (const key of [id ? mdContentKey(id) : '', mdContentKey(type)]) {
        if (!key) continue
        const raw = localStorage.getItem(key)
        md = raw ? JSON.parse(raw).value ?? '' : ''
        if (md) break
      }
    } catch {
      /* ignore */
    }
  }
  if (!md) md = await loadTemplateContent(type)
  if (md) html.value = convertDOM(md).innerHTML + allOverlaysHTML(type)
})
</script>

<template>
  <div class="cvv-page">
    <div v-if="html" class="cvv-wrap">
      <div class="cvv-head">
        <h1>{{ tpl?.name ?? '简历' }}</h1>
        <router-link
          :to="`/editor/${resolveTemplateType(route.params.type as string)}`"
          class="cvv-btn"
          >用此模板</router-link
        >
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
