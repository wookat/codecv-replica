import ElementPlus from 'element-plus'
import zhCn from 'element-plus/es/locale/lang/zh-cn'
import { ID_INJECTION_KEY } from 'element-plus'

export default defineNuxtPlugin(nuxtApp => {
  nuxtApp.vueApp.use(ElementPlus, { locale: zhCn })
  // SSR 与客户端必须同一 prefix，否则 el-* 组件生成 id 漂移 → hydration mismatch
  nuxtApp.vueApp.provide(ID_INJECTION_KEY, { prefix: 1024, current: 0 })
})
