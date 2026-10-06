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
  const sid = url.searchParams.get('sessionId') || ''
  const session = SSE_SESSIONS.get(sid)

  const body = await readBody(request)
  const msgs = Array.isArray(body) ? body : [body]
  const outs = []
  for (const m of msgs) {
    const r = await handleRpc(m, env, request)
    if (!r) continue
    outs.push(r)
    if (session) {
      session.enqueue(r) // 快路径：POST 与 SSE 同 isolate，直接推流
    } else if (r.id != null) {
      // 跨 isolate：以 RPC id 作键尾写 KV 队列，SSE 端窗口探测 get+delete 派发到流上
      await env.UPSTASH_KV.put(`mcpr:${sid}:${r.id}`, JSON.stringify(r), {
        expirationTtl: 120
      })
    }
  }
  // 宽松兜底：响应同时随 POST 直接返回（部分客户端读 body；严格 SSE 客户端请走 streamable-http 或 mcp-remote 桥）
  return json(request, Array.isArray(body) ? outs : outs[0] ?? null)
}
