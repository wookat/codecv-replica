// POST /api/translate {content, target} —— 简历整文翻译（对照生产「简历语言翻译」）
// 翻译源用 MyMemory 免费接口（无需 key），配额按天计（KV: tq:<uid>:<yyyymmdd>）
import { json, readBody } from '../_lib.js'
import { currentUserRow } from '../_auth.js'

const LANG_MAP = {
  英文: 'en',
  中文: 'zh-CN',
  日语: 'ja',
  韩语: 'ko',
  法语: 'fr',
  德语: 'de',
  西班牙语: 'es',
  俄语: 'ru'
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

// 纯标记行（分栏/图标/图片/代码围栏等）原样保留，不做翻译
const SKIP_RE = /^\s*(:::|\|?[-: |]+\||```|\$|#+\s*!|!\[|icon:[a-z0-9_-]+\s*$)/i

async function translateLine(line, pair) {
  const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(
    line
  )}&langpair=${encodeURIComponent(pair)}`
  const res = await fetch(url, { headers: { 'User-Agent': 'cv-replica/1.0' } })
  if (!res.ok) throw new Error('translate failed ' + res.status)
  const data = await res.json()
  const text = data?.responseData?.translatedText
  if (!text || /MYMEMORY WARNING|QUERY LENGTH LIMIT/i.test(text)) throw new Error('translate quota')
  return text
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

    // 源语言启发：含 CJK → zh-CN，否则 en
    const src = /[぀-ヿ一-鿿]/.test(content) ? 'zh-CN' : 'en'
    const pair = `${src}|${target}`

    const lines = content.split('\n')
    const out = []
    for (const line of lines) {
      const t = line.trim()
      if (!t || SKIP_RE.test(line) || t.length < 2) {
        out.push(line)
        continue
      }
      // 超长行按句切半翻译再拼接（MyMemory 单请求 ~500 字符）
      if (t.length > 400) {
        const parts = t.match(/[^。；;，,]+[。；;，,]?/g) || [t]
        const translated = []
        for (const part of parts) {
          if (!part.trim()) continue
          translated.push(await translateLine(part.slice(0, 450), pair))
        }
        out.push(translated.join(' '))
      } else {
        out.push(await translateLine(line.slice(0, 450), pair))
      }
    }

    if (env.UPSTASH_KV) {
      const key = quotaKey(uid)
      const used = Number((await env.UPSTASH_KV.get(key)) || 0)
      await env.UPSTASH_KV.put(key, String(used + 1), { expirationTtl: 48 * 3600 })
    }
    return json(request, {
      code: 200,
      data: { content: out.join('\n'), remaining: await remaining(env, uid) }
    })
  }

  return json(request, { code: 405, msg: 'method not allowed' }, 405)
}
