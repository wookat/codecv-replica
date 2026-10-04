// /api/mianjing/list|detail|companies|positions|topics|stats|company-facets|topic-facets
import { json, readBody, loadSeed, sub } from '../../_lib.js'

const BATCH_MAP = {
  秋招: 'qiuzhao',
  春招: 'chunzhao',
  暑期实习: 'shuqi',
  日常实习: 'richang',
  社招: 'shezhao'
}

export async function onRequest(context) {
  const { request, env } = context
  if (request.method === 'OPTIONS') return json(request, {})
  const url = new URL(request.url)
  const route = url.pathname.split('/').pop()
  const q =
    request.method === 'POST' ? await readBody(request) : Object.fromEntries(url.searchParams)

  if (route === 'list') {
    const { current, page = 1, pageSize = 20, company, position, grade, batch, round, keyword } = q
    const cur = +(current ?? page ?? 1)
    const filtered = (await loadSeed(env, request, 'mianjing-list.json', [])).filter(m => {
      if (company && m.companySlug !== company && m.companyName !== company) return false
      if (position && m.positionSlug !== position && m.positionName !== position) return false
      if (grade && String(m.grade) !== String(grade)) return false
      if (batch && m.batch !== batch && m.batch !== (BATCH_MAP[batch] ?? batch)) return false
      if (round && m.round !== round) return false
      if (
        keyword &&
        !sub(m.title, keyword) &&
        !sub(m.summary, keyword) &&
        !sub(m.companyName, keyword) &&
        !sub(m.positionName, keyword)
      )
        return false
      return true
    })
    filtered.sort((a, b) => (b.publishTime || 0) - (a.publishTime || 0))
    const start = (cur - 1) * pageSize
    return json(request, {
      code: 200,
      data: filtered.slice(start, start + +pageSize),
      total: filtered.length,
      message: '查询成功'
    })
  }

  if (route === 'detail') {
    const details = await loadSeed(env, request, 'mianjing-detail.json', {})
    const hit = details[q.id || q._id]
    return json(
      request,
      hit
        ? { code: 200, data: hit, message: '查询成功' }
        : { code: 404, data: null, message: '面经不存在' }
    )
  }

  const META = ['companies', 'positions', 'topics', 'stats', 'company-facets', 'topic-facets']
  if (META.includes(route)) {
    const meta = await loadSeed(env, request, 'mianjing-meta.json', {})
    return json(request, {
      code: 200,
      data: meta[route] ?? (route === 'stats' ? {} : []),
      message: '获取成功'
    })
  }

  return json(request, { msg: 'not found' }, 404)
}
