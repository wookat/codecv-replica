<template>
  <el-config-provider :locale="zhCn">
    <NuxtLayout>
      <NuxtPage :keepalive="{ max: 10, include: ['home', 'editor', 'syntax', 'template', 'update'] }" />
    </NuxtLayout>
  </el-config-provider>
</template>
<script setup lang="ts">
import AOS from 'aos'
import { onMounted } from 'vue'
import zhCn from 'element-plus/es/locale/lang/zh-cn'

// 全站 SEO 基线（与 prod 同款 unhead + jsonld 结构化数据）
useHead({
  title: '个人简历模板免费下载，PDF简历制作，专业中英文简历模板 - CodeCV简历',
  meta: [
    { property: 'og:title', content: 'CodeCV简历 - 免费在线Markdown简历制作工具' },
    {
      property: 'og:description',
      content: '专业中英文简历模板免费下载，Markdown 编写，所见即所得，PDF/Word 高清导出。'
    },
    { property: 'og:type', content: 'website' },
    { property: 'og:url', content: 'https://codecv.zalize.com/' }
  ],
  script: [
    {
      type: 'application/ld+json',
      innerHTML: JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'WebApplication',
        name: 'CodeCV简历',
        url: 'https://codecv.zalize.com/',
        applicationCategory: 'UtilitiesApplication',
        operatingSystem: 'Any',
        description:
          '免费在线Markdown简历制作工具，专业中英文简历模板免费下载，涵盖前后端、产品、运营等岗位。',
        offers: { '@type': 'Offer', price: '0', priceCurrency: 'CNY' }
      })
    }
  ]
})

onMounted(() => AOS.init({ once: true }))
</script>
