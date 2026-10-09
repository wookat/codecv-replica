// /api/feedback/submit（POST，需登录）、/api/feedback/list（公开）
// 真实反馈落 D1 feedbacks 表；列表按时间倒序
import { json, readBody } from '../../_lib.js'
import { currentUserRow, publicUser } from '../../_auth.js'

export async function onRequest(context) {
  const { request, env } = context
  if (request.method === 'OPTIONS') return json(request, {})
  const url = new URL(request.url)
  const route = url.pathname.split('/').pop()
  const db = env.DB
  if (!db) return json(request, { code: 503, msg: 'service unavailable' }, 503)

  if (route === 'submit' && request.method === 'POST') {
    const q = await readBody(request)
    const auth = await currentUserRow(env, request, q)
    if (!auth) return json(request, { code: 401, msg: '请先登录后再反馈' })
    const content = String(q.content || '').trim()
    if (content.length < 5) return json(request, { code: 400, msg: '反馈内容至少 5 个字' })
    if (content.length > 500) return json(request, { code: 400, msg: '反馈内容最多 500 字' })
    const u = publicUser(auth.row)
    const r = await db
      .prepare(
        'INSERT INTO feedbacks (user_id, username, field, avatar, content, created_at) VALUES (?,?,?,?,?,?)'
      )
      .bind(
        auth.row.id,
        u.username,
        String(q.field || '').trim() || u.nickName || '匿名',
        String(q.avatar || u.avatar || ''),
        content,
        Date.now()
      )
      .run()
    return json(request, {
      code: 200,
      msg: '感谢反馈，我们会认真阅读',
      data: { id: r.meta.last_row_id }
    })
  }

  if (route === 'list') {
    const pageNum = Math.max(1, parseInt(url.searchParams.get('pageNum') || '1', 10))
    const pageSize = Math.min(
      50,
      Math.max(1, parseInt(url.searchParams.get('pageSize') || '20', 10))
    )
    const { results } = await db
      .prepare(
        'SELECT id, field, avatar, content, created_at FROM feedbacks ORDER BY created_at DESC LIMIT ? OFFSET ?'
      )
      .bind(pageSize, (pageNum - 1) * pageSize)
      .all()
    return json(request, { code: 200, data: results || [] })
  }

  return json(request, { msg: 'not found' }, 404)
}
