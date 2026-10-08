// AI 助手端点（生产同款 /api/ai/*）：aigc/perf/translate/proofread
// 走 LLM 中转（env.GP_LLM_API_KEY + api.aicdks.com），会员无限次、普通用户扣 user.ai
import { currentUserRow } from '../../_auth.js'

const RELAY = 'https://api.aicdks.com/v1/chat/completions'
const MODEL = 'swe-2-medium'

const json = (d, s = 200) =>
  new Response(JSON.stringify(d), { status: s, headers: { 'Content-Type': 'application/json' } })

async function chat(env, sys, user, maxTokens = 4096) {
  const res = await fetch(RELAY, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${env.GP_LLM_API_KEY}` },
    body: JSON.stringify({
      model: env.AI_MODEL || MODEL,
      max_tokens: maxTokens,
      temperature: 0.7,
      messages: [
        { role: 'system', content: sys },
        { role: 'user', content: user }
      ]
    })
  })
  if (!res.ok) throw new Error(`relay ${res.status}`)
  const data = await res.json()
  return data?.choices?.[0]?.message?.content || ''
}

// 配额：会员(vip_expire>now)无限；普通用户扣 ai 次数
async function consumeQuota(env, cur) {
  const u = cur.row
  if ((u.vip_expire || 0) > Date.now()) return { left: -1 } // -1 = 会员无限
  const ai = u.ai ?? 0
  if (ai <= 0) return { left: 0 }
  await env.DB.prepare('UPDATE users SET ai=ai-1 WHERE id=?').bind(u.id).run()
  return { left: ai - 1 }
}

const MODES = {
  0: '根据用户描述生成一份中文 Markdown 简历内容。结构：# 姓名、## 求职意向、## 教育背景、## 工作/实习经历、## 项目经验、## 技能特长。使用真实专业的表述，经历要点用列表。只输出 Markdown 正文，不要解释。',
  1: '润色用户给出的简历内容：优化表达、量化成果、动词开头、简洁专业，保持原有结构与事实不变。只输出润色后的 Markdown 正文，不要解释。',
  2: '作为资深简历顾问，根据用户的简历内容与目标岗位 JD，给出诊断建议：匹配度分析、缺失关键词、表达改进点、投递建议。用分点小标题组织，中文输出。'
}

export async function onRequest({ request, env }) {
  const url = new URL(request.url)
  const route = url.pathname.replace(/^\/api\/ai\/?/, '')
  if (request.method !== 'POST') return json({ code: 405, message: 'method' }, 405)

  let body = {}
  try {
    body = await request.json()
  } catch {
    return json({ code: 400, message: 'bad json' }, 400)
  }
  const cur = await currentUserRow(env, request, body)
  if (!cur) return json({ code: -1000, message: '未登录' })

  // aigc: {pf,desc,aigcMode,userId} → {code:200,result:{content},aiLeft}
  if (route === 'aigc') {
    const mode = Number(body.aigcMode || 0)
    const sys = MODES[mode] || MODES[0]
    const prompt = [body.pf ? `目标岗位：${body.pf}` : '', `内容：${body.desc || ''}`]
      .filter(Boolean)
      .join('\n')
    try {
      const text = await chat(env, sys, prompt)
      const q = await consumeQuota(env, cur)
      return json({ code: 200, result: { content: text, aiLeft: q.left } })
    } catch (e) {
      return json({ code: 500, message: String(e.message || e) }, 500)
    }
  }

  // translate: {content,target} → {code:200,result:{content}}
  if (route === 'translate') {
    const target = String(body.target || 'English')
    try {
      const text = await chat(
        env,
        `你是专业简历翻译器。把用户给的中文 Markdown 简历完整翻译为${target}。保持 Markdown 结构与标记（#、##、::: 分栏、icon:、加粗）不变，只翻译自然语言文字，人名/公司名用通用写法。只输出翻译后的 Markdown。`,
        String(body.content || ''),
        8192
      )
      const q = await consumeQuota(env, cur)
      return json({ code: 200, result: { content: text, aiLeft: q.left } })
    } catch (e) {
      return json({ code: 500, message: String(e.message || e) }, 500)
    }
  }

  // perf: {content,targetPosition?,userId} → SSE 流式润色（生产同款 /api/ai/perf）
  if (route === 'perf') {
    const q0 = await consumeQuota(env, cur)
    if (q0.left === 0)
      return json({ code: -999, message: '剩余可使用AI次数不足，开通会员可无限制使用' })
    const pos = body.targetPosition ? `，目标岗位：${body.targetPosition}` : ''
    const upstream = await fetch(RELAY, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${env.GP_LLM_API_KEY}`
      },
      body: JSON.stringify({
        model: env.AI_MODEL || MODEL,
        max_tokens: 2048,
        temperature: 0.6,
        stream: true,
        messages: [
          {
            role: 'system',
            content:
              '你是简历润色助手：优化用户给出的简历片段，动词开头、量化成果、简洁专业，保持事实与结构不变。只输出润色后的文本，不要解释、不要代码块。'
          },
          { role: 'user', content: `润色以下内容${pos}：\n${String(body.content || '')}` }
        ]
      })
    })
    if (!upstream.ok || !upstream.body)
      return json({ code: 500, message: `relay ${upstream.status}` }, 500)
    const { readable, writable } = new TransformStream()
    const writer = writable.getWriter()
    const enc = new TextEncoder()
    const dec = new TextDecoder()
    ;(async () => {
      const reader = upstream.body.getReader()
      let buf = ''
      try {
        for (;;) {
          const { done, value } = await reader.read()
          if (done) break
          buf += dec.decode(value, { stream: true })
          const parts = buf.split('\n')
          buf = parts.pop() || ''
          for (const line of parts) {
            const t = line.trim()
            if (!t.startsWith('data:')) continue
            const payload = t.slice(5).trim()
            if (payload === '[DONE]') continue
            try {
              const d = JSON.parse(payload)
              const delta = d?.choices?.[0]?.delta?.content || ''
              if (delta)
                await writer.write(enc.encode(`data: {"text":${JSON.stringify(delta)}}\n\n`))
            } catch {
              /* 片段不完整跳过 */
            }
          }
        }
        await writer.write(enc.encode('data: {"done":true}\n\n'))
      } catch (e) {
        await writer.write(
          enc.encode(`data: {"error":${JSON.stringify(String(e?.message || e))}}\n\n`)
        )
      } finally {
        await writer.close()
      }
    })()
    return new Response(readable, {
      headers: { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache' }
    })
  }

  // proofread: {content} → {code:200,result:{issues:[...]}}
  if (route === 'proofread') {
    try {
      const text = await chat(
        env,
        '你是中文简历错别字与语病检查器。检查用户给的简历文本，只返回 JSON 数组，每项 {"original":"原文片段","suggestion":"修正","reason":"原因","severity":"high或low","type":"错别字|语病|标点|格式","context":"原文上下文(含original)"}。没有可确认的错误就返回 []。只输出 JSON，不要任何解释或代码块标记。',
        String(body.content || '').slice(0, 8000),
        4096
      )
      const m = text.replace(/```json|```/g, '').match(/\[[\s\S]*\]/)
      const issues = m ? JSON.parse(m[0]) : []
      const q = await consumeQuota(env, cur)
      return json({
        code: 200,
        result: { issues, aiLeft: q.left, tier: q.left === -1 ? 'vip' : 'free' }
      })
    } catch (e) {
      return json({ code: 500, message: String(e.message || e) }, 500)
    }
  }

  return json({ code: 404, message: 'no route' }, 404)
}
