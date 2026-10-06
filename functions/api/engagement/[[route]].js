// /api/engagement/reaction|comments|comment|comment-delete — 对齐生产互动契约
// reaction: {targetType, targetId, kind: like|fav} 切换 → {active}
// comments: {targetType, targetId} 列表（含 parent 回复）
// comment: 发评论（parent_id 可空）comment-delete: 仅本人可删
import { json, readBody } from '../../_lib.js'
import { currentUserRow } from '../../_auth.js'

const counts = async (db, targetType, targetId) => {
  const like = await db
    .prepare('SELECT COUNT(*) c FROM reactions WHERE target_type=? AND target_id=? AND kind=?')
    .bind(targetType, String(targetId), 'like')
    .first()
  const fav = await db
    .prepare('SELECT COUNT(*) c FROM reactions WHERE target_type=? AND target_id=? AND kind=?')
    .bind(targetType, String(targetId), 'fav')
    .first()
  const cmt = await db
    .prepare('SELECT COUNT(*) c FROM comments WHERE doc_id=?')
    .bind(`${targetType}:${targetId}`)
    .first()
  return { likeCount: like?.c || 0, favCount: fav?.c || 0, commentCount: cmt?.c || 0 }
}

export async function onRequest(context) {
  const { request, env } = context
  if (request.method === 'OPTIONS') return json(request, {})
  if (!env.DB) return json(request, { code: 503, msg: 'service unavailable' }, 503)
  const db = env.DB
  const url = new URL(request.url)
  const route = url.pathname.split('/').pop()
  const q =
    request.method === 'POST' ? await readBody(request) : Object.fromEntries(url.searchParams)

  // GET 状态：公开可读（active 需登录判定）
  if (route === 'state') {
    const { targetType = 'mianjing', targetId } = q
    const c = await counts(db, targetType, targetId)
    const auth = await currentUserRow(env, request, q)
    let liked = false,
      faved = false
    if (auth) {
      const r = await db
        .prepare('SELECT kind FROM reactions WHERE user_id=? AND target_type=? AND target_id=?')
        .bind(auth.row.id, targetType, String(targetId))
        .all()
      liked = (r.results || []).some(x => x.kind === 'like')
      faved = (r.results || []).some(x => x.kind === 'fav')
    }
    return json(request, { code: 200, data: { ...c, liked, faved } })
  }

  if (route === 'comments') {
    const { targetType = 'mianjing', targetId } = q
    const { results } = await db
      .prepare(
        `SELECT c.id, c.nickname, c.content, c.created_at, c.parent_id, c.user_id,
                p.nickname AS parent_nickname, p.content AS parent_content
         FROM comments c LEFT JOIN comments p ON c.parent_id = p.id
         WHERE c.doc_id = ? ORDER BY c.created_at DESC LIMIT 200`
      )
      .bind(`${targetType}:${targetId}`)
      .all()
    return json(request, { code: 200, data: { list: results, total: results.length } })
  }

  const auth = await currentUserRow(env, request, q)
  if (!auth) return json(request, { code: 401, msg: '请先登录' })

  // GET /api/engagement/favs — 我的收藏列表（面经）
  if (route === 'favs') {
    const { results } = await db
      .prepare(
        `SELECT r.target_id AS id, r.created_at AS fav_time,
                s.title, s.company_name, s.round, s.batch, s.grade, s.result
         FROM reactions r LEFT JOIN mianjing_submissions s
           ON s.id = CAST(r.target_id AS INTEGER)
         WHERE r.user_id = ? AND r.kind = 'fav' AND r.target_type = 'mianjing'
         ORDER BY r.created_at DESC LIMIT 200`
      )
      .bind(auth.row.id)
      .all()
    return json(request, { code: 200, data: { list: results, total: results.length } })
  }

  if (route === 'reaction') {
    const { targetType = 'mianjing', targetId, kind } = q
    if (!['like', 'fav'].includes(kind)) return json(request, { code: 400, msg: '未知互动类型' })
    const exist = await db
      .prepare(
        'SELECT id FROM reactions WHERE user_id=? AND target_type=? AND target_id=? AND kind=?'
      )
      .bind(auth.row.id, targetType, String(targetId), kind)
      .first()
    let active
    if (exist) {
      await db.prepare('DELETE FROM reactions WHERE id=?').bind(exist.id).run()
      active = false
    } else {
      await db
        .prepare(
          'INSERT INTO reactions(user_id,target_type,target_id,kind,created_at) VALUES (?,?,?,?,?)'
        )
        .bind(auth.row.id, targetType, String(targetId), kind, Date.now())
        .run()
      active = true
    }
    const c = await counts(db, targetType, targetId)
    return json(request, { code: 200, data: { active, ...c } })
  }

  if (route === 'comment') {
    const { targetType = 'mianjing', targetId, content, parent_id = 0 } = q
    if (!String(content || '').trim()) return json(request, { code: 400, msg: '评论内容为空' })
    if (String(content).length > 500) return json(request, { code: 400, msg: '评论最多 500 字' })
    if (+parent_id) {
      const p = await db.prepare('SELECT id FROM comments WHERE id=?').bind(+parent_id).first()
      if (!p) return json(request, { code: 404, msg: '回复的评论不存在' })
    }
    const nickname = auth.row.nickname || auth.row.username
    const r = await db
      .prepare(
        'INSERT INTO comments (doc_id, user_id, nickname, content, created_at, parent_id) VALUES (?,?,?,?,?,?)'
      )
      .bind(
        `${targetType}:${targetId}`,
        auth.row.id,
        nickname,
        String(content).trim(),
        Date.now(),
        +parent_id || 0
      )
      .run()
    return json(request, {
      code: 200,
      data: { id: r.meta.last_row_id, nickname },
      msg: '评论成功'
    })
  }

  if (route === 'comment-delete') {
    const { id } = q
    const row = await db.prepare('SELECT user_id FROM comments WHERE id=?').bind(+id).first()
    if (!row) return json(request, { code: 404, msg: '评论不存在' })
    if (row.user_id !== auth.row.id) return json(request, { code: 403, msg: '只能删除自己的评论' })
    await db.prepare('DELETE FROM comments WHERE id=? OR parent_id=?').bind(+id, +id).run()
    return json(request, { code: 200, msg: '评论已删除' })
  }

  return json(request, { code: 404, msg: 'not found' }, 404)
}
