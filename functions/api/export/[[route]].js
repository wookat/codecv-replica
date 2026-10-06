// /api/export/queryCount（全站累计导出）+ /api/export/incCount —— 契约对齐 codecvcv.com
// prod queryCount → {code:200,result:"<total>"}；incCount {id,type} 递增全局计数。
// 复用 export_events 表计数：result = 基准数 + 实事件数（基准对齐 prod 展示口径）。
import { json, readBody } from '../../_lib.js'

const BASE = 337284

export async function onRequest(context) {
  const { request, env } = context
  if (request.method === 'OPTIONS') return json(request, {})
  const url = new URL(request.url)
  const route = url.pathname.split('/').pop()
  const db = env.DB

  if (route === 'queryCount') {
    const row = await db.prepare('SELECT COUNT(*) AS n FROM export_events').first()
    return json(request, { code: 200, result: String(BASE + (row?.n || 0)) })
  }
  if (route === 'incCount' && request.method === 'POST') {
    const body = await readBody(request)
    await db
      .prepare(
        'INSERT INTO export_events (user_id, resume_type, kind, created_at) VALUES (?, ?, ?, ?)'
      )
      .bind(+(body.id || 0), String(body.type || ''), 'site', Date.now())
      .run()
    return json(request, { code: 200, message: 'ok' })
  }
  return json(request, { code: 404, msg: 'not found' }, 404)
}
