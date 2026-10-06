// /api/post/page（POST）、/api/post/detail
import { json, readBody, loadSeed, sub } from '../../_lib.js'

// 种子 ∪ D1 posts：同名 _id 以 D1 为准（admin 增改删实时生效）
async function mergedPosts(env, request) {
  const seed = await loadSeed(env, request, 'posts.json', [])
  if (!env.DB) return seed
  try {
    const { results } = await env.DB.prepare('SELECT * FROM posts').all()
    const map = new Map(seed.map(p => [p._id, { ...p }]))
    for (const r of results) {
      if (r.deleted) {
        map.delete(r._id)
        continue
      }
      const cur = map.get(r._id) || {}
      map.set(r._id, {
        ...cur,
        _id: r._id,
        title: r.title,
        cover: r.cover,
        category: r.category,
        tags: r.tags ? String(r.tags).split(',') : cur.tags,
        summary: r.summary || cur.summary,
        description: r.summary || cur.description,
        author: r.author,
        publishTime: r.publish_time,
        create_time: r.publish_time,
        viewCount: r.view_count,
        _contentMd: r.content_md
      })
    }
    return [...map.values()]
  } catch {
    return seed
  }
}

export async function onRequest(context) {
  const { request, env } = context
  if (request.method === 'OPTIONS') return json(request, {})
  const url = new URL(request.url)
  const route = url.pathname.split('/').pop()

  if (route === 'page' && request.method === 'POST') {
    const { current = 1, pageSize = 12, keyword } = await readBody(request)
    const filtered = (await mergedPosts(env, request)).filter(
      p => sub(p.title, keyword) || sub(p.description, keyword)
    )
    // 与生产一致的置顶顺序（/api/post/page 实测返回序），未收录的按创建时间倒序排在后面
    const PIN = [
      '65dc625867eb86a2004a5ec229e09fa6',
      '65dc625867ee0047006b178247733dcb',
      '76c63bbb67edf66000686c241718b1c0',
      'a235246469098f330219c3f21de5d058',
      'dcffa82467edfda1006b9fef0b33d1b7',
      'def9fa8469076e8701df42d732e8183c',
      'def9fa846909872d0218a4032959b4fe',
      'ed153fc767edfb2e0068525536796dad',
      'f97e292f68ac6668035f57bc4bb70426'
    ]
    const pinIdx = id => {
      const i = PIN.indexOf(id)
      return i === -1 ? PIN.length : i
    }
    filtered.sort(
      (a, b) => pinIdx(a._id) - pinIdx(b._id) || (b.create_time || 0) - (a.create_time || 0)
    )
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
    const hit = (await mergedPosts(env, request)).find(p => p._id === q.id)
    const body = (await loadSeed(env, request, 'post-detail.json', {}))[q.id]
    return json(
      request,
      hit
        ? {
            code: 200,
            data: { ...hit, contentMd: hit._contentMd || body?.contentMd },
            message: '查询成功'
          }
        : { code: 404, data: null, message: '文章不存在' }
    )
  }

  return json(request, { msg: 'not found' }, 404)
}
