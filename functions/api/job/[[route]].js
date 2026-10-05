// /api/job/page（POST 分页筛选）、/api/job/today（POST 当日新增）——契约对齐 codecvcv.com
import { json, readBody, loadSeed, sub } from '../../_lib.js'

const jobs = (env, request) => loadSeed(env, request, 'jobs.json', [])

export async function onRequest(context) {
  const { request, env } = context
  if (request.method === 'OPTIONS') return json(request, {})
  const url = new URL(request.url)
  const route = url.pathname.split('/').pop()

  if (route === 'page' && request.method === 'POST') {
    const q = await readBody(request)
    const {
      batch,
      channel,
      title,
      company,
      workLocation,
      industry,
      positions,
      current = 1,
      pageSize = 25
    } = q
    const filtered = (await jobs(env, request)).filter(j => {
      if (batch && String(j.graduationYear ?? '') !== String(batch)) return false
      if (channel && j.channel !== channel) return false
      if (!sub(j.title, title)) return false
      if (!sub(j.company, company)) return false
      if (
        workLocation &&
        !sub(j.workLocation, workLocation) &&
        !(j.normalizedWorkLocations || []).some(l => sub(l, workLocation))
      )
        return false
      if (!sub(j.industry, industry)) return false
      if (!sub(j.positions, positions)) return false
      return true
    })
    // 生产序：createTime 倒序，同一时间戳内按入库序（数组倒序）
    const ordered = filtered.map((j, i) => [i, j])
    ordered.sort((a, b) => (b[1].createTime || 0) - (a[1].createTime || 0) || b[0] - a[0])
    const sorted = ordered.map(x => x[1])
    const start = (current - 1) * pageSize
    return json(request, {
      code: 200,
      data: sorted.slice(start, start + pageSize),
      total: filtered.length,
      message: '获取招聘岗位列表成功'
    })
  }

  if (route === 'today' && request.method === 'POST') {
    const all = await jobs(env, request)
    const latest = Math.max(0, ...all.map(j => j.createTime || 0))
    const dayStart = new Date(latest)
    dayStart.setHours(0, 0, 0, 0)
    const n = all.filter(j => (j.createTime || 0) >= dayStart.getTime()).length
    return json(request, { code: 200, data: n, message: '获取当日新增岗位数量成功' })
  }

  return json(request, { msg: 'not found' }, 404)
}
