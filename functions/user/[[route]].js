// /user/* —— CodeCV OSS 前端契约：register/login/logout/verify/update/queryUserById/pwdUpdate
import { json, readBody, memberTier } from '../_lib.js'
import {
  hashPassword,
  verifyPassword,
  issueToken,
  dropToken,
  tokenUser,
  publicUser,
  currentUserRow
} from '../_auth.js'

export async function onRequest(context) {
  const { request, env } = context
  const url = new URL(request.url)
  if (request.method === 'OPTIONS') return json(request, {})
  // /user/invite 是前端页面路由——仅它放行给 SPA；其余 GET（如 /user/info 配额接口）走 API
  const route = url.pathname.split('/').pop()
  if (request.method === 'GET' && route !== 'info') return context.next()
  const q = await readBody(request)
  const db = env.DB
  const kv = env.UPSTASH_KV
  if (!db || !kv) return json(request, { code: 503, msg: 'service unavailable' }, 503)

  if (route === 'register') {
    const { username, password } = q
    if (!username || !password) return json(request, { code: 400, msg: '用户名或密码不能为空' })
    const exist = await db.prepare('SELECT id FROM users WHERE username = ?').bind(username).first()
    if (exist) return json(request, { code: 400, msg: '用户名已被注册' })
    const { salt, hash } = await hashPassword(password)
    const inviter = typeof q.invite === 'string' && q.invite !== username ? q.invite : ''
    const r = await db
      .prepare(
        'INSERT INTO users (username, pwd_hash, salt, nickname, origin, inviter, created_at) VALUES (?,?,?,?,?,?,?)'
      )
      .bind(username, hash, salt, username, 'web', inviter, Date.now())
      .run()
    const row = await db
      .prepare('SELECT * FROM users WHERE id = ?')
      .bind(r.meta.last_row_id)
      .first()
    const token = await issueToken(kv, username)
    return json(request, { code: 200, msg: '注册成功', token, data: publicUser(row) })
  }

  if (route === 'login') {
    const { username, password } = q
    const row = await db.prepare('SELECT * FROM users WHERE username = ?').bind(username).first()
    if (!row || !(await verifyPassword(password || '', row.salt, row.pwd_hash))) {
      return json(request, { code: 400, msg: '用户名或密码错误' })
    }
    const token = await issueToken(kv, username)
    return json(request, { code: 200, msg: '登录成功', token, data: publicUser(row) })
  }

  if (route === 'logout') {
    const username = await tokenUser(
      kv,
      q.token || (request.headers.get('authorization') || '').replace(/^Bearer\s+/i, '')
    )
    if (username) await dropToken(kv, username)
    return json(request, { code: 200, msg: '退出成功' })
  }

  if (route === 'verify') {
    const username = await tokenUser(kv, q.token)
    if (!username || (q.username && username !== q.username)) {
      return json(request, { code: 401, msg: '登录状态已失效' })
    }
    const row = await db.prepare('SELECT * FROM users WHERE username = ?').bind(username).first()
    return row
      ? json(request, { code: 200, msg: '验证成功', data: publicUser(row) })
      : json(request, { code: 401, msg: '用户不存在' })
  }

  if (route === 'update') {
    const cur = await currentUserRow(env, request, q)
    if (!cur || cur.row.username !== q.username) {
      return json(request, { code: 401, msg: '登录状态已失效' })
    }
    const row = cur.row
    await db
      .prepare(
        'UPDATE users SET nickname=?, sex=?, professional=?, graduation=?, school=?, avatar=? WHERE id=?'
      )
      .bind(
        q.nickName ?? '',
        q.sex ?? '',
        q.professional ?? '',
        q.graduation ?? '',
        q.school ?? '',
        q.avatar ?? '',
        row.id
      )
      .run()
    return json(request, { code: 200, msg: '更新成功' })
  }

  // 用户信息 + 配额：对照生产 /api/user/info {uid,nickName,member_expires,cv,ai,ec,...}
  if (route === 'info') {
    const tok = q.token || (request.headers.get('authorization') || '').replace(/^Bearer\s+/i, '')
    const username = await tokenUser(kv, tok)
    if (!username) return json(request, { code: 401, msg: '登录状态已失效' })
    const row = await db.prepare('SELECT * FROM users WHERE username = ?').bind(username).first()
    if (!row) return json(request, { code: 401, msg: '用户不存在' })
    const tier = memberTier(row)
    const isMember = !!tier
    const ec = await db
      .prepare('SELECT COALESCE(SUM(export_count),0) AS c FROM resumes WHERE user_id = ?')
      .bind(row.id)
      .first()
    const cvUsed = await db
      .prepare('SELECT COUNT(*) AS c FROM resumes WHERE user_id = ?')
      .bind(row.id)
      .first()
    return json(request, {
      code: 200,
      msg: '查询成功',
      data: {
        ...publicUser(row),
        member_expires: row.vip_expire || 0,
        member_plan: row.vip_plan || '',
        cv: isMember ? tier.cv : 1,
        cvUsed: cvUsed?.c || 0,
        uploadMB: isMember ? tier.uploadMB : 0.2,
        ai: isMember ? -1 : 3,
        ec: ec?.c || 0
      }
    })
  }

  if (route === 'queryUserById') {
    const cur = await currentUserRow(env, request, q)
    if (!cur) return json(request, { code: 401, msg: '登录状态已失效' })
    const row =
      Number(q.uid) === cur.row.id
        ? cur.row
        : await db.prepare('SELECT * FROM users WHERE id = ?').bind(q.uid).first()
    return row && (Number(q.uid) === cur.row.id || cur.row.is_admin)
      ? json(request, { code: 200, msg: '查询成功', data: publicUser(row) })
      : json(request, { code: 404, msg: '用户不存在' })
  }

  if (route === 'pwdUpdate') {
    const { oPassword, nPassword } = q
    const cur = await currentUserRow(env, request, q)
    if (!cur || cur.row.username !== q.username) {
      return json(request, { code: 401, msg: '登录状态已失效' })
    }
    const row = cur.row
    if (!(await verifyPassword(oPassword || '', row.salt, row.pwd_hash))) {
      return json(request, { code: 400, msg: '原密码错误' })
    }
    const { salt, hash } = await hashPassword(nPassword)
    await db
      .prepare('UPDATE users SET pwd_hash=?, salt=? WHERE id=?')
      .bind(hash, salt, row.id)
      .run()
    return json(request, { code: 200, msg: '密码修改成功' })
  }

  if (route === 'redeem') {
    const { code } = q
    const cur = await currentUserRow(env, request, q)
    if (!cur) return json(request, { code: 401, msg: '请先登录后再兑换' })
    if (!code || String(code).length < 6) {
      return json(request, { code: 400, msg: '兑换码格式不正确' })
    }
    const u = cur.row
    const c = await db
      .prepare('SELECT code, days, used_by FROM redeem_codes WHERE code = ?')
      .bind(String(code))
      .first()
    if (!c || c.used_by) return json(request, { code: 400, msg: '兑换码无效或已被使用' })
    const base = Math.max(Date.now(), Number(u.vip_expire) || 0)
    const expire = base + Number(c.days) * 86400 * 1000
    await db.batch([
      db
        .prepare('UPDATE redeem_codes SET used_by=?, used_at=? WHERE code=?')
        .bind(u.id, Date.now(), c.code),
      db.prepare('UPDATE users SET vip_expire=? WHERE id=?').bind(expire, u.id)
    ])
    return json(request, { code: 200, msg: `兑换成功，会员有效期延长 ${c.days} 天` })
  }

  return json(request, { code: 404, msg: 'not found' }, 404)
}
