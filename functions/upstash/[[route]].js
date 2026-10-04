// Upstash REST 兼容层：/upstash/get/<key>、/upstash/set/<key>[/<value>]
// 持久化到 KV 绑定 UPSTASH_KV（部署时用生产热度+导出计数做种子）
import { json } from '../_lib.js'

export async function onRequest(context) {
  const { request, env, params } = context
  const parts = params.route || []
  const [op, key, ...rest] = parts
  const kv = env.UPSTASH_KV
  if (!kv || !op || !key) return json(request, { msg: 'not found' }, 404)

  if (op === 'get') {
    const v = await kv.get(key)
    return json(request, { result: v ?? null })
  }
  if (op === 'set') {
    const val = rest.length ? decodeURIComponent(rest.join('/')) : await request.text()
    await kv.put(key, val)
    return json(request, { result: 'OK' })
  }
  return json(request, { msg: 'not found' }, 404)
}
