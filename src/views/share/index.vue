<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import { convertDOM } from '@/utils/moduleCombine'
import { templates } from '@/templates/config'
import { applyTemplateTheme, importCSS } from '@/utils'
import { getShare } from '@/api/modules/share'

const route = useRoute()
const html = ref('')
const name = ref('')
const type = ref('')

const SHARE_KEY = 'codecv-share'

function render(type_: string, name_: string, md: string) {
  type.value = type_
  name.value = name_
  importCSS(type_)
  applyTemplateTheme(type_)
  html.value = convertDOM(md).innerHTML
}

onMounted(async () => {
  const id = route.params.id as string
  try {
    const res = await getShare(id)
    if (res?.code === 200 && res.data?.content) {
      render(res.data.type, res.data.name, res.data.content)
      return
    }
  } catch {
    /* 服务端失败回落本地 */
  }
  // 本地兜底：同机浏览器生成的分享仍可读
  const reg: Record<string, { type: string; name: string }> = JSON.parse(
    localStorage.getItem(SHARE_KEY) || '{}'
  )
  const s = reg[id]
  if (!s) return
  const raw = localStorage.getItem(`markdown-content-${s.type}`)
  const md = raw ? JSON.parse(raw).value ?? '' : ''
  if (md) render(s.type, s.name, md)
})

const tpl = computed(() => templates.value.find(t => t.type === type.value))
</script>

<template>
  <div class="sh-page">
    <div v-if="html" class="sh-wrap">
      <div class="sh-head">
        <h1>{{ name || tpl?.name || '分享的简历' }}</h1>
        <router-link :to="`/editor/${type}`" class="sh-btn">用同款模板</router-link>
      </div>
      <div class="cv-preview markdown-transform-html jufe" v-html="html"></div>
    </div>
    <div v-else class="sh-empty">
      <h2>分享不存在或已过期</h2>
      <router-link to="/jianlimoban" class="sh-btn">去模板中心</router-link>
    </div>
  </div>
</template>

<style lang="scss">
.sh-page {
  max-width: 900px;
  margin: 0 auto;
  padding: 20px;
}
.sh-head {
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
.sh-btn {
  display: inline-flex;
  border-radius: 999px;
  background: var(--theme);
  color: #fff;
  font-size: 13px;
  padding: 9px 20px;
  text-decoration: none;
}
.cv-preview {
  background: #fff;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
}
.sh-empty {
  text-align: center;
  padding: 80px 20px;
  h2 {
    color: var(--font-color);
    margin-bottom: 24px;
  }
}
</style>
