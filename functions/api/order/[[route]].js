// /api/order/create|list|pay —— 会员订单流（pay 为模拟支付标记；真实收款渠道待接）
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

  if (route === 'create' && request.method === 'POST') {
    const { plan, amount } = q
    if (!plan || amount == null) return json(request, { code: 400, msg: '订单参数不完整' })
    const orderNo = `CV${Date.now()}${Math.floor(Math.random() * 9000 + 1000)}`
    await db
      .prepare(
        'INSERT INTO orders (user_id, order_no, plan, amount, status, created_at) VALUES (?,?,?,?,?,?)'
      )
      .bind(uid, orderNo, String(plan), Math.round(+amount * 100), 'pending', Date.now())
      .run()
    return json(request, { code: 200, data: { orderNo }, message: '订单创建成功' })
  }

  if (route === 'list') {
    const { results } = await db
      .prepare(
        'SELECT order_no AS orderNo, plan, amount, status, created_at, paid_at FROM orders WHERE user_id = ? ORDER BY created_at DESC LIMIT 100'
      )
      .bind(uid)
      .all()
    return json(request, { code: 200, data: results, message: '查询成功' })
  }

  if (route === 'pay' && request.method === 'POST') {
    // 模拟支付：真实收款需接入微信/支付宝商户，此端点标记订单为已支付
    const r = await db
      .prepare(
        "UPDATE orders SET status = 'paid', paid_at = ? WHERE order_no = ? AND user_id = ? AND status = 'pending'"
      )
      .bind(Date.now(), q.orderNo, uid)
      .run()
    return r.meta.changes
      ? json(request, { code: 200, message: '支付成功（模拟）' })
      : json(request, { code: 400, msg: '订单不存在或已支付' })
  }

  return json(request, { code: 404, msg: 'not found' }, 404)
}
