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

export const sub = (field, v) =>
  !v ||
  String(field ?? '')
    .toLowerCase()
    .includes(String(v).toLowerCase())
