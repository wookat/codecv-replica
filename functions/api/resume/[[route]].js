// /api/resume/list|save|delete —— 登录用户的云端简历存储（resume_type 维度 upsert）
import { json, readBody } from '../../_lib.js'
import { currentUserRow } from '../../_auth.js'

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
    return json(request, { code: 200, message: '保存成功' })
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
