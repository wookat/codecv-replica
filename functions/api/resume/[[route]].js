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
        `SELECT resume_type AS type, name, md AS content, style, link,
                created_at, updated_at, export_count, is_public, view_num
         FROM resumes WHERE user_id = ? ORDER BY updated_at DESC`
      )
      .bind(uid)
      .all()
    return json(request, { code: 200, data: results, message: '查询成功' })
  }

  if (route === 'save' && request.method === 'POST') {
    const { type, name = '', content = '', style = '', link = '' } = q
    if (!type) return json(request, { code: 400, msg: '缺少简历类型' })
    const existed = await db
      .prepare(
        'SELECT name, md, style, link, created_at, is_public, view_num, export_count FROM resumes WHERE user_id = ? AND resume_type = ? ORDER BY updated_at DESC LIMIT 1'
      )
      .bind(uid, type)
      .first()
    if (!existed) {
      // 新建简历配额：非会员上限 2 份（与生产免费档一致），会员不限
      const isMember = (auth.row.vip_expire || 0) > Date.now()
      if (!isMember) {
        const cnt = await db
          .prepare('SELECT COUNT(*) AS c FROM resumes WHERE user_id = ?')
          .bind(uid)
          .first()
        if ((cnt?.c || 0) >= 2)
          return json(request, { code: 403, msg: '免费版最多创建2份简历，升级会员不限份数' }, 403)
      }
    }
    const now = Date.now()
    // merge 语义：只传 name 等局部字段时保留原内容（对照生产 /cv/update 全字段合并）
    const md = 'content' in q ? content : existed?.md ?? ''
    const stl = 'style' in q ? style : existed?.style ?? ''
    const lnk = 'link' in q ? link : existed?.link ?? ''
    const nm = 'name' in q ? name : existed?.name ?? name
    await db
      .prepare(
        `INSERT INTO resumes (user_id, name, resume_type, md, style, link, created_at, updated_at, export_count, is_public, view_num)
         VALUES (?,?,?,?,?,?,?,?,?,?,?)`
      )
      .bind(
        uid,
        nm,
        type,
        md,
        stl,
        lnk,
        existed?.created_at || now,
        now,
        existed?.export_count || 0,
        existed?.is_public || 0,
        existed?.view_num || 0
      )
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
    await maybeSaveVersion(db, uid, type, md, stl)
    return json(request, { code: 200, message: '保存成功' })
  }

  // 简历副本：对照生产 /api/cv/copy
  if (route === 'copy' && request.method === 'POST') {
    const { type } = q
    const row = await db
      .prepare(
        'SELECT name, md, style, link FROM resumes WHERE user_id = ? AND resume_type = ? ORDER BY updated_at DESC LIMIT 1'
      )
      .bind(uid, type)
      .first()
    if (!row) return json(request, { code: 404, msg: '简历不存在' })
    const isMember = (auth.row.vip_expire || 0) > Date.now()
    if (!isMember) {
      const cnt = await db
        .prepare('SELECT COUNT(*) AS c FROM resumes WHERE user_id = ?')
        .bind(uid)
        .first()
      if ((cnt?.c || 0) >= 2)
        return json(request, { code: 403, msg: '免费版最多创建2份简历，升级会员不限份数' }, 403)
    }
    const newType = `${type}~${Date.now().toString(36)}`
    const now = Date.now()
    await db
      .prepare(
        `INSERT INTO resumes (user_id, name, resume_type, md, style, link, created_at, updated_at)
         VALUES (?,?,?,?,?,?,?,?)`
      )
      .bind(uid, `${row.name || '未命名简历'}-副本`, newType, row.md, row.style, row.link, now, now)
      .run()
    return json(request, { code: 200, data: { type: newType }, message: '已创建副本' })
  }

  // 导出计数：对照生产 /api/export/incCount 的简历维度
  if (route === 'incExport' && request.method === 'POST') {
    await db.batch([
      db
        .prepare(
          'UPDATE resumes SET export_count = export_count + 1 WHERE user_id = ? AND resume_type = ?'
        )
        .bind(uid, q.type),
      db
        .prepare(
          'INSERT INTO export_events (user_id, resume_type, kind, created_at) VALUES (?,?,?,?)'
        )
        .bind(uid, String(q.type || ''), String(q.kind || 'pdf'), Date.now())
    ])
    return json(request, { code: 200, message: 'ok' })
  }

  // 校对事件埋点：错别字抽屉触发时记录
  if (route === 'proofreadEvent' && request.method === 'POST') {
    await db
      .prepare(
        'INSERT INTO proofread_events (user_id, resume_type, created_at, meta) VALUES (?,?,?,?)'
      )
      .bind(uid, String(q.type || ''), Date.now(), String(q.meta || ''))
      .run()
    return json(request, { code: 200, message: 'ok' })
  }

  // 分享开关：对照生产 cv.isPublic + viewNum
  if (route === 'share' && request.method === 'POST') {
    const { type, isPublic } = q
    await db
      .prepare('UPDATE resumes SET is_public = ? WHERE user_id = ? AND resume_type = ?')
      .bind(isPublic ? 1 : 0, uid, type)
      .run()
    return json(request, { code: 200, message: isPublic ? '已公开' : '已取消公开' })
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
