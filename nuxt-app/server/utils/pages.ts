import { defineEventHandler, getRequestURL, readRawBody } from 'h3'
import type { H3Event } from 'h3'

type PagesCtx = {
  request: Request
  env: any
  params: Record<string, any>
  waitUntil: (p: Promise<unknown>) => void
  next: () => Promise<Response>
}

// 把 nitro H3 event 适配成 Pages Functions 的 context 形态，
// 让 functions/ 原文件零改动复用（vite 应用与 nuxt 应用共用同一份 API 代码）。
export function asPages(handler: (ctx: PagesCtx) => Promise<Response> | Response) {
  return defineEventHandler(async (event: H3Event) => {
    let request = event.web?.request
    if (!request) {
      const method = event.method.toUpperCase()
      request = new Request(getRequestURL(event).href, {
        method,
        headers: event.headers as HeadersInit,
        body: method === 'GET' || method === 'HEAD' ? undefined : await readRawBody(event, false),
        // @ts-expect-error workers/undici stream request 需要 duplex
        duplex: 'half'
      })
    }
    const cf = (event.context as any).cloudflare || {}
    const params: Record<string, any> = {}
    for (const [k, v] of Object.entries(event.context.params || {})) {
      // Pages 的 catch-all params 是数组形态；nitro 给的是 '/' join 的字符串
      params[k] = typeof v === 'string' && v.includes('/') ? v.split('/') : v
    }
    return handler({
      request,
      env: cf.env || {},
      params,
      waitUntil: p => cf.context?.waitUntil?.(p),
      next: () => Promise.resolve(new Response('not found', { status: 404 }))
    })
  })
}
