import nprogress from 'nprogress'
import 'nprogress/nprogress.css'

nprogress.configure({ easing: 'ease', speed: 300 })

const whiteList = ['/download']

export default defineNuxtRouteMiddleware(to => {
  if (import.meta.server) return
  if (!whiteList.includes(to.path)) nprogress.start()
  return
})

if (import.meta.client) {
  // 路由完成后收尾
  addRouteMiddleware('nprogress-done', () => {
    nprogress.done()
  }, { global: true })
}
