// /api/favorite/* —— 模板收藏：toggle + list（需登录）
import { json, readBody } from '../../_lib.js'
import { currentUserRow } from '../../_auth.js'

export async function onRequest(context) {
  const { request, env } = context
  const url = new URL(request.url)
  const parts = url.pathname.split('/').filter(Boolean)
  const route = parts[parts.length - 1]
  const db = env.DB
  const q =
    request.method === 'POST' ? await readBody(request) : Object.fromEntries(url.searchParams)
  const auth = await currentUserRow(env, request, q)
  if (!auth) return json(request, { code: 401, msg: '请先登录' })

  await db
    .prepare(
      'CREATE TABLE IF NOT EXISTS tpl_favorites (user_id INTEGER, tpl_type TEXT, created_at INTEGER, PRIMARY KEY (user_id, tpl_type))'
    )
    .run()

  if (route === 'toggle' && request.method === 'POST') {
    const type = String(q.type || '')
    if (!type) return json(request, { code: 400, msg: '缺少模板类型' })
    const has = await db
      .prepare('SELECT 1 FROM tpl_favorites WHERE user_id = ? AND tpl_type = ?')
      .bind(auth.row.id, type)
      .first()
    if (has) {
      await db
        .prepare('DELETE FROM tpl_favorites WHERE user_id = ? AND tpl_type = ?')
        .bind(auth.row.id, type)
        .run()
      return json(request, { code: 200, data: { favorited: false }, message: '已取消收藏' })
    }
    await db
      .prepare('INSERT INTO tpl_favorites (user_id, tpl_type, created_at) VALUES (?,?,?)')
      .bind(auth.row.id, type, Date.now())
      .run()
    return json(request, { code: 200, data: { favorited: true }, message: '已收藏' })
  }

  if (route === 'list') {
    const { results } = await db
      .prepare('SELECT tpl_type AS type, created_at FROM tpl_favorites WHERE user_id = ?')
      .bind(auth.row.id)
      .all()
    return json(request, { code: 200, data: results, message: '查询成功' })
  }

  return json(request, { code: 404, msg: 'not found' })
}
