// /api/invite/records —— 我的邀请记录（与生产列口径一致）
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

  if (route === 'records') {
    const { results } = await env.DB.prepare(
      `SELECT i.id, i.order_no AS orderNo, i.commission, i.settle_status AS settleStatus,
              i.created_at AS createdAt,
              u.id AS userId, COALESCE(u.nickname, u.username) AS nickname,
              CASE WHEN u.vip_expire > ? THEN '会员' ELSE '普通用户' END AS identity
       FROM invites i JOIN users u ON u.id = i.invitee_id
       WHERE i.inviter_id = ? ORDER BY i.created_at DESC LIMIT 100`
    )
      .bind(Date.now(), auth.row.id)
      .all()
    return json(request, { code: 200, data: results, message: '查询成功' })
  }

  return json(request, { code: 404, msg: 'not found' }, 404)
}
