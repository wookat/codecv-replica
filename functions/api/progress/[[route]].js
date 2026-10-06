// /api/progress/page|add|edit|delete — 对齐生产投递进度契约（需登录）
// 状态桶：全部/待投递/投递中(已投递+筛选中+笔试)/面试中(*面)/Offer/流程终止
import { json, readBody } from '../../_lib.js'
import { currentUserRow } from '../../_auth.js'

const FIELDS =
  'id, name, post, work_location AS workLocation, status, channel, link, mark, snapshot, post_time, update_time, create_time'

const parseSnapshot = raw => {
  try {
    return JSON.parse(raw || '{}')
  } catch {
    return {}
  }
}

export async function onRequest(context) {
  const { request, env } = context
  if (request.method === 'OPTIONS') return json(request, {})
  const url = new URL(request.url)
  const route = url.pathname.split('/').pop()
  const q =
    request.method === 'POST' ? await readBody(request) : Object.fromEntries(url.searchParams)
  const auth = await currentUserRow(env, request, q)
  if (!auth) return json(request, { code: 401, msg: '请先登录' }, 401)
  const uid = auth.row.id

  if (route === 'page') {
    const rows = await env.DB.prepare(
      `SELECT ${FIELDS} FROM progress WHERE user_id = ? ORDER BY post_time DESC, id DESC`
    )
      .bind(uid)
      .all()
    const list = (rows.results || []).map(r => ({ ...r, snapshot: parseSnapshot(r.snapshot) }))
    // 事件时间线批量取
    const ids = list.map(r => r.id)
    let events = []
    if (ids.length) {
      const ph = ids.map(() => '?').join(',')
      const ev = await env.DB.prepare(
        `SELECT progress_id AS pid, status, time FROM progress_events WHERE progress_id IN (${ph}) ORDER BY time ASC, id ASC`
      )
        .bind(...ids)
        .all()
      events = ev.results || []
    }
    const withEvents = list.map(r => ({
      ...r,
      events: events.filter(e => e.pid === r.id).map(e => ({ status: e.status, time: e.time }))
    }))
    return json(request, { code: 200, data: { list: withEvents, total: list.length } })
  }

  if (route === 'add') {
    const {
      name = '',
      post = '',
      workLocation = '',
      status = '已投递',
      channel = '',
      link = '',
      mark = '',
      snapshot = {},
      post_time = 0
    } = q
    if (!String(name).trim()) return json(request, { code: 400, msg: '请填写公司名' })
    const now = Date.now()
    const pt = +post_time || now
    const res = await env.DB.prepare(
      `INSERT INTO progress(user_id, name, post, work_location, status, channel, link, mark, snapshot, post_time, update_time, create_time)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    )
      .bind(
        uid,
        String(name).slice(0, 50),
        String(post).slice(0, 50),
        String(workLocation).slice(0, 50),
        String(status),
        String(channel).slice(0, 20),
        String(link).slice(0, 300),
        String(mark).slice(0, 100),
        JSON.stringify(snapshot || {}),
        pt,
        now,
        now
      )
      .run()
    const id = res.meta?.last_row_id
    if (id) {
      await env.DB.prepare(
        'INSERT INTO progress_events(progress_id, status, time) VALUES (?, ?, ?)'
      )
        .bind(id, String(status), pt)
        .run()
    }
    return json(request, { code: 200, data: { id } })
  }

  if (route === 'edit') {
    const { id } = q
    const cur = await env.DB.prepare('SELECT * FROM progress WHERE id = ? AND user_id = ?')
      .bind(+id, uid)
      .first()
    if (!cur) return json(request, { code: 404, msg: '记录不存在' })
    const now = Date.now()
    const merged = {
      name: 'name' in q ? String(q.name).slice(0, 50) : cur.name,
      post: 'post' in q ? String(q.post).slice(0, 50) : cur.post,
      workLocation: 'workLocation' in q ? String(q.workLocation).slice(0, 50) : cur.work_location,
      status: 'status' in q ? String(q.status) : cur.status,
      channel: 'channel' in q ? String(q.channel).slice(0, 20) : cur.channel,
      link: 'link' in q ? String(q.link).slice(0, 300) : cur.link,
      mark: 'mark' in q ? String(q.mark).slice(0, 100) : cur.mark,
      snapshot: 'snapshot' in q ? JSON.stringify(q.snapshot || {}) : cur.snapshot,
      post_time: 'post_time' in q ? +q.post_time || cur.post_time : cur.post_time
    }
    await env.DB.prepare(
      `UPDATE progress SET name=?, post=?, work_location=?, status=?, channel=?, link=?, mark=?, snapshot=?, post_time=?, update_time=? WHERE id=?`
    )
      .bind(
        merged.name,
        merged.post,
        merged.workLocation,
        merged.status,
        merged.channel,
        merged.link,
        merged.mark,
        merged.snapshot,
        merged.post_time,
        now,
        +id
      )
      .run()
    // 状态变化 → 追加事件（对齐生产 events 时间线）
    if ('status' in q && String(q.status) !== cur.status) {
      await env.DB.prepare(
        'INSERT INTO progress_events(progress_id, status, time) VALUES (?, ?, ?)'
      )
        .bind(+id, String(q.status), now)
        .run()
    }
    return json(request, { code: 200, msg: '更新成功' })
  }

  if (route === 'delete') {
    const { id } = q
    await env.DB.prepare('DELETE FROM progress WHERE id = ? AND user_id = ?').bind(+id, uid).run()
    await env.DB.prepare('DELETE FROM progress_events WHERE progress_id = ?').bind(+id).run()
    return json(request, { code: 200, msg: '已删除' })
  }

  return json(request, { code: 404, msg: 'not found' }, 404)
}
