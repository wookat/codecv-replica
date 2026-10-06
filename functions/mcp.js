// MCP (Model Context Protocol) server —— 双传输端点
//   Streamable-HTTP: POST /mcp（JSON-RPC 请求/响应直回）
//   Legacy SSE:      GET  /mcp (Accept: text/event-stream) → 下发 endpoint 事件
//                    POST /mcp/messages?sessionId=…        → 响应经 SSE 流回推
//   Auth: Authorization: Bearer <用户 token>（公开工具不需要；简历读写需要）
// 覆盖客户端：Devin/Cursor/Claude Code/Codex/Windsurf/Zed/任意 streamable-http 或 SSE 客户端
import { json, readBody } from './_lib.js'
import { handleRpc, openSseStream, SERVER_INFO, PROTOCOL_VERSION, TOOLS } from './_mcp.js'

export async function onRequest(context) {
  const { request, env } = context
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': request.headers.get('Origin') || '*',
        'Access-Control-Allow-Headers':
          'Content-Type, Authorization, MCP-Protocol-Version, MCP-Session-Id',
        'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS'
      }
    })
  }
  if (request.method === 'GET') {
    if ((request.headers.get('Accept') || '').includes('text/event-stream')) {
      return openSseStream(request)
    }
    return json(request, {
      name: SERVER_INFO.name,
      version: SERVER_INFO.version,
      protocol: 'mcp-streamable-http + mcp-sse',
      protocolVersion: PROTOCOL_VERSION,
      transports: {
        streamable_http: 'POST /mcp',
        sse: 'GET /mcp (Accept: text/event-stream) + POST /mcp/messages?sessionId=…'
      },
      tools: TOOLS.map(t => ({ name: t.name, description: t.description })),
      auth: 'Authorization: Bearer <user token>（list_templates/get_template 公开）'
    })
  }
  if (request.method !== 'POST') return json(request, { code: 405 }, 405)

  const body = await readBody(request)
  const msgs = Array.isArray(body) ? body : [body]
  const outs = []
  for (const m of msgs) {
    const r = await handleRpc(m, env, request)
    if (r) outs.push(r)
  }
  if (!outs.length) return new Response(null, { status: 202 })
  return json(request, Array.isArray(body) ? outs : outs[0], 200)
}
