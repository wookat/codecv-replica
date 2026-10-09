// Pages Functions 公共库：种子数据读取（经 ASSETS 绑定）+ JSON/CORS 响应
// 以 _ 开头不被路由。种子文件随静态资源部署在 /seeds/*.json。

const seedCache = new Map()

export async function loadSeed(env, request, name, fallback) {
  if (seedCache.has(name)) return seedCache.get(name)
  const u = new URL(request.url)
  const res = await env.ASSETS.fetch(new Request(`${u.origin}/seeds/${name}`))
  const data = res.ok ? await res.json() : fallback
  seedCache.set(name, data)
  return data
}

export function json(req, obj, code = 200) {
  // 前端 axios withCredentials：回显 Origin + Allow-Credentials（不能用 *）
  const h = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': req.headers.get('Origin') || '*',
    'Access-Control-Allow-Credentials': 'true',
    'Access-Control-Allow-Headers': req.headers.get('Access-Control-Request-Headers') || '*',
    'Access-Control-Allow-Methods': req.headers.get('Access-Control-Request-Method') || '*'
  }
  return new Response(JSON.stringify(obj), { status: code, headers: h })
}

export async function readBody(request) {
  const t = await request.text()
  return t ? JSON.parse(t) : {}
}

export const onRequestOptions = context => json(context.request, {})

/** 写一条用户通知（best-effort，失败静默） */
export async function notify(db, userId, title, content, type, link) {
  if (!userId) return
  try {
    await db
      .prepare(
        'INSERT INTO notifications (user_id,title,content,type,link,is_read,created_at) VALUES (?,?,?,?,?,0,?)'
      )
      .bind(userId, title, content || '', type || 'system', link || '', Date.now())
      .run()
  } catch {
    /* 通知失败不阻断主流程 */
  }
}

export const sub = (field, v) =>
  !v ||
  String(field ?? '')
    .toLowerCase()
    .includes(String(v).toLowerCase())

// 会员档位（对齐生产 Pp/Rp 矩阵）：免费版 1份简历/200KB 上传；
// 月4份·季5份·年15份·终身不限，上传 2MB（终身 10MB）
export const VIP_TIERS = {
  月度会员: { days: 30, cv: 4, uploadMB: 2 },
  季度会员: { days: 90, cv: 5, uploadMB: 2 },
  年度会员: { days: 365, cv: 15, uploadMB: 2 },
  终身会员: { days: 36500, cv: -1, uploadMB: 10 }
}
export function memberTier(row) {
  const exp = Number(row?.vip_expire) || 0
  if (exp <= Date.now()) return null
  return VIP_TIERS[row?.vip_plan] || VIP_TIERS['月度会员']
}
export const cvQuota = row => (memberTier(row) ? memberTier(row).cv : 1)
export const uploadLimitMB = row => (memberTier(row) ? memberTier(row).uploadMB : 0.2)
