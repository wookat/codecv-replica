// /api/admin/* — 后台管理端点集合（对齐 prod 逆向清单）
// 鉴权：Bearer token -> users.is_admin=1。GET 读 query，POST 读 body。
import { json, readBody, loadSeed, notify } from '../../_lib.js'
import { currentUserRow } from '../../_auth.js'

const pageOf = q => ({
  cur: Math.max(1, +(q.page ?? q.current ?? 1)),
  size: Math.min(200, Math.max(1, +(q.pageSize ?? 20)))
})

const paged = (rows, { cur, size }) => ({
  code: 200,
  data: {
    list: rows.slice((cur - 1) * size, cur * size),
    total: rows.length,
    page: cur,
    pageSize: size
  },
  message: '查询成功'
})

async function syncPosts(env, request) {
  // 种子攻略首次同步进 posts 表（INSERT OR IGNORE）
  const seed = await loadSeed(env, request, 'posts.json', [])
  const details = await loadSeed(env, request, 'post-detail.json', {})
  const stmts = seed.map(p =>
    env.DB.prepare(
      `INSERT OR IGNORE INTO posts (_id,title,cover,category,tags,summary,content_md,author,status,view_count,publish_time,created_at,updated_at)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)`
    ).bind(
      String(p._id),
      p.title || '',
      p.cover || '',
      p.category || '',
      Array.isArray(p.tags) ? p.tags.join(',') : p.tags || '',
      p.summary || '',
      details[p._id]?.contentMd || details[p._id]?.content || '',
      p.author || 'CodeCV',
      'published',
      p.viewCount || 0,
      p.publishTime || 0,
      Date.now(),
      Date.now()
    )
  )
  for (let i = 0; i < stmts.length; i += 50) await env.DB.batch(stmts.slice(i, i + 50))
}

