// /api/resume/list|save|delete|history/page|history/get —— 登录用户的云端简历存储 + 历史版本
import { json, readBody } from '../../_lib.js'
import { currentUserRow } from '../../_auth.js'

const VERSION_MAX_AGE_MS = 365 * 24 * 3600 * 1000 // 仅保留近一年（与生产一致）

async function maybeSaveVersion(db, uid, type, content, style) {
  // 最近一次版本在 30 分钟内且内容一致则不新增，避免自动保存刷屏
  const last = await db
    .prepare(
      'SELECT content, created_at FROM resume_versions WHERE user_id = ? AND resume_type = ? ORDER BY created_at DESC LIMIT 1'
    )
    .bind(uid, type)
    .first()
  if (last && last.content === content && Date.now() - last.created_at < 30 * 60 * 1000) return
  await db
    .prepare(
      'INSERT INTO resume_versions (user_id, resume_type, content, style, created_at) VALUES (?,?,?,?,?)'
    )
    .bind(uid, type, content, style || '', Date.now())
    .run()
  // 惰性清理一年前的版本
  await db
    .prepare('DELETE FROM resume_versions WHERE user_id = ? AND created_at < ?')
    .bind(uid, Date.now() - VERSION_MAX_AGE_MS)
    .run()
}

export async function onRequest(context) {
  const { request, env } = context
  const url = new URL(request.url)
  if (request.method === 'OPTIONS') return json(request, {})
  const route = url.pathname.split('/').pop()
  const q =
    request.method === 'POST' ? await readBody(request) : Object.fromEntries(url.searchParams)
  if (!env.DB) return json(request, { code: 503, msg: 'service unavailable' }, 503)

  const auth = await currentUserRow(env, request, q)
  if (!auth) return json(request, { code: 401, msg: '请先登录' })
  const uid = auth.row.id
  const db = env.DB

  if (route === 'list') {
    const { results } = await db
      .prepare(
        'SELECT resume_type AS type, name, md AS content, style, link, updated_at FROM resumes WHERE user_id = ? ORDER BY updated_at DESC'
      )
      .bind(uid)
      .all()
    return json(request, { code: 200, data: results, message: '查询成功' })
  }

  if (route === 'save' && request.method === 'POST') {
    const { type, name = '', content = '', style = '', link = '' } = q
    if (!type) return json(request, { code: 400, msg: '缺少简历类型' })
    await db
      .prepare(
        `INSERT INTO resumes (user_id, name, resume_type, md, style, link, updated_at)
         VALUES (?,?,?,?,?,?,?)
         ON CONFLICT(id) DO NOTHING`
      )
      .bind(uid, name, type, content, style, link, Date.now())
      .run()
    // upsert by (user_id, resume_type)：先删后插，保持单行
    await db
      .prepare(
        `DELETE FROM resumes WHERE user_id = ? AND resume_type = ? AND id NOT IN (
           SELECT id FROM resumes WHERE user_id = ? AND resume_type = ? ORDER BY updated_at DESC LIMIT 1
         )`
      )
      .bind(uid, type, uid, type)
      .run()
    await maybeSaveVersion(db, uid, type, content, style)
    return json(request, { code: 200, message: '保存成功' })
  }

  // 版本列表：对照生产 {data:[{_id, id, updateTime}]}
  if (route === 'page') {
    const { results } = await db
      .prepare(
        'SELECT id AS _id, resume_type AS id, created_at AS updateTime FROM resume_versions WHERE user_id = ? AND resume_type = ? ORDER BY created_at DESC LIMIT 100'
      )
      .bind(uid, q.type || q.id || '')
      .all()
    return json(request, { code: 200, data: results })
  }

  if (route === 'get') {
    const row = await db
      .prepare(
        'SELECT content, style, created_at FROM resume_versions WHERE id = ? AND user_id = ?'
      )
      .bind(q.id || q._id || 0, uid)
      .first()
    if (!row) return json(request, { code: 404, msg: '版本不存在' }, 404)
    return json(request, { code: 200, data: row })
  }

  if (route === 'delete' && request.method === 'POST') {
    await db
      .prepare('DELETE FROM resumes WHERE user_id = ? AND resume_type = ?')
      .bind(uid, q.type)
      .run()
    return json(request, { code: 200, message: '删除成功' })
  }

  return json(request, { code: 404, msg: 'not found' }, 404)
}
