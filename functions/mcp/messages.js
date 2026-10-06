// Legacy SSE 传输的消息接收端：POST /mcp/messages?sessionId=<SSE 会话>
// 响应通过对应 SSE 流回推（MCP 2024-10-07 SSE transport 规范）
import { json, readBody } from '../_lib.js'
import { handleRpc } from '../_mcp.js'

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
  // 以 sid 为 DO 名路由 —— 与持有该会话 SSE 流的 McpSession 必为同一对象，毫秒级入队
  const stub = env.MCP_SESSION ? env.MCP_SESSION.get(env.MCP_SESSION.idFromName(sid)) : null

  const body = await readBody(request)
  const msgs = Array.isArray(body) ? body : [body]
  const outs = []
  for (const m of msgs) {
    const r = await handleRpc(m, env, request)
    if (!r) continue
    outs.push(r)
    if (stub) {
      await stub.fetch('https://mcp-session/push', { method: 'POST', body: JSON.stringify(r) })
    }
  }
  // 宽松兜底：响应同时随 POST 直接返回（部分客户端读 body；严格 SSE 客户端请走 streamable-http 或 mcp-remote 桥）
  return json(request, Array.isArray(body) ? outs : outs[0] ?? null)
}
