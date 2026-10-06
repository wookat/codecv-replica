// GET /api/schools —— 学校名列表（个人资料学校字段 autocomplete，prod 需登录）
import { json, loadSeed } from '../_lib.js'
import { currentUserRow } from '../_auth.js'

export async function onRequest(context) {
  const { request, env } = context
  if (request.method === 'OPTIONS') return json(request, {})
  const auth = await currentUserRow(env, request)
  if (!auth) return json(request, { code: -1000, message: '未登录' })
  const data = await loadSeed(env, request, 'schools.json', [])
  return json(request, { code: 200, data, message: '获取成功' })
}
