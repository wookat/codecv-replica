import nprogress from 'nprogress'

export default defineNuxtPlugin(nuxtApp => {
  nuxtApp.$router.afterEach(() => nprogress.done())
})
