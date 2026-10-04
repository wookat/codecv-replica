// /api/post/page（POST）、/api/post/detail
import { json, readBody, loadSeed, sub } from '../../_lib.js'

export async function onRequest(context) {
  const { request, env } = context
  if (request.method === 'OPTIONS') return json(request, {})
  const url = new URL(request.url)
  const route = url.pathname.split('/').pop()

  if (route === 'page' && request.method === 'POST') {
    const { current = 1, pageSize = 12, keyword } = await readBody(request)
    const filtered = (await loadSeed(env, request, 'posts.json', [])).filter(
      p => sub(p.title, keyword) || sub(p.description, keyword)
    )
    filtered.sort((a, b) => (b.create_time || 0) - (a.create_time || 0))
    const start = (current - 1) * pageSize
    return json(request, {
      code: 200,
      data: filtered.slice(start, start + pageSize).map(p => ({ ...p, content: undefined })),
      total: filtered.length,
      message: '查询成功'
    })
  }

  if (route === 'detail') {
    const q =
      request.method === 'POST' ? await readBody(request) : Object.fromEntries(url.searchParams)
    const hit = (await loadSeed(env, request, 'posts.json', [])).find(p => p._id === q.id)
    const body = (await loadSeed(env, request, 'post-detail.json', {}))[q.id]
    return json(
      request,
      hit
        ? { code: 200, data: { ...hit, contentMd: body?.contentMd }, message: '查询成功' }
        : { code: 404, data: null, message: '文章不存在' }
    )
  }

  return json(request, { msg: 'not found' }, 404)
}
