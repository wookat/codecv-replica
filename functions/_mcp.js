// MCP 共享逻辑：工具定义 + JSON-RPC 派发 + SSE 会话表
// 供 functions/mcp.js（streamable-http + SSE GET）与 functions/mcp/messages.js（SSE POST）复用
import { loadSeed } from './_lib.js'
import { currentUserRow } from './_auth.js'

export const PROTOCOL_VERSION = '2024-11-05'
export const SERVER_INFO = { name: 'codecv-replica', version: '1.0.0', title: 'CodeCV Replica MCP' }

export const TOOLS = [
  {
    name: 'list_templates',
    description: '列出全部 114 套简历模板（编号/名称/字体/标签/热度），供挑选模板',
    inputSchema: { type: 'object', properties: {}, additionalProperties: false }
  },
  {
    name: 'get_template',
    description: '取单套模板的完整定义：markdown 内容 + 主题色/字体/行距/头像配置',
    inputSchema: {
      type: 'object',
      properties: { type: { type: 'string', description: '模板编号，如 100、agent_development' } },
      required: ['type'],
      additionalProperties: false
    }
  },
  {
    name: 'list_resumes',
    description: '列出当前登录用户保存在云端的简历（需 Authorization Bearer token）',
    inputSchema: { type: 'object', properties: {}, additionalProperties: false }
  },
  {
    name: 'get_resume',
    description: '读取用户某类型简历的 markdown 内容与样式；未保存过时返回模板默认内容',
    inputSchema: {
      type: 'object',
      properties: { type: { type: 'string' } },
      required: ['type'],
      additionalProperties: false
    }
  },
  {
    name: 'save_resume',
    description:
      '保存（upsert）用户某类型简历的 markdown 内容并自动留历史版本。前端编辑器以 markdown 表达简历内容（::: start/end 分栏、icon:xx 标记、!c[] 色标、![个人头像]() 占位）',
    inputSchema: {
      type: 'object',
      properties: {
        type: { type: 'string' },
        content: { type: 'string', description: '完整 markdown 简历内容' },
        name: { type: 'string', description: '简历显示名（可选）' }
      },
      required: ['type', 'content'],
      additionalProperties: false
    }
  },
  {
    name: 'delete_resume',
    description: '删除用户某类型的云端简历（不删历史版本）',
    inputSchema: {
      type: 'object',
      properties: { type: { type: 'string' } },
      required: ['type'],
      additionalProperties: false
    }
  },
  {
    name: 'create_share',
    description: '为用户某类型简历生成公开分享链接（https://codecv.zalize.com/#/share/<id>）',
    inputSchema: {
      type: 'object',
      properties: { type: { type: 'string' } },
      required: ['type'],
      additionalProperties: false
    }
  },
  {
    name: 'export_urls',
    description: '返回该简历的在线预览/导出入口 URL（PDF 导出走站内 /export 页面）',
    inputSchema: {
      type: 'object',
      properties: { type: { type: 'string' } },
      required: ['type'],
      additionalProperties: false
    }
  }
]

const PUBLIC_TOOLS = new Set(['list_templates', 'get_template'])

// SSE 会话表（module 作用域；CF Pages Functions 同一 isolate 内共享）
// sessionId -> { enqueue(payloadObj), close() }
export const SSE_SESSIONS = new Map()

async function maybeSaveVersion(db, uid, type, content, style) {
  const VERSION_MAX_AGE_MS = 30 * 60 * 1000
  const last = await db
    .prepare(
      'SELECT content, created_at FROM resume_versions WHERE user_id = ? AND resume_type = ? ORDER BY created_at DESC LIMIT 1'
    )
    .bind(uid, type)
    .first()
  if (last && last.content === content && Date.now() - last.created_at < VERSION_MAX_AGE_MS) return
  await db
    .prepare(
      'INSERT INTO resume_versions (user_id, resume_type, content, style, created_at) VALUES (?,?,?,?,?)'
    )
    .bind(uid, type, content, style || '', Date.now())
    .run()
  const cutoff = Date.now() - 365 * 24 * 3600 * 1000
  await db
    .prepare('DELETE FROM resume_versions WHERE user_id = ? AND created_at < ?')
    .bind(uid, cutoff)
    .run()
}

async function authedUid(env, request) {
  const auth = await currentUserRow(env, request, {})
  return auth?.row?.id ?? null
}

function rpcResult(id, result) {
  return { jsonrpc: '2.0', id: id ?? null, result }
}
function rpcError(id, code, message) {
  return { jsonrpc: '2.0', id: id ?? null, error: { code, message } }
}
function text(s) {
  return [{ type: 'text', text: typeof s === 'string' ? s : JSON.stringify(s, null, 2) }]
}

