// POST /api/translate {content, target} —— 简历整文翻译（对照生产「简历语言翻译」）
// 翻译走 LLM 中转（env.GP_LLM_API_KEY + api.aicdks.com），配额按天计（KV: tq:<uid>:<yyyymmdd>）
import { json, readBody } from '../_lib.js'
import { currentUserRow } from '../_auth.js'

const LANG_MAP = {
  英文: '英语',
  中文: '简体中文',
  日语: '日语',
  韩语: '韩语',
  法语: '法语',
  德语: '德语',
  西班牙语: '西班牙语',
  俄语: '俄语'
}
const DAILY_QUOTA = 3

function quotaKey(uid) {
  const d = new Date(Date.now() + 8 * 3600 * 1000)
  return `tq:${uid}:${d.getUTCFullYear()}${String(d.getUTCMonth() + 1).padStart(2, '0')}${String(
    d.getUTCDate()
  ).padStart(2, '0')}`
}

async function remaining(env, uid) {
  if (!env.UPSTASH_KV) return DAILY_QUOTA
  const used = Number((await env.UPSTASH_KV.get(quotaKey(uid))) || 0)
  return Math.max(0, DAILY_QUOTA - used)
}

async function llmTranslate(env, content, target) {
  const res = await fetch('https://api.aicdks.com/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${env.GP_LLM_API_KEY}` },
    body: JSON.stringify({
      model: env.AI_MODEL || 'hf-deepseek-v3',
      max_tokens: 8192,
      temperature: 0.3,
      messages: [
        {
          role: 'system',
          content: `你是专业简历翻译器。把用户给的 Markdown 简历完整翻译为${target}。保持 Markdown 结构与标记不变（#、##、::: 分栏、icon: 标记、图片语法、加粗、表格），只翻译自然语言文字；人名/公司名/学校名用通用写法或拼音。只输出翻译后的 Markdown 正文，不要解释、不要代码块标记。`
        },
        { role: 'user', content: content.slice(0, 8000) }
      ]
    })
  })
  if (!res.ok) throw new Error('relay ' + res.status)
  const data = await res.json()
  return data?.choices?.[0]?.message?.content || ''
}

export async function onRequest(context) {
  const { request, env } = context
  if (request.method === 'OPTIONS') return json(request, {})
  const auth = await currentUserRow(env, request, {})
  if (!auth) return json(request, { code: 401, msg: '请先登录' })
  const uid = auth.row.id

  if (request.method === 'GET') {
    return json(request, { code: 200, data: { remaining: await remaining(env, uid) } })
  }

  if (request.method === 'POST') {
    const q = await readBody(request)
    const target = LANG_MAP[q.target]
    if (!target) return json(request, { code: 400, msg: '不支持的目标语言' })
    const content = String(q.content || '')
    if (!content.trim()) return json(request, { code: 400, msg: '内容为空' })
    const left = await remaining(env, uid)
    if (left <= 0) return json(request, { code: 429, msg: '今日翻译次数已用完' })

    let translated
    try {
      translated = await llmTranslate(env, content, target)
    } catch (e) {
      return json(request, { code: 500, msg: '翻译服务暂不可用：' + e.message }, 500)
    }
    if (!translated.trim()) return json(request, { code: 500, msg: '翻译结果为空' }, 500)

    if (env.UPSTASH_KV) {
      const key = quotaKey(uid)
      const used = Number((await env.UPSTASH_KV.get(key)) || 0)
      await env.UPSTASH_KV.put(key, String(used + 1), { expirationTtl: 48 * 3600 })
    }
    return json(request, {
      code: 200,
      data: { content: translated, remaining: await remaining(env, uid) }
    })
  }

  return json(request, { code: 405, msg: 'method not allowed' }, 405)
}
