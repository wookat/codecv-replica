// /api/comment/list|create —— 面经详情评论（list 公开，create 需登录）
import { json, readBody } from '../../_lib.js'
import { currentUserRow } from '../../_auth.js'

export async function onRequest(context) {
  const { request, env } = context
  const url = new URL(request.url)
  if (request.method === 'OPTIONS') return json(request, {})
  const route = url.pathname.split('/').pop()
  if (!env.DB) return json(request, { code: 503, msg: 'service unavailable' }, 503)
  const db = env.DB

  if (route === 'list') {
    const doc = url.searchParams.get('doc')
    if (!doc) return json(request, { code: 400, msg: '缺少文档 id' })
    const { results } = await db
      .prepare(
        'SELECT id, nickname, content, created_at FROM comments WHERE doc_id = ? ORDER BY created_at DESC LIMIT 100'
      )
      .bind(String(doc))
      .all()
    return json(request, { code: 200, data: results, message: '查询成功' })
  }

  if (route === 'create' && request.method === 'POST') {
    const q = await readBody(request)
    const auth = await currentUserRow(env, request, q)
    if (!auth) return json(request, { code: 401, msg: '请先登录' })
    const { doc, content } = q
    if (!doc || !String(content || '').trim())
      return json(request, { code: 400, msg: '评论内容为空' })
    if (String(content).length > 500) return json(request, { code: 400, msg: '评论最多 500 字' })
    const nickname = auth.row.nickname || auth.row.username
    const r = await db
      .prepare('INSERT INTO comments (doc_id, user_id, nickname, content, created_at) VALUES (?,?,?,?,?)')
      .bind(String(doc), auth.row.id, nickname, String(content).trim(), Date.now())
      .run()
    return json(request, {
      code: 200,
      data: { id: r.meta.last_row_id, nickname },
      message: '评论成功'
    })
  }

  return json(request, { code: 404, msg: 'not found' }, 404)
}
