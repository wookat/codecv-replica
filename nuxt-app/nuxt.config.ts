// https://nuxt.com/docs/api/configuration/nuxt-config
import { fileURLToPath } from 'node:url'

// 软链进来的 src/** 真实路径在仓根下，解析会优先命中仓根 node_modules
// （vue@3.2 / vue-router@4.1 / pinia@2.0 / element-plus@2.3 等旧副本），
// 双副本间 inject key（ssrContextKey/routerKey/pinia…）不一致导致 SSR 崩。
// 把所有可能带实例态/注入键的依赖统一钉到 nuxt-app 自身安装版本。
const nm = (p: string) => fileURLToPath(new URL(`./node_modules/${p}`, import.meta.url))
const sharedAlias = {
  vue: nm('vue'),
  'vue-router': nm('vue-router'),
  pinia: nm('pinia'),
  'element-plus': nm('element-plus'),
  '@element-plus/icons-vue': nm('@element-plus/icons-vue'),
  '@vueuse/core': nm('@vueuse/core'),
  '@floating-ui/dom': nm('@floating-ui/dom'),
  '@tiptap/core': nm('@tiptap/core'),
  '@tiptap/vue-3': nm('@tiptap/vue-3'),
  '@tiptap/pm': nm('@tiptap/pm'),
  '@tiptap/starter-kit': nm('@tiptap/starter-kit'),
  '@tiptap/extension-blockquote': nm('@tiptap/extension-blockquote'),
  '@tiptap/extension-bold': nm('@tiptap/extension-bold'),
  '@tiptap/extension-bullet-list': nm('@tiptap/extension-bullet-list'),
  '@tiptap/extension-character-count': nm('@tiptap/extension-character-count'),
  '@tiptap/extension-code': nm('@tiptap/extension-code'),
  '@tiptap/extension-code-block': nm('@tiptap/extension-code-block'),
  '@tiptap/extension-code-block-lowlight': nm('@tiptap/extension-code-block-lowlight'),
  '@tiptap/extension-color': nm('@tiptap/extension-color'),
  '@tiptap/extension-document': nm('@tiptap/extension-document'),
  '@tiptap/extension-dropcursor': nm('@tiptap/extension-dropcursor'),
  '@tiptap/extension-gapcursor': nm('@tiptap/extension-gapcursor'),
  '@tiptap/extension-hard-break': nm('@tiptap/extension-hard-break'),
  '@tiptap/extension-heading': nm('@tiptap/extension-heading'),
  '@tiptap/extension-highlight': nm('@tiptap/extension-highlight'),
  '@tiptap/extension-bubble-menu': nm('@tiptap/extension-bubble-menu'),
  '@tiptap/extension-floating-menu': nm('@tiptap/extension-floating-menu'),
  '@tiptap/extension-list': nm('@tiptap/extension-list'),
  '@tiptap/extension-list-keymap': nm('@tiptap/extension-list-keymap'),
  '@tiptap/extensions': nm('@tiptap/extensions'),
  '@tiptap/extension-horizontal-rule': nm('@tiptap/extension-horizontal-rule'),
  '@tiptap/extension-image': nm('@tiptap/extension-image'),
  '@tiptap/extension-italic': nm('@tiptap/extension-italic'),
  '@tiptap/extension-link': nm('@tiptap/extension-link'),
  '@tiptap/extension-list-item': nm('@tiptap/extension-list-item'),
  '@tiptap/extension-ordered-list': nm('@tiptap/extension-ordered-list'),
  '@tiptap/extension-paragraph': nm('@tiptap/extension-paragraph'),
  '@tiptap/extension-placeholder': nm('@tiptap/extension-placeholder'),
  '@tiptap/extension-strike': nm('@tiptap/extension-strike'),
  '@tiptap/extension-table': nm('@tiptap/extension-table'),
  '@tiptap/extension-table-cell': nm('@tiptap/extension-table-cell'),
  '@tiptap/extension-table-header': nm('@tiptap/extension-table-header'),
  '@tiptap/extension-table-row': nm('@tiptap/extension-table-row'),
  '@tiptap/extension-text': nm('@tiptap/extension-text'),
  '@tiptap/extension-text-align': nm('@tiptap/extension-text-align'),
  '@tiptap/extension-text-style': nm('@tiptap/extension-text-style'),
  '@tiptap/extension-underline': nm('@tiptap/extension-underline'),
  'vue-codemirror': nm('vue-codemirror'),
  codemirror: nm('codemirror'),
  '@codemirror/view': nm('@codemirror/view'),
  '@codemirror/state': nm('@codemirror/state'),
  '@codemirror/language': nm('@codemirror/language'),
  '@codemirror/lang-css': nm('@codemirror/lang-css'),
  '@codemirror/lang-markdown': nm('@codemirror/lang-markdown'),
  '@codemirror/theme-one-dark': nm('@codemirror/theme-one-dark'),
  echarts: nm('echarts'),
  'vue-echarts': nm('vue-echarts'),
  aos: nm('aos'),
  nprogress: nm('nprogress'),
  'driver.js': nm('driver.js'),
  croppie: nm('croppie'),
  'lucide-vue-next': nm('lucide-vue-next'),
  'vue3-emoji-picker': nm('vue3-emoji-picker'),
  'picture-verification-code': nm('picture-verification-code'),
  fontfaceobserver: nm('fontfaceobserver'),
  lowlight: nm('lowlight'),
  'markdown-it': nm('markdown-it'),
  'markdown-it-task-lists': nm('markdown-it-task-lists'),
  dayjs: nm('dayjs'),
  ofetch: nm('ofetch'),
  typenet: nm('typenet')
}

