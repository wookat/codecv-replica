// /api/notification/{list,unread-count,read} — 站内通知（对齐生产 unread/list/read 契约）
import { json, readBody } from '../../_lib.js'
import { currentUserRow } from '../../_auth.js'

export async function onRequest(context) {
  const { request, env } = context
  if (request.method === 'OPTIONS') return json(request, {})
  if (!env.DB) return json(request, { code: 503, msg: 'service unavailable' }, 503)
  const db = env.DB
  const url = new URL(request.url)
  const route = url.pathname.split('/').pop()
  const q =
    request.method === 'POST' ? await readBody(request) : Object.fromEntries(url.searchParams)

  const auth = await currentUserRow(env, request, q)
  if (!auth) {
    // unread-count 未登录 → 0，其余 401
    if (route === 'unread-count') return json(request, { code: 200, data: { count: 0 } })
    return json(request, { code: 401, msg: '请先登录' })
  }

  if (route === 'unread-count') {
    const r = await db
      .prepare('SELECT COUNT(*) c FROM notifications WHERE user_id=? AND is_read=0')
      .bind(auth.row.id)
      .first()
    return json(request, { code: 200, data: { count: r?.c || 0 } })
  }

  if (route === 'list') {
    const { results } = await db
      .prepare(
        'SELECT id,title,content,type,link,is_read,created_at FROM notifications WHERE user_id=? ORDER BY created_at DESC LIMIT 100'
      )
      .bind(auth.row.id)
      .all()
    return json(request, { code: 200, data: { list: results } })
  }

  if (route === 'read') {
    const { id, all } = q
    if (all) {
      await db.prepare('UPDATE notifications SET is_read=1 WHERE user_id=?').bind(auth.row.id).run()
    } else if (id) {
      await db
        .prepare('UPDATE notifications SET is_read=1 WHERE id=? AND user_id=?')
        .bind(+id, auth.row.id)
        .run()
    }
    return json(request, { code: 200, msg: '已标记' })
  }

  return json(request, { code: 404, msg: 'not found' }, 404)
}
