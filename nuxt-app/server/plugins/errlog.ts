export default defineNitroPlugin((nitro) => {
  nitro.hooks.hook('error', async (error: any, ctx: any) => {
    console.error('[nitro-error]', ctx?.event?.path, error?.stack || error)
  })
})
