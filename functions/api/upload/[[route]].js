// 图片上传：POST /api/upload（登录）→ KV img:<id> 存二进制，GET /api/upload/<id> 回图
// 对齐生产语义：multipart 上传返回 {code,url}，前端把 url 插进编辑器
import { json } from '../../_lib.js'
import { currentUserRow } from '../../_auth.js'

const id16 = () =>
  [...crypto.getRandomValues(new Uint8Array(8))].map(b => b.toString(16).padStart(2, '0')).join('')

export async function onRequestGet(context) {
  const { request, env, params } = context
  const id = params.route?.[0]
  if (!id || !/^[0-9a-f]{16}$/.test(id)) return json(request, { code: 404, msg: 'not found' }, 404)
  const { value, metadata } = await env.UPSTASH_KV.getWithMetadata(`img:${id}`, 'arrayBuffer')
  if (!value) return json(request, { code: 404, msg: 'not found' }, 404)
  return new Response(value, {
    headers: {
      'Content-Type': metadata?.mime || 'image/png',
      'Cache-Control': 'public, max-age=31536000, immutable',
      'Access-Control-Allow-Origin': '*'
    }
  })
}

export async function onRequestPost(context) {
  const { request, env } = context
  const body = {}
  const me = await currentUserRow(env, request, body)
  if (!me) return json(request, { code: 401, msg: '请先登录' }, 401)
  const ct = request.headers.get('Content-Type') || ''
  let buf,
    mime = 'image/png',
    name = 'image.png'
  if (ct.includes('multipart/form-data')) {
    const fd = await request.formData()
    const file = fd.get('file') || fd.get('image')
    if (!file) return json(request, { code: 400, msg: '缺少文件' }, 400)
    buf = await file.arrayBuffer()
    mime = file.type || mime
    name = file.name || name
  } else {
    buf = await request.arrayBuffer()
    if (!buf.byteLength) return json(request, { code: 400, msg: '缺少文件' }, 400)
    mime = ct.split(';')[0] || mime
  }
  if (!/^image\//.test(mime)) return json(request, { code: 400, msg: '仅支持图片' }, 400)
  const vip = (me.row.vip_expire ?? 0) > Date.now()
  const limit = vip ? 10 * 1024 * 1024 : 2 * 1024 * 1024
  if (buf.byteLength > limit)
    return json(
      request,
      { code: 413, msg: vip ? '图片不能超过10MB' : '免费版图片不能超过2MB' },
      413
    )
  const id = id16()
  await env.UPSTASH_KV.put(`img:${id}`, buf, {
    metadata: { mime, name, uid: me.row.id, t: Date.now() }
  })
  return json(request, { code: 200, url: `/api/upload/${id}`, name })
}

export const onRequestOptions = context => json(context.request, {})