export default defineNuxtConfig({
  compatibilityDate: '2024-11-01',
  devtools: { enabled: false },
  ssr: true,
  // 复用仓代码经软链 '@/x' → src/x；禁用 nuxt 对 components/utils 的自动扫描避免冲突
  components: { dirs: [] },
  imports: { dirs: [] },
  nitro: {
    preset: 'cloudflare-pages',
    alias: sharedAlias
  },
  modules: ['@pinia/nuxt'],
  build: { transpile: ['element-plus', '@element-plus/icons-vue', 'picture-verification-code', 'aos', 'nprogress'] },
  vite: {
    define: { __VUE_PROD_HYDRATION_MISMATCH_DETAILS__: 'true' },
    resolve: { alias: sharedAlias }
  },
  css: [
    'element-plus/dist/index.css',
    'element-plus/theme-chalk/dark/css-vars.css',
    '@/assets/global.scss',
    '@/assets/highlight.css',
    'aos/dist/aos.css'
  ],
  app: {
    head: {
      htmlAttrs: { lang: 'zh-CN' },
      meta: [
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        {
          name: 'description',
          content:
            '免费在线Markdown简历制作工具，专业中英文简历模板免费下载，涵盖前后端、产品、运营等岗位，所见即所得，支持PDF/Word导出。'
        }
      ],
      link: [
        { rel: 'stylesheet', href: '/fonts/iconfont.css' },
        { rel: 'stylesheet', href: '/fonts/resume-fonts.css' }
      ]
    }
  },
  routeRules: {
    // 登录态/编辑器/后台：纯 CSR（与 prod 一致，localStorage 依赖区）
    '/editor': { ssr: false },
    '/editor/**': { ssr: false },
    '/admin/**': { ssr: false },
    '/login': { ssr: false },
    '/profile': { ssr: false },
    '/notify': { ssr: false },
    '/member': { ssr: false },
    '/order': { ssr: false },
    '/invite': { ssr: false },
    '/user/invite': { ssr: false },
    '/resume/import': { ssr: false },
    '/mp-editor/**': { ssr: false },
    '/mianjing/write': { ssr: false },
    '/mianjing/mine': { ssr: false },
    '/add/**': { ssr: false },
    '/download': { ssr: false },
    '/cv/**': { ssr: false }
  },
  typescript: { strict: false }
})
