// GET /api/template/hidden — 后台下架的模板 type 列表（公开读）
import { json } from '../../_lib.js'

export async function onRequest(context) {
  const { request, env } = context
  if (request.method === 'OPTIONS') return json(request, {})
  if (!env.DB) return json(request, { code: 200, data: [] })
  try {
    const { results } = await env.DB.prepare('SELECT type FROM template_hidden').all()
    return json(request, { code: 200, data: results.map(r => r.type) })
  } catch {
    return json(request, { code: 200, data: [] })
  }
}