async function callTool(name, args, env, request) {
  const needsAuth = !PUBLIC_TOOLS.has(name)
  const uid = needsAuth ? await authedUid(env, request) : null
  if (needsAuth && uid === null) {
    return { content: text('未登录：请提供 Authorization: Bearer <token>'), isError: true }
  }

  if (name === 'list_templates') {
    const idx = await loadSeed(env, request, 'tpl-index.json', [])
    return { content: text(JSON.stringify(idx)) }
  }
  if (name === 'get_template') {
    const tpl = await loadSeed(env, request, `tpl/${args.type}.json`, null)
    if (!tpl) return { content: text(`模板 ${args.type} 不存在`), isError: true }
    return { content: text(JSON.stringify(tpl)) }
  }
  const db = env.DB
  if (name === 'list_resumes') {
    const { results } = await db
      .prepare(
        'SELECT resume_type AS type, name, updated_at FROM resumes WHERE user_id = ? ORDER BY updated_at DESC'
      )
      .bind(uid)
      .all()
    return { content: text(JSON.stringify(results)) }
  }
  if (name === 'get_resume') {
    const row = await db
      .prepare(
        'SELECT resume_type AS type, name, md AS content, style, updated_at FROM resumes WHERE user_id = ? AND resume_type = ?'
      )
      .bind(uid, args.type)
      .first()
    if (row) return { content: text(JSON.stringify(row)) }
    const tpl = await loadSeed(env, request, `tpl/${args.type}.json`, null)
    if (tpl)
      return {
        content: text(JSON.stringify({ type: args.type, content: tpl.content, source: 'template' }))
      }
    return { content: text(`简历 ${args.type} 不存在`), isError: true }
  }
  if (name === 'save_resume') {
    const { type, content, name: rname = '' } = args
    await db
      .prepare(
        `INSERT INTO resumes (user_id, name, resume_type, md, style, link, updated_at)
         VALUES (?,?,?,?,?,?,?) ON CONFLICT(id) DO NOTHING`
      )
      .bind(uid, rname, type, content, '', '', Date.now())
      .run()
    await db
      .prepare(
        `DELETE FROM resumes WHERE user_id = ? AND resume_type = ? AND id NOT IN (
           SELECT id FROM resumes WHERE user_id = ? AND resume_type = ? ORDER BY updated_at DESC LIMIT 1
         )`
      )
      .bind(uid, type, uid, type)
      .run()
    await maybeSaveVersion(db, uid, type, content, '')
    return { content: text(`已保存简历 ${type}`) }
  }
  if (name === 'delete_resume') {
    await db
      .prepare('DELETE FROM resumes WHERE user_id = ? AND resume_type = ?')
      .bind(uid, args.type)
      .run()
    return { content: text(`已删除简历 ${args.type}`) }
  }
  if (name === 'create_share') {
    const row = await db
      .prepare(
        'SELECT name, md AS content, style FROM resumes WHERE user_id = ? AND resume_type = ?'
      )
      .bind(uid, args.type)
      .first()
    let name = row?.name || '',
      content = row?.content || '',
      style = row?.style || ''
    if (!content) {
      const tpl = await loadSeed(env, request, `tpl/${args.type}.json`, null)
      if (!tpl) return { content: text(`简历 ${args.type} 不存在`), isError: true }
      content = tpl.content
      name = name || tpl.name
    }
    const abc = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
    const id = [...crypto.getRandomValues(new Uint8Array(10))]
      .map(x => abc[x % abc.length])
      .join('')
    await db
      .prepare(
        'INSERT INTO shares (id, user_id, type, name, content, style, created_at) VALUES (?,?,?,?,?,?,?)'
      )
      .bind(id, uid, String(args.type), name, content, style, Date.now())
      .run()
    return { content: text(`https://codecv.zalize.com/#/share/${id}`) }
  }
  if (name === 'export_urls') {
    return {
      content: text(
        JSON.stringify({
          editor: `https://codecv.zalize.com/#/editor?type=${args.type}`,
          export_page: `https://codecv.zalize.com/#/export/${args.type}`,
          api_export: 'POST https://codecv.zalize.com/export {content,style,link,name,type}'
        })
      )
    }
  }
  return { content: text(`未知工具 ${name}`), isError: true }
}

export async function handleRpc(msg, env, request) {
  const { id, method, params } = msg
  if (method === 'initialize') {
    return rpcResult(id, {
      protocolVersion: params?.protocolVersion || PROTOCOL_VERSION,
      capabilities: { tools: { listChanged: false } },
      serverInfo: SERVER_INFO
    })
  }
  if (method === 'ping') return rpcResult(id, {})
  if (method === 'tools/list') return rpcResult(id, { tools: TOOLS })
  if (method === 'tools/call') {
    try {
      const out = await callTool(params?.name, params?.arguments || {}, env, request)
      return rpcResult(id, out)
    } catch (e) {
      return rpcError(id, -32603, `tool error: ${e.message}`)
    }
  }
  if (method?.startsWith('notifications/')) return null
  return rpcError(id, -32601, `method not found: ${method}`)
}

// 打开一条 legacy SSE 通道：发 endpoint 事件 → 之后 POST /mcp/messages 的响应经本流回推
export function openSseStream(request) {
  const sessionId = crypto.randomUUID()
  const enc = new TextEncoder()
  let enqueue
  let close
  let interval
  const stream = new ReadableStream({
    start(controller) {
      enqueue = payload => {
        try {
          controller.enqueue(enc.encode(`event: message\ndata: ${JSON.stringify(payload)}\n\n`))
        } catch {
          /* 流已关 */
        }
      }
      const endpoint = `/mcp/messages?sessionId=${sessionId}`
      controller.enqueue(enc.encode(`event: endpoint\ndata: ${endpoint}\n\n`))
      interval = setInterval(() => {
        try {
          controller.enqueue(enc.encode(':ka\n\n'))
        } catch {
          /* noop */
        }
      }, 20000)
      close = () => {
        clearInterval(interval)
        SSE_SESSIONS.delete(sessionId)
        try {
          controller.close()
        } catch {
          /* noop */
        }
      }
      SSE_SESSIONS.set(sessionId, { enqueue, close })
    },
    cancel() {
      clearInterval(interval)
      SSE_SESSIONS.delete(sessionId)
    }
  })
  const origin = request.headers.get('Origin')
  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
      ...(origin ? { 'Access-Control-Allow-Origin': origin } : {})
    }
  })
}
