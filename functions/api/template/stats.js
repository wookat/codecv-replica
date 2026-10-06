// GET /api/template/stats —— 模板下载/使用计数聚合（替代原 Upstash templateData 桩）
// 返回 {result: '{"t<type>": <n>}'} 保持前端 JSON.parse(result) 契约
import { json } from '../../_lib.js'

export async function onRequest(context) {
  const { request, env } = context
  if (request.method === 'OPTIONS') return json(request, {})
  const { results } = await env.DB.prepare(
    'SELECT resume_type, COUNT(*) AS n FROM export_events GROUP BY resume_type'
  ).all()
  const out = {}
  for (const r of results || []) out[`t${r.resume_type}`] = String(r.n)
  return json(request, { code: 200, result: JSON.stringify(out), message: '获取成功' })
}
