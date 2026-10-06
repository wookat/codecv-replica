// Legacy SSE 传输的消息接收端：POST /mcp/messages?sessionId=<SSE 会话>
// 响应通过对应 SSE 流回推（MCP 2024-10-07 SSE transport 规范）
import { json, readBody } from '../_lib.js'
import { handleRpc, SSE_SESSIONS } from '../_mcp.js'

export async function onRequest(context) {
  const { request, env } = context
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': request.headers.get('Origin') || '*',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Allow-Methods': 'POST, OPTIONS'
      }
    })
  }
  if (request.method !== 'POST') return json(request, { code: 405 }, 405)

  const url = new URL(request.url)
  const session = SSE_SESSIONS.get(url.searchParams.get('sessionId') || '')
  if (!session) {
    // 会话不在本 isolate（CF 调度到别的实例）：客户端应重连 SSE
    return json(request, { code: 404, msg: 'sse session not found' }, 404)
  }

  const body = await readBody(request)
  const msgs = Array.isArray(body) ? body : [body]
  for (const m of msgs) {
    const r = await handleRpc(m, env, request)
    if (r) session.enqueue(r)
  }
  return new Response(null, { status: 202 })
}
