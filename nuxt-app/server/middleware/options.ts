import { defineEventHandler } from 'h3'

// OPTIONS 预检统一出口：与 functions/_lib.js 的 json(req,{}) CORS 口径一致
// （回显 Origin + Allow-Credentials；nitro 层不会把 OPTIONS 下放到路由文件）
export default defineEventHandler(event => {
  if (event.method !== 'OPTIONS') return
  return new Response('{}', {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': event.headers.get('origin') || '*',
      'Access-Control-Allow-Credentials': 'true',
      'Access-Control-Allow-Headers':
        event.headers.get('access-control-request-headers') || '*',
      'Access-Control-Allow-Methods':
        event.headers.get('access-control-request-method') || '*'
    }
  })
})
