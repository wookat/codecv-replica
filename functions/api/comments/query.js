// /api/comments/query?pageSize=6&pageNum=N —— 复刻生产反馈 API 形状
import { json, loadSeed } from '../../_lib.js'

export async function onRequest(context) {
  const { request, env } = context
  if (request.method === 'OPTIONS') return json(request, {})
  const url = new URL(request.url)
  const pageNum = Math.max(1, parseInt(url.searchParams.get('pageNum') || '1', 10))
  const pageSize = parseInt(url.searchParams.get('pageSize') || '6', 10)
  const all = await loadSeed(env, request, 'feedbacks.json', [])
  const items = all
    .slice()
    .sort((a, b) => (b.t || 0) - (a.t || 0))
    .slice((pageNum - 1) * pageSize, pageNum * pageSize)
    .map(x => ({
      cnt: x.content,
      pf: x.field,
      av: x.av,
      au: x.au,
      t: x.t,
      ...(x.reply ? { rc: x.reply.replace(/^作者回复：/, '') } : {})
    }))
  return json(request, { code: 200, result: items })
}
