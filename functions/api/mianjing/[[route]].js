// /api/mianjing/list|detail|companies|positions|topics|stats|company-facets|topic-facets
// 投稿闭环：submit|mine|del-mine（D1 mianjing_submissions，需登录）
import { json, readBody, loadSeed, sub } from '../../_lib.js'
import { currentUserRow } from '../../_auth.js'

const BATCH_MAP = {
  秋招: 'qiuzhao',
  春招: 'chunzhao',
  暑期实习: 'shuqi',
  日常实习: 'richang',
  社招: 'shezhao'
}

export async function onRequest(context) {
  const { request, env } = context
  if (request.method === 'OPTIONS') return json(request, {})
  const url = new URL(request.url)
  const route = url.pathname.split('/').pop()
  const q =
    request.method === 'POST' ? await readBody(request) : Object.fromEntries(url.searchParams)

  if (route === 'list') {
    const { current, page = 1, pageSize = 20, company, position, grade, batch, round, keyword } = q
    const cur = +(current ?? page ?? 1)
    const filtered = (await loadSeed(env, request, 'mianjing-list.json', [])).filter(m => {
      if (company && m.companySlug !== company && m.companyName !== company) return false
      if (position && m.positionSlug !== position && m.positionName !== position) return false
      if (grade && String(m.grade) !== String(grade)) return false
      if (batch && m.batch !== batch && m.batch !== (BATCH_MAP[batch] ?? batch)) return false
      if (round && m.round !== round) return false
      if (
        keyword &&
        !sub(m.title, keyword) &&
        !sub(m.summary, keyword) &&
        !sub(m.companyName, keyword) &&
        !sub(m.positionName, keyword)
      )
        return false
      return true
    })
    // 审核通过的投稿并入面经大全（形状与种子条目一致）
    if (env.DB) {
      try {
        const { results: subs } = await env.DB.prepare(
          `SELECT s.id, s.title, s.company_name, s.company_slug, s.position_slug, s.grade,
                  s.batch, s.round, s.result, s.content_md, s.created_at, s.anonymous,
                  u.nickname AS authorName
           FROM mianjing_submissions s LEFT JOIN users u ON u.id = s.user_id
           WHERE s.status = 'approved' ORDER BY s.created_at DESC LIMIT 200`
        ).all()
        for (const s of subs) {
          if (
            (company && s.company_slug !== company && s.company_name !== company) ||
            (position && s.position_slug !== position) ||
            (grade && String(s.grade) !== String(grade)) ||
            (batch && s.batch !== batch && s.batch !== (BATCH_MAP[batch] ?? batch)) ||
            (round && s.round !== round) ||
            (keyword && !sub(s.title, keyword) && !sub(s.company_name, keyword))
          )
            continue
          filtered.push({
            _id: `srv-${s.id}`,
            title: s.title,
            companyName: s.company_name,
            companySlug: s.company_slug,
            positionSlug: s.position_slug,
            grade: s.grade,
            batch: s.batch,
            round: s.round,
            result: s.result,
            author: s.anonymous ? '匿名用户' : s.authorName || 'CodeCV用户',
            summary: String(s.content_md || '').slice(0, 80),
            publishTime: s.created_at,
            viewCount: 0,
            likeCount: 0,
            commentCount: 0
          })
        }
      } catch {
        /* D1 不可用时仅出种子 */
      }
    }
    filtered.sort((a, b) => (b.publishTime || 0) - (a.publishTime || 0))
    const start = (cur - 1) * pageSize
    return json(request, {
      code: 200,
      data: filtered.slice(start, start + +pageSize),
      total: filtered.length,
      message: '查询成功'
    })
  }

  if (route === 'detail') {
    const id = q.id || q._id || ''
    // srv-{id}：用户投稿详情（approved 公开，pending 仅本人可见）
    if (String(id).startsWith('srv-') && env.DB) {
      const row = await env.DB.prepare(
        `SELECT s.id AS _id, s.title, s.company_name AS companyName, s.company_slug AS companySlug,
                s.position_slug AS positionSlug, s.grade, s.batch, s.round, s.result,
                s.school, s.major, s.anonymous, s.content_md AS contentMd, s.status,
                s.created_at AS create_time, s.user_id,
                u.nickname AS authorName
         FROM mianjing_submissions s LEFT JOIN users u ON u.id = s.user_id
         WHERE s.id = ?`
      )
        .bind(+String(id).slice(4))
        .first()
      if (!row) return json(request, { code: 404, data: null, message: '面经不存在' })
      if (row.status !== 'approved') {
        const auth = await currentUserRow(env, request, q)
        if (!auth || auth.row.id !== row.user_id)
          return json(request, { code: 404, data: null, message: '面经审核中' })
      }
      if (row.anonymous) row.authorName = '匿名用户'
      delete row.user_id
      return json(request, { code: 200, data: row, message: '查询成功' })
    }
    const details = await loadSeed(env, request, 'mianjing-detail.json', {})
    const hit = details[id]
    return json(
      request,
      hit
        ? { code: 200, data: hit, message: '查询成功' }
        : { code: 404, data: null, message: '面经不存在' }
    )
  }

  const META = ['companies', 'positions', 'topics', 'stats', 'company-facets', 'topic-facets']
  if (META.includes(route)) {
    const meta = await loadSeed(env, request, 'mianjing-meta.json', {})
    return json(request, {
      code: 200,
      data: meta[route] ?? (route === 'stats' ? {} : []),
      message: '获取成功'
    })
  }

  if (['submit', 'mine', 'del-mine'].includes(route)) {
    if (!env.DB) return json(request, { code: 503, msg: 'service unavailable' }, 503)
    const auth = await currentUserRow(env, request, q)
    if (!auth) return json(request, { code: 401, msg: '请先登录后再投稿' })
    const uid = auth.row.id
    const db = env.DB

    if (route === 'submit' && request.method === 'POST') {
      const f = q
      if (!f.companySlug || !f.positionSlug || !f.round)
        return json(request, { code: 400, msg: '公司/岗位/轮次必选' })
      if (String(f.title || '').trim().length < 4)
        return json(request, { code: 400, msg: '标题至少 4 个字' })
      if (String(f.contentMd || '').trim().length < 50)
        return json(request, { code: 400, msg: '正文至少 50 字' })
      const r = await db
        .prepare(
          `INSERT INTO mianjing_submissions
           (user_id, title, company_slug, company_name, position_slug, grade, batch, round, result, school, major, anonymous, content_md, status, created_at)
           VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,'pending',?)`
        )
        .bind(
          uid,
          String(f.title).trim(),
          String(f.companySlug),
          String(f.companyName || ''),
          String(f.positionSlug),
          String(f.grade || ''),
          String(f.batch || ''),
          String(f.round),
          String(f.result || '进行中'),
          String(f.school || ''),
          String(f.major || ''),
          f.anonymous ? 1 : 0,
          String(f.contentMd),
          Date.now()
        )
        .run()
      return json(request, {
        code: 200,
        data: { id: r.meta.last_row_id, status: 'pending' },
        message: '投稿成功，审核通过后将在面经大全中展示'
      })
    }

    if (route === 'mine') {
      const { results } = await db
        .prepare(
          `SELECT id AS _id, title, company_name AS companyName, company_slug AS companySlug,
                  position_slug AS positionSlug, grade, batch, round, result, school, major,
                  anonymous, content_md AS contentMd, status, created_at AS create_time
           FROM mianjing_submissions WHERE user_id = ? ORDER BY created_at DESC LIMIT 100`
        )
        .bind(uid)
        .all()
      return json(request, { code: 200, data: results, message: '查询成功' })
    }

    if (route === 'del-mine' && request.method === 'POST') {
      const r = await db
        .prepare('DELETE FROM mianjing_submissions WHERE id = ? AND user_id = ?')
        .bind(+(q.id || 0), uid)
        .run()
      return r.meta.changes
        ? json(request, { code: 200, message: '已删除' })
        : json(request, { code: 400, msg: '投稿不存在' })
    }
  }

  return json(request, { msg: 'not found' }, 404)
}