export async function onRequest(context) {
  const { request, env } = context
  if (request.method === 'OPTIONS') return json(request, {})
  if (!env.DB) return json(request, { code: 503, msg: 'service unavailable' }, 503)
  const url = new URL(request.url)
  // 路径形如 /api/admin/{a} 或 /api/admin/{a}/{b}
  const parts = url.pathname.split('/').slice(3)
  const route = parts.join('/')
  const q =
    request.method === 'POST' ? await readBody(request) : Object.fromEntries(url.searchParams)

  const auth = await currentUserRow(env, request, q)
  if (!auth) return json(request, { code: 401, msg: '请先登录' })

  if (route === 'identity')
    return json(request, { code: 200, data: { isAdmin: !!auth.row.is_admin } })
  if (!auth.row.is_admin) return json(request, { code: 403, msg: '无管理员权限' })

  const db = env.DB
  const { cur, size } = pageOf(q)
  const now = Date.now()

  // ---------- 工作台统计 ----------
  if (route === 'statistics') {
    const c = sql => db.prepare(sql).first()
    const [u, r, o, m, cm, p] = await Promise.all([
      c('SELECT COUNT(*) n FROM users'),
      c('SELECT COUNT(*) n FROM resumes'),
      c('SELECT COUNT(*) n, COALESCE(SUM(amount),0) amt FROM orders'),
      c('SELECT COUNT(*) n FROM mianjing_submissions'),
      c('SELECT COUNT(*) n FROM comments'),
      c('SELECT COUNT(*) n FROM posts WHERE deleted=0')
    ])
    const d7 = now - 7 * 86400e3
    const [nu, ne, np] = await Promise.all([
      c(`SELECT COUNT(*) n FROM users WHERE created_at > ${d7}`),
      c(`SELECT COUNT(*) n FROM export_events WHERE created_at > ${d7}`),
      c(`SELECT COUNT(*) n FROM proofread_events WHERE created_at > ${d7}`)
    ])
    return json(request, {
      code: 200,
      data: {
        users: u.n,
        resumes: r.n,
        orders: o.n,
        orderAmount: o.amt,
        mianjing: m.n,
        comments: cm.n,
        posts: p.n,
        newUsers7d: nu.n,
        exports7d: ne.n,
        proofreads7d: np.n
      }
    })
  }

  // ---------- 用户管理 ----------
  if (route === 'user/page') {
    const kw = q.keyword || ''
    const { results } = await db
      .prepare(
        `SELECT id AS uid, username, nickname, sex, professional, graduation, school, avatar,
                vip_expire AS vipExpire, is_admin AS isAdmin, banned, ban_reason AS banReason,
                created_at AS createdAt
         FROM users ${kw ? 'WHERE username LIKE ? OR nickname LIKE ?' : ''}
         ORDER BY created_at DESC LIMIT 500`
      )
      .bind(...(kw ? [`%${kw}%`, `%${kw}%`] : []))
      .all()
    return json(request, paged(results, { cur, size }))
  }
  if (route === 'user/get') {
    const row = await db
      .prepare(
        `SELECT id AS uid, username, nickname, sex, professional, graduation, school, avatar, origin,
                vip_expire AS vipExpire, is_admin AS isAdmin, banned, ban_reason AS banReason,
                created_at AS createdAt
         FROM users WHERE id = ?`
      )
      .bind(+q.id)
      .first()
    return row
      ? json(request, { code: 200, data: row })
      : json(request, { code: 404, msg: '用户不存在' })
  }
  if (route === 'user/edit' && request.method === 'POST') {
    const f = {}
    for (const k of ['nickname', 'sex', 'professional', 'graduation', 'school', 'avatar', 'origin'])
      if (q[k] !== undefined) f[k] = String(q[k])
    if (q.vipExpire !== undefined) f.vip_expire = +q.vipExpire || 0
    if (q.isAdmin !== undefined) f.is_admin = q.isAdmin ? 1 : 0
    const sets = Object.keys(f)
      .map(k => `${k} = ?`)
      .join(',')
    if (!sets) return json(request, { code: 400, msg: '无可更新字段' })
    const r = await db
      .prepare(`UPDATE users SET ${sets} WHERE id = ?`)
      .bind(...Object.values(f), +q.id)
      .run()
    return r.meta.changes
      ? json(request, { code: 200, message: '已保存' })
      : json(request, { code: 404, msg: '用户不存在' })
  }
  if (route === 'user/ban' && request.method === 'POST') {
    await db
      .prepare('UPDATE users SET banned = 1, ban_reason = ? WHERE id = ?')
      .bind(String(q.reason || ''), +q.id)
      .run()
    return json(request, { code: 200, message: '已封禁' })
  }
  if (route === 'user/unban' && request.method === 'POST') {
    await db.prepare("UPDATE users SET banned = 0, ban_reason = '' WHERE id = ?").bind(+q.id).run()
    return json(request, { code: 200, message: '已解禁' })
  }
  if (route === 'user/delete' && request.method === 'POST') {
    const r = await db.prepare('DELETE FROM users WHERE id = ?').bind(+q.id).run()
    return r.meta.changes
      ? json(request, { code: 200, message: '已删除' })
      : json(request, { code: 404, msg: '用户不存在' })
  }

  // ---------- 简历管理 ----------
  if (route === 'resume/page') {
    const kw = q.keyword || ''
    const { results } = await db
      .prepare(
        `SELECT r.id, r.name, r.resume_type AS resumeType, r.user_id AS userId,
                u.username, u.nickname, r.created_at AS createdAt, r.updated_at AS updatedAt,
                r.export_count AS exportCount, r.is_public AS isPublic, r.view_num AS viewNum,
                r.review_status AS reviewStatus
         FROM resumes r LEFT JOIN users u ON u.id = r.user_id
         ${kw ? 'WHERE r.name LIKE ? OR u.username LIKE ?' : ''}
         ORDER BY r.updated_at DESC LIMIT 500`
      )
      .bind(...(kw ? [`%${kw}%`, `%${kw}%`] : []))
      .all()
    return json(request, paged(results, { cur, size }))
  }
  if (route === 'resume/get') {
    const row = await db.prepare('SELECT * FROM resumes WHERE id = ?').bind(+q.id).first()
    return row
      ? json(request, { code: 200, data: row })
      : json(request, { code: 404, msg: '简历不存在' })
  }
  if (route === 'resume/style') {
    const row = await db.prepare('SELECT style FROM resumes WHERE id = ?').bind(+q.id).first()
    return row
      ? json(request, { code: 200, data: { style: row.style } })
      : json(request, { code: 404, msg: '简历不存在' })
  }
  if (route === 'resume/add' && request.method === 'POST') {
    const r = await db
      .prepare(
        `INSERT INTO resumes (user_id, name, resume_type, md, style, link, created_at, updated_at)
         VALUES (?,?,?,?,?,?,?,?)`
      )
      .bind(
        +q.userId,
        String(q.name || '未命名简历'),
        String(q.resume_type || ''),
        String(q.md || ''),
        String(q.style || ''),
        String(q.link || ''),
        now,
        now
      )
      .run()
    return json(request, { code: 200, data: { id: r.meta.last_row_id }, message: '已创建' })
  }
  if (route === 'resume/edit' && request.method === 'POST') {
    const f = {}
    for (const k of ['name', 'md', 'style', 'link', 'is_public', 'review_status'])
      if (q[k] !== undefined) f[k] = q[k]
    f.updated_at = now
    const sets = Object.keys(f)
      .map(k => `${k} = ?`)
      .join(',')
    const r = await db
      .prepare(`UPDATE resumes SET ${sets} WHERE id = ?`)
      .bind(...Object.values(f), +q.id)
      .run()
    return r.meta.changes
      ? json(request, { code: 200, message: '已保存' })
      : json(request, { code: 404, msg: '简历不存在' })
  }
  if (route === 'resume/review' && request.method === 'POST') {
    await db
      .prepare('UPDATE resumes SET review_status = ? WHERE id = ?')
      .bind(String(q.status || 'approved'), +q.id)
      .run()
    return json(request, { code: 200, message: '已更新审核状态' })
  }
  if (route === 'resume/delete' && request.method === 'POST') {
    const r = await db.prepare('DELETE FROM resumes WHERE id = ?').bind(+q.id).run()
    return r.meta.changes
      ? json(request, { code: 200, message: '已删除' })
      : json(request, { code: 404, msg: '简历不存在' })
  }

  // ---------- 模板管理（标记隐藏，前台过滤） ----------
  if (route === 'template/page') {
    const idx = await loadSeed(env, request, 'tpl-index.json', [])
    const { results: hidden } = await db.prepare('SELECT type FROM template_hidden').all()
    const hset = new Set(hidden.map(h => h.type))
    const list = (Array.isArray(idx) ? idx : Object.values(idx)).map(t => ({
      type: t.name ?? t.type,
      name: t.title ?? t.name,
      category: Array.isArray(t.tags) && t.tags.length ? t.tags[0] : t.category ?? '',
      hidden: hset.has(t.name ?? t.type)
    }))
    return json(request, paged(list, { cur, size }))
  }
  if (route === 'template/delete' && request.method === 'POST') {
    await db
      .prepare('INSERT OR REPLACE INTO template_hidden (type, created_at) VALUES (?,?)')
      .bind(String(q.type || q.name), now)
      .run()
    return json(request, { code: 200, message: '已下架' })
  }

  // ---------- 简历历史版本 ----------
  if (route === 'history/page') {
    const { results } = await db
      .prepare(
        `SELECT v.id, v.resume_type AS resumeType, r.name,
                u.username, u.nickname, v.created_at AS createdAt
         FROM resume_versions v
         LEFT JOIN resumes r ON r.resume_type = v.resume_type AND r.user_id = v.user_id
         LEFT JOIN users u ON u.id = v.user_id
         ORDER BY v.created_at DESC LIMIT 500`
      )
      .all()
    return json(request, paged(results, { cur, size }))
  }
  if (route === 'history/get') {
    const row = await db.prepare('SELECT * FROM resume_versions WHERE id = ?').bind(+q.id).first()
    return row
      ? json(request, { code: 200, data: row })
      : json(request, { code: 404, msg: '版本不存在' })
  }
  if (route === 'history/restore' && request.method === 'POST') {
    const v = await db.prepare('SELECT * FROM resume_versions WHERE id = ?').bind(+q.id).first()
    if (!v) return json(request, { code: 404, msg: '版本不存在' })
    await db
      .prepare(
        'UPDATE resumes SET md = ?, style = ?, updated_at = ? WHERE resume_type = ? AND user_id = ?'
      )
      .bind(v.content ?? '', v.style ?? '', now, v.resume_type, v.user_id)
      .run()
    return json(request, { code: 200, message: '已回滚' })
  }
  if (route === 'history/delete' && request.method === 'POST') {
    const r = await db.prepare('DELETE FROM resume_versions WHERE id = ?').bind(+q.id).run()
    return r.meta.changes
      ? json(request, { code: 200, message: '已删除' })
      : json(request, { code: 404, msg: '版本不存在' })
  }

  // ---------- 攻略文章 ----------
  if (route.startsWith('post')) await syncPosts(env, request)
  if (route === 'post/page') {
    const kw = q.keyword || ''
    const { results } = await db
      .prepare(
        `SELECT * FROM posts ${kw ? 'WHERE title LIKE ? OR category LIKE ?' : 'WHERE 1=1'}
         ORDER BY publish_time DESC LIMIT 500`
      )
      .bind(...(kw ? [`%${kw}%`, `%${kw}%`] : []))
      .all()
    return json(request, paged(results, { cur, size }))
  }
  if (route === 'post/add' && request.method === 'POST') {
    const id = `post-${now}`
    await db
      .prepare(
        `INSERT INTO posts (_id,title,cover,category,tags,summary,content_md,author,status,view_count,publish_time,created_at,updated_at)
         VALUES (?,?,?,?,?,?,?,?,?,0,?,?,?)`
      )
      .bind(
        id,
        String(q.title || ''),
        String(q.cover || ''),
        String(q.category || ''),
        String(q.tags || ''),
        String(q.summary || ''),
        String(q.content_md ?? q.contentMd ?? ''),
        String(q.author || 'CodeCV'),
        'published',
        now,
        now,
        now
      )
      .run()
    return json(request, { code: 200, data: { _id: id }, message: '已发布' })
  }
  if (route === 'post/edit' && request.method === 'POST') {
    const f = {}
    for (const k of ['title', 'cover', 'category', 'tags', 'summary', 'status'])
      if (q[k] !== undefined) f[k] = String(q[k])
    if (q.content_md !== undefined || q.contentMd !== undefined)
      f.content_md = String(q.content_md ?? q.contentMd)
    if (q.deleted !== undefined) f.deleted = q.deleted ? 1 : 0
    f.updated_at = now
    const sets = Object.keys(f)
      .map(k => `${k} = ?`)
      .join(',')
    const r = await db
      .prepare(`UPDATE posts SET ${sets} WHERE _id = ?`)
      .bind(...Object.values(f), String(q._id ?? q.id))
      .run()
    return r.meta.changes
      ? json(request, { code: 200, message: '已保存' })
      : json(request, { code: 404, msg: '文章不存在' })
  }
  if (route === 'post/delete' && request.method === 'POST') {
    const r = await db
      .prepare('UPDATE posts SET deleted = 1, updated_at = ? WHERE _id = ?')
      .bind(now, String(q._id ?? q.id))
      .run()
    return r.meta.changes
      ? json(request, { code: 200, message: '已删除' })
      : json(request, { code: 404, msg: '文章不存在' })
  }

  // ---------- 面经后台 ----------
  if (route === 'mianjing/page') {
    const kw = q.keyword || ''
    const st = q.status || ''
    const { results } = await db
      .prepare(
        `SELECT s.*, u.username, u.nickname
         FROM mianjing_submissions s LEFT JOIN users u ON u.id = s.user_id
         WHERE 1=1
         ${st ? 'AND s.status = ?' : ''}
         ${kw ? 'AND (s.title LIKE ? OR s.company_name LIKE ?)' : ''}
         ORDER BY s.created_at DESC LIMIT 500`
      )
      .bind(...[st && st, kw && `%${kw}%`, kw && `%${kw}%`].filter(Boolean))
      .all()
    return json(request, paged(results, { cur, size }))
  }
  if (route === 'mianjing/get') {
    const row = await db
      .prepare('SELECT * FROM mianjing_submissions WHERE id = ?')
      .bind(+q.id)
      .first()
    return row
      ? json(request, { code: 200, data: row })
      : json(request, { code: 404, msg: '投稿不存在' })
  }
  if (route === 'mianjing/review' && request.method === 'POST') {
    const status = String(q.status || 'approved')
    const sub = await db
      .prepare('SELECT user_id, title FROM mianjing_submissions WHERE id = ?')
      .bind(+q.id)
      .first()
    await db
      .prepare('UPDATE mianjing_submissions SET status = ? WHERE id = ?')
      .bind(status, +q.id)
      .run()
    if (sub?.user_id && (status === 'approved' || status === 'published')) {
      await notify(
        db,
        sub.user_id,
        '面经审核通过',
        `你的面经「${sub.title || ''}」已发布`,
        'review',
        `/mianjing/p/${q.id}`
      )
    } else if (sub?.user_id && status === 'rejected') {
      await notify(
        db,
        sub.user_id,
        '面经未通过审核',
        `你的面经「${sub.title || ''}」未通过审核，可修改后重新提交`,
        'review',
        '/mianjing/mine'
      )
    }
    return json(request, { code: 200, message: '已更新' })
  }
  if (route === 'mianjing/save' && request.method === 'POST') {
    const f = {}
    for (const k of [
      'title',
      'company_name',
      'company_slug',
      'position_slug',
      'grade',
      'batch',
      'round',
      'result',
      'school',
      'major',
      'content_md',
      'status'
    ])
      if (q[k] !== undefined) f[k] = String(q[k])
    const sets = Object.keys(f)
      .map(k => `${k} = ?`)
      .join(',')
    if (!sets) return json(request, { code: 400, msg: '无可更新字段' })
    const r = await db
      .prepare(`UPDATE mianjing_submissions SET ${sets} WHERE id = ?`)
      .bind(...Object.values(f), +q.id)
      .run()
    return r.meta.changes
      ? json(request, { code: 200, message: '已保存' })
      : json(request, { code: 404, msg: '投稿不存在' })
  }
  if (route === 'mianjing/comments') {
    const { results } = await db
      .prepare(
        `SELECT c.*, u.username, u.nickname FROM comments c
         LEFT JOIN users u ON u.id = c.user_id
         ${q.doc ? 'WHERE c.doc_id = ?' : ''} ORDER BY c.created_at DESC LIMIT 500`
      )
      .bind(...(q.doc ? [String(q.doc)] : []))
      .all()
    return json(request, paged(results, { cur, size }))
  }
  if (route === 'mianjing/dict') {
    const meta = await loadSeed(env, request, 'mianjing-meta.json', {})
    const { results: extra } = await db.prepare('SELECT * FROM mj_dict').all()
    const merge = (key, seedList) => {
      const map = new Map((seedList || []).map(x => [x.slug, { ...x }]))
      for (const e of extra.filter(x => x.kind === key)) {
        const cur = map.get(e.slug) || { slug: e.slug }
        if (e.name) cur.name = e.name
        if (e.logo) cur.logo = e.logo
        if (e.extra) Object.assign(cur, JSON.parse(e.extra))
        map.set(e.slug, cur)
      }
      return [...map.values()]
    }
    return json(request, {
      code: 200,
      data: {
        companies: merge('company', meta.companies),
        positions: merge('position', meta.positions),
        topics: merge('topic', meta.topics)
      }
    })
  }
  if (route === 'mianjing/save-dict' && request.method === 'POST') {
    // 附赠：字典增改（prod 归在 mianjing/save 下）
    await db
      .prepare('INSERT OR REPLACE INTO mj_dict (kind, slug, name, logo, extra) VALUES (?,?,?,?,?)')
      .bind(
        String(q.kind),
        String(q.slug),
        String(q.name ?? ''),
        String(q.logo ?? ''),
        String(q.extra ?? '')
      )
      .run()
    return json(request, { code: 200, message: '已保存' })
  }
  if (route === 'mianjing/upload-logo' && request.method === 'POST') {
    // dataUrl 存入 mj_dict.logo（slug 指定公司）
    await db
      .prepare(
        'INSERT INTO mj_dict (kind, slug, name, logo) VALUES (?,?,?,?) ON CONFLICT(kind,slug) DO UPDATE SET logo = excluded.logo'
      )
      .bind('company', String(q.slug), '', String(q.dataUrl || q.logo || ''))
      .run()
    return json(request, { code: 200, message: '已上传' })
  }
  if (route === 'mianjing/activity/seasons') {
    const { results } = await db
      .prepare('SELECT * FROM admin_seasons ORDER BY created_at DESC LIMIT 100')
      .all()
    return json(request, { code: 200, data: results })
  }
  if (route === 'mianjing/activity/settle' && request.method === 'POST') {
    // 结算：把当前面经热度榜快照写入赛季 results，并改状态 settled
    const { results: top } = await db
      .prepare(
        `SELECT s.id, s.title, s.company_name, u.nickname, s.created_at,
                (SELECT COUNT(*) FROM reactions r WHERE r.target_type='mianjing' AND r.target_id = CAST(s.id AS TEXT) AND r.kind='like') AS likes
         FROM mianjing_submissions s LEFT JOIN users u ON u.id = s.user_id
         WHERE s.status = 'approved' ORDER BY likes DESC, s.created_at DESC LIMIT 20`
      )
      .all()
    const r = await db
      .prepare("UPDATE admin_seasons SET status='settled', results = ? WHERE id = ?")
      .bind(JSON.stringify(top), +q.id)
      .run()
    return r.meta.changes
      ? json(request, { code: 200, data: { count: top.length }, message: '已结算' })
      : json(request, { code: 404, msg: '赛季不存在' })
  }

  // ---------- 订单 / 进度 / 邀请 ----------
  if (route === 'order/page') {
    const { results } = await db
      .prepare(
        `SELECT o.*, u.username, u.nickname FROM orders o
         LEFT JOIN users u ON u.id = o.user_id
         ORDER BY o.created_at DESC LIMIT 500`
      )
      .all()
    return json(request, paged(results, { cur, size }))
  }
  if (route === 'progress/page') {
    const { results } = await db
      .prepare(
        `SELECT p.*, u.username, u.nickname FROM progress p
         LEFT JOIN users u ON u.id = p.user_id
         ORDER BY p.update_time DESC LIMIT 500`
      )
      .all()
    return json(request, paged(results, { cur, size }))
  }
  if (route === 'invite/page') {
    const { results } = await db
      .prepare(
        `SELECT i.*, u1.username AS inviterName, u2.username AS inviteeName
         FROM invites i
         LEFT JOIN users u1 ON u1.id = i.inviter_id
         LEFT JOIN users u2 ON u2.id = i.invitee_id
         ORDER BY i.created_at DESC LIMIT 500`
      )
      .all()
    return json(request, paged(results, { cur, size }))
  }

  // ---------- 广告位 / 广告 ----------
  if (route === 'advertiseSpace/query') {
    const { results } = await db
      .prepare('SELECT * FROM ad_spaces ORDER BY created_at DESC LIMIT 200')
      .all()
    return json(request, { code: 200, data: results })
  }
  if (route === 'advertiseSpace/save' && request.method === 'POST') {
    await db
      .prepare(
        'INSERT OR REPLACE INTO ad_spaces (code, name, position, created_at) VALUES (?,?,?,?)'
      )
      .bind(String(q.code), String(q.name || ''), String(q.position || ''), now)
      .run()
    return json(request, { code: 200, message: '已保存' })
  }
  if (route === 'advertiseSpace/delete' && request.method === 'POST') {
    await db.prepare('DELETE FROM ads WHERE space = ?').bind(String(q.code)).run()
    const r = await db.prepare('DELETE FROM ad_spaces WHERE code = ?').bind(String(q.code)).run()
    return r.meta.changes
      ? json(request, { code: 200, message: '已删除' })
      : json(request, { code: 404, msg: '广告位不存在' })
  }
  if (route === 'advertise/query') {
    const { results } = await db
      .prepare(
        `SELECT * FROM ads ${
          q.space ? 'WHERE space = ?' : ''
        } ORDER BY sort, created_at DESC LIMIT 200`
      )
      .bind(...(q.space ? [String(q.space)] : []))
      .all()
    return json(request, { code: 200, data: results })
  }
  if (route === 'advertise/save' && request.method === 'POST') {
    if (q.id) {
      await db
        .prepare(
          'UPDATE ads SET space=?, title=?, image=?, link=?, sort=?, status=?, start_at=?, end_at=? WHERE id=?'
        )
        .bind(
          String(q.space || ''),
          String(q.title || ''),
          String(q.image || ''),
          String(q.link || ''),
          +q.sort || 0,
          q.status === undefined ? 1 : +q.status,
          +q.start_at || 0,
          +q.end_at || 0,
          +q.id
        )
        .run()
      return json(request, { code: 200, message: '已保存' })
    }
    const r = await db
      .prepare(
        'INSERT INTO ads (space,title,image,link,sort,status,start_at,end_at,created_at) VALUES (?,?,?,?,?,?,?,?,?)'
      )
      .bind(
        String(q.space || ''),
        String(q.title || ''),
        String(q.image || ''),
        String(q.link || ''),
        +q.sort || 0,
        q.status === undefined ? 1 : +q.status,
        +q.start_at || 0,
        +q.end_at || 0,
        now
      )
      .run()
    return json(request, { code: 200, data: { id: r.meta.last_row_id }, message: '已创建' })
  }
  if (route === 'advertise/delete' && request.method === 'POST') {
    const r = await db.prepare('DELETE FROM ads WHERE id = ?').bind(+q.id).run()
    return r.meta.changes
      ? json(request, { code: 200, message: '已删除' })
      : json(request, { code: 404, msg: '广告不存在' })
  }

  // ---------- 导出 / 校对统计 ----------
  if (route === 'export/stats' || route === 'proofread/stats') {
    const table = route === 'export/stats' ? 'export_events' : 'proofread_events'
    const { results } = await db
      .prepare(
        `SELECT date(created_at/1000, 'unixepoch') AS day, COUNT(*) AS n
         FROM ${table} WHERE created_at > ? GROUP BY day ORDER BY day`
      )
      .bind(now - 30 * 86400e3)
      .all()
    const total = await db.prepare(`SELECT COUNT(*) n FROM ${table}`).first()
    return json(request, { code: 200, data: { days: results, total: total.n } })
  }
  if (route === 'export/events' || route === 'proofread/events') {
    const table = route === 'export/events' ? 'export_events' : 'proofread_events'
    const { results } = await db
      .prepare(
        `SELECT e.*, u.username, u.nickname FROM ${table} e
         LEFT JOIN users u ON u.id = e.user_id ORDER BY e.created_at DESC LIMIT 500`
      )
      .all()
    return json(request, paged(results, { cur, size }))
  }

  // ---------- 会员码 ----------
  if (route === 'vipCode/page' || route === 'vipCode/all') {
    const { results } = await db
      .prepare(
        `SELECT c.*, u.username AS usedByName FROM redeem_codes c
         LEFT JOIN users u ON u.id = c.used_by ORDER BY c.code LIMIT 1000`
      )
      .all()
    return route === 'vipCode/all'
      ? json(request, { code: 200, data: results })
      : json(request, paged(results, { cur, size }))
  }
  if (route === 'vipCode/add' && request.method === 'POST') {
    const count = Math.min(100, Math.max(1, +(q.count || 1)))
    const days = +(q.days || 30)
    const made = []
    for (let i = 0; i < count; i++) {
      const code = [...crypto.getRandomValues(new Uint8Array(8))]
        .map(b => 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'[b % 32])
        .join('')
      await db
        .prepare('INSERT OR IGNORE INTO redeem_codes (code, days) VALUES (?,?)')
        .bind(code, days)
        .run()
      made.push(code)
    }
    return json(request, { code: 200, data: { codes: made }, message: `已生成 ${made.length} 个` })
  }
  if (route === 'vipCode/delete' && request.method === 'POST') {
    const r = await db.prepare('DELETE FROM redeem_codes WHERE code = ?').bind(String(q.code)).run()
    return r.meta.changes
      ? json(request, { code: 200, message: '已删除' })
      : json(request, { code: 404, msg: '码不存在' })
  }

  // ---------- 话题 ----------
  if (route === 'topic/save' && request.method === 'POST') {
    if (q.id) {
      await db
        .prepare('UPDATE topics SET name=?, cover=?, sort=? WHERE id=?')
        .bind(String(q.name || ''), String(q.cover || ''), +q.sort || 0, +q.id)
        .run()
      return json(request, { code: 200, message: '已保存' })
    }
    const r = await db
      .prepare('INSERT INTO topics (name, cover, sort, created_at) VALUES (?,?,?,?)')
      .bind(String(q.name || ''), String(q.cover || ''), +q.sort || 0, now)
      .run()
    return json(request, { code: 200, data: { id: r.meta.last_row_id }, message: '已创建' })
  }
  if (route === 'topic/upload-cover' && request.method === 'POST') {
    await db
      .prepare('UPDATE topics SET cover = ? WHERE id = ?')
      .bind(String(q.dataUrl || q.cover || ''), +q.id)
      .run()
    return json(request, { code: 200, message: '已上传' })
  }

  return json(request, { msg: 'not found' }, 404)
}
