import router from './router'
import nprogress from 'nprogress'
import 'nprogress/nprogress.css'

nprogress.configure({ easing: 'ease', speed: 300 })

const whiteList = ['/download']

router.beforeEach((to, from, next) => {
  if (!whiteList.includes(to.path)) {
    nprogress.start()
  }
  next()
})

router.afterEach(() => {
  nprogress.done()
})

export default router
