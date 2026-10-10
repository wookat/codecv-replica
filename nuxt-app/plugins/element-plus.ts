import ElementPlus from 'element-plus'
import zhCn from 'element-plus/es/locale/lang/zh-cn'
import { ID_INJECTION_KEY } from 'element-plus'

export default defineNuxtPlugin(nuxtApp => {
  nuxtApp.vueApp.use(ElementPlus, { locale: zhCn })
  if (import.meta.server) {
    nuxtApp.vueApp.provide(ID_INJECTION_KEY, { prefix: 1024, current: 0 })
  }
})
