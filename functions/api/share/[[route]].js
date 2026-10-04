// /api/share/create|get —— 简历分享链接（create 需登录，get 公开只读）
import { json, readBody } from '../../_lib.js'
import { currentUserRow } from '../../_auth.js'

const SHARE_ID_LEN = 10
const rid = () => {
  const abc = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  const b = crypto.getRandomValues(new Uint8Array(SHARE_ID_LEN))
  return [...b].map(x => abc[x % abc.length]).join('')
}

export async function onRequest(context) {
  const { request, env } = context
  const url = new URL(request.url)
  if (request.method === 'OPTIONS') return json(request, {})
  const route = url.pathname.split('/').pop()
  if (!env.DB) return json(request, { code: 503, msg: 'service unavailable' }, 503)
  const db = env.DB

  if (route === 'create' && request.method === 'POST') {
    const q = await readBody(request)
    const auth = await currentUserRow(env, request, q)
    if (!auth) return json(request, { code: 401, msg: '请先登录' })
    const { type, name, content, style } = q
    if (!type || !content) return json(request, { code: 400, msg: '分享内容为空' })
    const id = rid()
    await db
      .prepare(
        'INSERT INTO shares (id, user_id, type, name, content, style, created_at) VALUES (?,?,?,?,?,?,?)'
      )
      .bind(id, auth.row.id, String(type), String(name || ''), String(content), String(style || ''), Date.now())
      .run()
    return json(request, { code: 200, data: { id }, message: '分享链接已生成' })
  }

  if (route === 'get') {
    const id = url.searchParams.get('id')
    if (!id) return json(request, { code: 400, msg: '缺少分享 id' })
    const row = await db
      .prepare('SELECT type, name, content, created_at FROM shares WHERE id = ?')
      .bind(id)
      .first()
    return row
      ? json(request, { code: 200, data: row, message: '查询成功' })
      : json(request, { code: 404, msg: '分享不存在或已过期' })
  }

  return json(request, { code: 404, msg: 'not found' }, 404)
}
