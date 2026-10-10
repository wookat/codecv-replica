// /api/import/* —— 简历文件导入（生产同款云端 AI 解析）
// parse: multipart file(.pdf/.docx) → VPS /extract 抽文本 → aicdks swe-2 转 CodeCV md 方言
// 配额同 /api/ai：会员无限、普通用户扣 user.ai
import { json } from '../../_lib.js'
import { currentUserRow } from '../../_auth.js'

const RELAY = 'https://api.aicdks.com/v1/chat/completions'
const MODEL = 'swe-2-medium'

const SYS = `你是简历格式转换器。把用户给出的简历原始文本转成 CodeCV Markdown 方言，只输出 Markdown 正文，不要解释、不要代码块围栏。

方言规则：
- 第一行：# 姓名
- 各模块用 ## 标题：求职意向 / 教育背景 / 工作（实习）经历 / 项目经验 / 技能特长 / 自我评价（按原文实际有的来）
- 经历条目要点用 - 无序列表；公司/学校/职位/时间段一行内用 **加粗** 标出关键信息
- 左右分栏信息用 | 分隔的两列写法（如 "**某某大学** | 2020-2024"）
- 表格类内容保留为列表，不要造表格
- 手机号/邮箱/链接保留原文
- 若文本不是简历或无法解析，只输出"NOT_A_RESUME"`

async function llmToMd(env, text) {
  const res = await fetch(RELAY, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${env.GP_LLM_API_KEY}` },
    body: JSON.stringify({
      model: env.AI_MODEL || MODEL,
      max_tokens: 8192,
      temperature: 0.3,
      messages: [
        { role: 'system', content: SYS },
        { role: 'user', content: text }
      ]
    })
  })
  if (!res.ok) throw new Error(`relay ${res.status}`)
  const data = await res.json()
  return (data?.choices?.[0]?.message?.content || '').trim()
}

async function consumeQuota(env, cur) {
  const u = cur.row
  if ((u.vip_expire || 0) > Date.now()) return { left: -1 }
  const ai = u.ai ?? 0
  if (ai <= 0) return { left: 0 }
  await env.DB.prepare('UPDATE users SET ai=ai-1 WHERE id=?').bind(u.id).run()
  return { left: ai - 1 }
}

export async function onRequest(context) {
  const { request, env } = context
  const url = new URL(request.url)
  const route = url.pathname.replace(/^\/api\/import\/?/, '')
  if (route !== 'parse' || request.method !== 'POST')
    return json(request, { code: 404, msg: 'not found' })

  const cur = await currentUserRow(env, request, {})
  if (!cur) return json(request, { code: -1000, message: '请先登录后再导入' })
  if ((cur.row.vip_expire || 0) <= Date.now() && (cur.row.ai ?? 0) <= 0)
    return json(request, { code: 403, message: 'AI 解析次数已用完，开通会员不限次' })

  if (!env.RENDER_URL) return json(request, { code: 503, message: '解析服务未配置' }, 503)

  let file
  try {
    const fd = await request.formData()
    file = fd.get('file')
  } catch {
    return json(request, { code: 400, message: '需要 multipart 上传 file' }, 400)
  }
  if (!file || !file.name) return json(request, { code: 400, message: '缺少文件' }, 400)
  if (!/\.(pdf|docx)$/i.test(file.name))
    return json(request, { code: 400, message: '仅支持 .pdf / .docx 文件解析' }, 400)
  if (file.size > 10 * 1024 * 1024)
    return json(request, { code: 400, message: '单个文件最大 10MB' }, 400)

  // 转发原始字节给 VPS 文本提取端
  const buf = await file.arrayBuffer()
  let bin = ''
  const bytes = new Uint8Array(buf)
  for (let i = 0; i < bytes.length; i += 0x8000)
    bin += String.fromCharCode.apply(null, bytes.subarray(i, i + 0x8000))
  const b64 = btoa(bin)

  const extractUrl = env.RENDER_URL.replace(/\/render\/?$/, '/extract')
  let text = ''
  try {
    const r = await fetch(extractUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: env.RENDER_TOKEN, name: file.name, data: b64 }),
      signal: AbortSignal.timeout(45000)
    })
    const d = await r.json()
    text = (d.text || '').trim()
  } catch (e) {
    return json(request, { code: 502, message: '文件文本提取失败' }, 502)
  }
  if (text.length < 20)
    return json(
      request,
      { code: 422, message: '未能从文件中提取到有效文本，请更换文件或粘贴文本' },
      422
    )
  if (text.length > 30000) text = text.slice(0, 30000)

  let md = ''
  try {
    md = await llmToMd(env, text)
  } catch (e) {
    return json(request, { code: 502, message: `AI 解析失败：${e.message}` }, 502)
  }
  if (!md || /^NOT_A_RESUME/i.test(md))
    return json(request, { code: 422, message: '无法准确解析该文件，请更换文件' }, 422)
  // 脱掉模型可能输出的围栏
  md = md
    .replace(/^```(?:markdown|md)?\s*/i, '')
    .replace(/```\s*$/, '')
    .trim()

  const q = await consumeQuota(env, cur)
  return json(request, { code: 200, data: { md }, aiLeft: q.left, message: '解析成功' })
}
