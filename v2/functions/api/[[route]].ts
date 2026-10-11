// v2 API — Hono 单 router 收口（设计文档：单一 API 面，治 31 个散落路由的病）
// Pages Functions: /api/v2/* 全部进这一个 Hono app
import { Hono } from 'hono'
import { drizzle } from 'drizzle-orm/d1'
import { eq, and, asc } from 'drizzle-orm'
import { z } from 'zod'
import { pbkdf2, hashPassword, issueToken, tokenUser, bearerToken } from '../_auth'
import { markdownToHTML } from '../_mth'
import { renderSelfContained } from './export'
import * as s from '../schema'
import exportRoute from './export'
import mcpRoute from './mcp'

type Env = {
  Bindings: { DB: D1Database; UPSTASH_KV: KVNamespace }
  Variables: { userId: string }
}
const app = new Hono<Env>().basePath('/api/v2')
const db = (c: any) => drizzle(c.env.DB, { schema: s })
const uid = () => crypto.randomUUID()
const now = () => Date.now()

// ---- auth ----
app.post('/auth/login', async c => {
  const { username, password } = await c.req.json()
  const row = await c.env.DB.prepare('SELECT username, pwd_hash, salt FROM users WHERE username=?').bind(username).first() as any
  if (!row || (await pbkdf2(password, row.salt)) !== row.pwd_hash) return c.json({ error: 'invalid credentials' }, 401)
  return c.json({ token: await issueToken(c.env.UPSTASH_KV, username), username })
})
app.post('/auth/register', async c => {
  const { username, password, inviter } = await c.req.json() as any
  if (!username || !password) return c.json({ error: '用户名或密码不能为空' }, 400)
  const exist = await c.env.DB.prepare('SELECT id FROM users WHERE username=?').bind(username).first()
  if (exist) return c.json({ error: '用户名已被注册' }, 400)
  const { salt, hash } = await hashPassword(password)
  let inv: string | null = null
  if (inviter && inviter !== username) {
    const iu = await c.env.DB.prepare('SELECT id FROM users WHERE username=?').bind(inviter).first()
    if (iu) inv = inviter
  }
  await c.env.DB.prepare('INSERT INTO users (username, pwd_hash, salt, nickname, origin, inviter, created_at) VALUES (?,?,?,?,?,?,?)')
    .bind(username, hash, salt, username, 'web', inv, Date.now()).run()
  return c.json({ token: await issueToken(c.env.UPSTASH_KV, username), username })
})
// GET /thumb/:tpl — 模板缩略图 PNG（KV 缓存 7d）
app.get('/thumb/:tpl', async c => {
  const tpl = c.req.param('tpl')
  const key = 'thumb:' + tpl
  const hit = await c.env.UPSTASH_KV.get(key, 'arrayBuffer')
  if (hit) return new Response(hit, { headers: { 'content-type': 'image/png', 'cache-control': 'public, max-age=86400' } })
  const seed = await c.env.ASSETS.fetch(new URL(`/seeds/tpl/${tpl.replace(/^cv-/,'')}.json`, c.req.url))
  const md = seed.ok ? (await seed.json<any>()).content : ''
  const html = markdownToHTML(md || '## 模板预览')
  const png = await renderSelfContained(c, html, `/css/style_${tpl.replace(/^cv-/, '')}.css`, 'png')
  if (!png) return c.json({ error: 'render 失败', detail: (c as any).__render_err }, 502)
  c.executionCtx.waitUntil(c.env.UPSTASH_KV.put(key, png, { expirationTtl: 7 * 24 * 3600 }))
  return new Response(png.buffer as ArrayBuffer, { headers: { 'content-type': 'image/png', 'cache-control': 'public, max-age=86400' } })
})
// GET /share/:id — 公开只读简历（resume_extra.share_on='1' 才返回）
app.get('/share/:id', async c => {
  const [r] = await db(c).select().from(s.resume).where(eq(s.resume.id, c.req.param('id')))
  if (!r) return c.json({ error: 'not found' }, 404)
  const ex = await db(c).select().from(s.resumeExtra).where(eq(s.resumeExtra.resumeId, r.id))
  if (!ex.find(e => e.fieldKey === 'share_on' && e.valueMd === '1')) return c.json({ error: 'not shared' }, 404)
  return c.json({ title: r.title, templateId: r.templateId, contentMd: r.contentMd })
})
// GET /gallery — 简历广场：已分享简历公开列表（share_on='1'）
app.get('/gallery', async c => {
  const r = await c.env.DB.prepare(`SELECT r.id, r.title, r.template_id AS templateId, r.updated_at
    FROM resume r JOIN resume_extra e ON e.resume_id=r.id
    WHERE e.field_key='share_on' AND e.value_md='1' ORDER BY r.updated_at DESC LIMIT 60`).all<any>()
  return c.json(r.results ?? [])
})
// GET /health — 监控探针（公开）
app.get('/health', async c => {
  let db = false
  try { await c.env.DB.prepare('SELECT 1').first(); db = true } catch {}
  return c.json({ ok: db, service: 'cv-v2', ts: Date.now() }, db ? 200 : 503)
})
// ---- 社区内容生态（公开读）----
app.get('/posts', async c => {
  const r = await c.env.DB.prepare("SELECT _id AS id, title, category, tags, summary, author, created_at FROM posts WHERE deleted=0 AND status='published' ORDER BY created_at DESC LIMIT 50").all<any>()
  return c.json(r.results ?? [])
})
app.get('/posts/:id', async c => {
  const p = await c.env.DB.prepare('SELECT _id AS id, title, content_md, category, tags, author, created_at FROM posts WHERE _id=? AND deleted=0').bind(c.req.param('id')).first<any>()
  if (!p) return c.json({ error: 'not found' }, 404)
  const cmts = await c.env.DB.prepare('SELECT c.id, c.nickname, c.content, c.created_at FROM comments c WHERE c.doc_id=? ORDER BY c.created_at').bind(p.id).all<any>()
  const likes = await c.env.DB.prepare("SELECT COUNT(*) c FROM reactions WHERE target_type='post' AND target_id=? AND kind='like'").bind(p.id).first<any>()
  return c.json({ ...p, comments: cmts.results ?? [], likes: likes?.c ?? 0 })
})
app.get('/mianjing', async c => {
  const r = await c.env.DB.prepare('SELECT id, title, company_name, grade, batch, round, result, school, major, created_at FROM mianjing_submissions ORDER BY created_at DESC LIMIT 50').all<any>()
  return c.json(r.results ?? [])
})
app.post('/auth/logout', async c => {
  const t = bearerToken(c.req.raw)
  if (t) await c.env.UPSTASH_KV.delete(`sess:${t}`)
  return c.json({ ok: true })
})

// 认证闸：以下路由一律要求登录
app.use('*', async (c, next) => {
  const u = await tokenUser(c.env.UPSTASH_KV, bearerToken(c.req.raw))
  if (!u) return c.json({ error: 'unauthorized' }, 401)
  c.set('userId', u)
  await next()
})

// ---- 大简历 ----
app.get('/master', async c =>
  c.json(await db(c).select().from(s.masterResume).where(eq(s.masterResume.userId, c.get('userId')))))
// POST /master/import — 扔一份简历（pdf/docx/md/txt）→ cv-render /extract 抽文本 → LLM 结构化建库
app.post('/master/import', async c => {
  const { name, filename, data } = await c.req.json() as any
  if (!data) return c.json({ error: 'no file' }, 400)
  const extName = (filename || '').toLowerCase().split('.').pop() || ''
  let text = ''
  if (['pdf', 'docx'].includes(extName)) {
    const RENDER_URL = (c.env as any).RENDER_URL || 'https://cvrender.zalize.com/render'
    const extractUrl = RENDER_URL.replace(/\/render$/, '') + '/extract'
    const ext = await fetch(extractUrl, { method: 'POST', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ token: (c.env as any).RENDER_TOKEN, name: filename, data }) })
    if (!ext.ok) return c.json({ error: 'extract 失败 ' + ext.status }, 502)
    text = (await ext.json() as any).text || ''
  } else {
    // txt/md 直接解码
    const bin = atob(data)
    const bytes = new Uint8Array(bin.length)
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i)
    text = new TextDecoder().decode(bytes)
  }
  if (!text || text.length < 20) return c.json({ error: '提取不到文本' }, 422)

  // LLM 结构化 → 条目+版本 JSON
  const prompt = `把下面简历文本结构化成 JSON：{"items":[{"section":"education|internship|project|award|skill|selfeval|other","title":"条目标题","variants":[{"label":"默认","contentMd":"markdown 内容，小节用 ## 开头、列表用 -、加粗 **"}]}]}。section 只能取上述枚举值；同一条目如果明显可区分前后端侧重点可给两个版本。只返回 JSON。简历文本：\n` + text.slice(0, 12000)
  const r = await fetch('https://api.aicdks.com/v1/chat/completions', {
    method: 'POST', headers: { 'content-type': 'application/json', authorization: `Bearer ${(c.env as any).GP_LLM_API_KEY}` },
    body: JSON.stringify({ model: 'swe-2-medium', messages: [{ role: 'user', content: prompt }], temperature: 0.2 }) })
  if (!r.ok) return c.json({ error: 'LLM 失败 ' + r.status }, 502)
  const aiText = (await r.json() as any).choices?.[0]?.message?.content || ''
  const jm = aiText.match(/\{[\s\S]*\}/)
  if (!jm) return c.json({ error: 'LLM 未返回 JSON', raw: aiText.slice(0, 200) }, 502)
  let items: any[] = []
  try { items = JSON.parse(jm[0]).items || [] } catch { return c.json({ error: 'LLM JSON 解析失败' }, 502) }

  const now = () => Date.now()
  const mid = uid()
  await db(c).insert(s.masterResume).values({ id: mid, userId: c.get('userId'), name: name || filename || '导入简历', createdAt: now(), updatedAt: now() })
  let n = 0
  for (const [i, it] of items.entries()) {
    const iid = uid()
    await db(c).insert(s.resumeItem).values({ id: iid, masterId: mid, section: it.section || 'other', title: it.title || '条目', sort: i, createdAt: now(), updatedAt: now() })
    for (const v of (it.variants || []))
      await db(c).insert(s.itemVariant).values({ id: uid(), itemId: iid, label: v.label || '默认', contentMd: v.contentMd || '', createdAt: now() })
    n++
  }
  return c.json({ id: mid, items: n })
})

app.post('/master', async c => {
  const { name = '我的大简历' } = await c.req.json()
  const row = { id: uid(), userId: c.get('userId'), name, createdAt: now(), updatedAt: now() }
  await db(c).insert(s.masterResume).values(row)
  return c.json(row, 201)
})
app.patch('/master/:id', async c => {
  const { name } = await c.req.json()
  await db(c).update(s.masterResume).set({ name, updatedAt: now() })
    .where(and(eq(s.masterResume.id, c.req.param('id')), eq(s.masterResume.userId, c.get('userId'))))
  return c.json({ ok: true })
})

// ---- 条目 ----
const ItemBody = z.object({ section: z.string(), title: z.string(), sort: z.number().optional(), meta: z.record(z.any()).optional() })
app.get('/master/:id/items', async c =>
  c.json(await db(c).select().from(s.resumeItem).where(eq(s.resumeItem.masterId, c.req.param('id'))).orderBy(asc(s.resumeItem.sort))))
app.post('/master/:id/items', async c => {
  const b = ItemBody.parse(await c.req.json())
  const row = { id: uid(), masterId: c.req.param('id'), section: b.section, title: b.title, sort: b.sort ?? 0, metaJson: JSON.stringify(b.meta ?? {}), createdAt: now(), updatedAt: now() }
  await db(c).insert(s.resumeItem).values(row)
  return c.json(row, 201)
})
app.patch('/items/:id', async c => {
  const b = ItemBody.partial().parse(await c.req.json())
  const set: any = { updatedAt: now() }
  if (b.section !== undefined) set.section = b.section
  if (b.title !== undefined) set.title = b.title
  if (b.sort !== undefined) set.sort = b.sort
  if (b.meta !== undefined) set.metaJson = JSON.stringify(b.meta)
  await db(c).update(s.resumeItem).set(set).where(eq(s.resumeItem.id, c.req.param('id')))
  return c.json({ ok: true })
})
app.delete('/items/:id', async c => {
  await db(c).delete(s.resumeItem).where(eq(s.resumeItem.id, c.req.param('id')))
  return c.json({ ok: true })
})

// ---- 版本 ----
const VariantBody = z.object({ label: z.string().default('默认'), contentMd: z.string() })
app.get('/items/:id/variants', async c =>
  c.json(await db(c).select().from(s.itemVariant).where(eq(s.itemVariant.itemId, c.req.param('id')))))
app.post('/items/:id/variants', async c => {
  const b = VariantBody.parse(await c.req.json())
  const row = { id: uid(), itemId: c.req.param('id'), label: b.label, contentMd: b.contentMd, createdAt: now() }
  await db(c).insert(s.itemVariant).values(row)
  return c.json(row, 201)
})
app.patch('/variants/:id', async c => {
  const b = VariantBody.partial().parse(await c.req.json())
  await db(c).update(s.itemVariant).set(b).where(eq(s.itemVariant.id, c.req.param('id')))
  return c.json({ ok: true })
})
app.delete('/variants/:id', async c => {
  await db(c).delete(s.itemVariant).where(eq(s.itemVariant.id, c.req.param('id')))
  return c.json({ ok: true })
})

// ---- 简历 ----
const ResumeBody = z.object({ masterId: z.string().optional(), templateId: z.string(), title: z.string().optional(), targetJd: z.string().optional(), contentMd: z.string().optional() })
app.get('/resumes', async c =>
  c.json(await db(c).select().from(s.resume).where(eq(s.resume.userId, c.get('userId')))))
app.post('/resumes', async c => {
  {
    const u = await meRow(c)
    const t = u ? tier(u) : null
    const quota = t ? t.cv : 1
    if (quota !== -1) {
      const cnt = await c.env.DB.prepare('SELECT COUNT(*) c FROM resume WHERE user_id=?').bind(c.get('userId')).first<any>()
      if ((cnt?.c ?? 0) >= quota) return c.json({ error: `简历份数已达上限（${quota}），升级会员可建更多`, code: 'quota' }, 403)
    }
  }
  const b = ResumeBody.parse(await c.req.json())
  const row = { id: uid(), userId: c.get('userId'), masterId: b.masterId ?? null, templateId: b.templateId, title: b.title ?? '', targetJd: b.targetJd ?? '', createdAt: now(), updatedAt: now() }
  await db(c).insert(s.resume).values(row)
  return c.json(row, 201)
})
app.get('/resumes/:id', async c => {
  const [r] = await db(c).select().from(s.resume).where(eq(s.resume.id, c.req.param('id')))
  if (!r) return c.json({ error: 'not found' }, 404)
  const sel = await db(c).select().from(s.resumeSelection).where(eq(s.resumeSelection.resumeId, r.id)).orderBy(asc(s.resumeSelection.ord))
  const extra = await db(c).select().from(s.resumeExtra).where(eq(s.resumeExtra.resumeId, r.id))
  return c.json({ ...r, selections: sel, extras: extra })
})
app.patch('/resumes/:id', async c => {
  const b = ResumeBody.partial().parse(await c.req.json())
  await db(c).update(s.resume).set({ ...b, updatedAt: now() }).where(and(eq(s.resume.id, c.req.param('id')), eq(s.resume.userId, c.get('userId'))))
  return c.json({ ok: true })
})
app.delete('/resumes/:id', async c => {
  await db(c).delete(s.resume).where(and(eq(s.resume.id, c.req.param('id')), eq(s.resume.userId, c.get('userId'))))
  return c.json({ ok: true })
})

// ---- 选取清单（整组覆盖写）----
app.put('/resumes/:id/selections', async c => {
  const list = z.array(z.object({ itemId: z.string(), variantId: z.string().nullable().optional(), ord: z.number(), overrides: z.record(z.any()).optional() })).parse(await c.req.json())
  const rid = c.req.param('id')
  await db(c).delete(s.resumeSelection).where(eq(s.resumeSelection.resumeId, rid))
  for (const it of list)
    await db(c).insert(s.resumeSelection).values({ resumeId: rid, itemId: it.itemId, variantId: it.variantId ?? null, ord: it.ord, overridesJson: JSON.stringify(it.overrides ?? {}) })
  return c.json({ ok: true })
})

// ---- 模板补充字段 ----
// POST /master/chat — AI 对话式建库：访谈官多轮收集→输出结构化条目
const CHAT_SYS = `你是 CodeCV 简历建库访谈官。目标：通过对话收集用户的教育背景、实习/工作经历、项目、奖项、技能，建大简历条目库。
规则：
1. 每轮只问一个问题，简短友好；基于已答信息追问关键细节（时间/职责/成果数据/技术栈）；3-6 轮内完成。
2. 信息足够（教育+至少2段经历+技能）时输出：先一行 "DONE"，再输出 JSON：
{"items":[{"section":"education|internship|project|award|skill|selfeval","title":"条目标题","variants":[{"label":"版本名","contentMd":"## 标题\n- 要点（markdown，加粗 ** 强调）"}]}]}
3. 同一经历若可区分侧重（偏前端/偏后端/偏算法/偏管理），给 2 个 variant，label 写明侧重。
4. 信息不足时只输出下一个问题，不要输出 DONE。`
app.post('/master/chat', async c => {
  const { messages } = await c.req.json() as any
  if (!Array.isArray(messages)) return c.json({ error: 'missing messages' }, 400)
  const r = await fetch('https://api.aicdks.com/v1/chat/completions', {
    method: 'POST', headers: { 'content-type': 'application/json', authorization: `Bearer ${(c.env as any).GP_LLM_API_KEY}` },
    body: JSON.stringify({ model: 'swe-2-medium', temperature: 0.4,
      messages: [{ role: 'system', content: CHAT_SYS }, ...messages.slice(-20).map((m: any) => ({ role: m.role === 'assistant' ? 'assistant' : 'user', content: String(m.content).slice(0, 3000) }))] }) })
  if (!r.ok) { logEvent(c, 'ai_fail', 'chat ' + r.status); return c.json({ error: 'LLM ' + r.status }, 502) }
  const out = (await r.json() as any).choices?.[0]?.message?.content || ''
  let items: any[] | null = null
  const jm = out.match(/\{[\s\S]*"items"[\s\S]*\}/)
  if (out.includes('DONE') && jm) { try { items = JSON.parse(jm[0]).items || null } catch { items = null } }
  const reply = out.split('DONE')[0].trim() || (items ? '已整理完成，可一键入库。' : out)
  return c.json({ reply, items })
})
// POST /jd/select — 页面端按 JD 智能选取：LLM 从大简历挑 item×variant
app.post('/jd/select', async c => {
  const { masterId, jd } = await c.req.json() as any
  if (!masterId || !jd) return c.json({ error: 'missing masterId/jd' }, 400)
  const items = await db(c).select().from(s.resumeItem).where(eq(s.resumeItem.masterId, masterId)).orderBy(asc(s.resumeItem.sort))
  if (!items.length) return c.json({ error: '大简历为空，先建条目' }, 400)
  const pool: any[] = []
  for (const it of items) {
    const vs = await db(c).select().from(s.itemVariant).where(eq(s.itemVariant.itemId, it.id))
    pool.push({ itemId: it.id, section: it.section, title: it.title, variants: vs.map(v => ({ variantId: v.id, label: v.label, preview: v.contentMd.slice(0, 200) })) })
  }
  const prompt = `你是求职简历顾问。下面是一个候选人的大简历条目池（每条含多个版本写法）和目标岗位 JD。
请为该岗位挑选最合适的条目与版本，输出严格 JSON：{"selections":[{"itemId":"...","variantId":"...","reason":"一句话理由"}]}，按简历出现顺序排列，只从给出的 id 中选，最多 10 条。
JD：${jd.slice(0, 2000)}
条目池：${JSON.stringify(pool).slice(0, 14000)}`
  const r = await fetch('https://api.aicdks.com/v1/chat/completions', {
    method: 'POST', headers: { 'content-type': 'application/json', authorization: `Bearer ${(c.env as any).GP_LLM_API_KEY}` },
    body: JSON.stringify({ model: 'swe-2-medium', messages: [{ role: 'user', content: prompt }], temperature: 0.2 }) })
  if (!r.ok) { logEvent(c, 'ai_fail', 'jdselect ' + r.status); return c.json({ error: 'LLM ' + r.status }, 502) }
  const out = (await r.json() as any).choices?.[0]?.message?.content || ''
  const jm = out.match(/\{[\s\S]*\}/)
  let picks: any[] = []
  try { picks = JSON.parse(jm?.[0] || '{}').selections || [] } catch { return c.json({ error: 'LLM JSON 解析失败' }, 502) }
  const vIds = new Map(pool.flatMap(p => p.variants.map((v: any) => [v.variantId, p.itemId])))
  const selections = picks.filter(p => vIds.get(p.variantId) === p.itemId)
    .map((p, i) => ({ itemId: p.itemId, variantId: p.variantId, ord: i, reason: String(p.reason || '') }))
  return c.json({ selections })
})
// POST /jd/gap — JD 差距报告：大简历 vs JD 缺什么、怎么补
app.post('/jd/gap', async c => {
  const { masterId, jd } = await c.req.json() as any
  if (!masterId || !jd) return c.json({ error: 'missing masterId/jd' }, 400)
  const items = await db(c).select().from(s.resumeItem).where(eq(s.resumeItem.masterId, masterId)).orderBy(asc(s.resumeItem.sort))
  const pool: any[] = []
  for (const it of items) {
    const vs = await db(c).select().from(s.itemVariant).where(eq(s.itemVariant.itemId, it.id))
    pool.push({ section: it.section, title: it.title, previews: vs.map(v => v.contentMd.slice(0, 120)) })
  }
  const prompt = `你是求职顾问。对照候选人「大简历素材库」和目标「岗位 JD」，输出差距分析报告，markdown 格式：
## 匹配现状
- 已覆盖的 JD 要点（最多5条，各一行）
## 关键缺口
- JD 要求但素材库没有的（每条注明：缺口 + 建议补法，如「补一段xx经历」或「在xx条目里补xx细节」）
## 改写建议
- 现有素材如何向该 JD 靠拢表达（最多3条）
大简历素材库：${JSON.stringify(pool).slice(0, 10000) || '（空）'}
岗位 JD：${jd.slice(0, 2000)}`
  const r = await fetch('https://api.aicdks.com/v1/chat/completions', {
    method: 'POST', headers: { 'content-type': 'application/json', authorization: `Bearer ${(c.env as any).GP_LLM_API_KEY}` },
    body: JSON.stringify({ model: 'swe-2-medium', messages: [{ role: 'user', content: prompt }], temperature: 0.3 }) })
  if (!r.ok) { logEvent(c, 'ai_fail', 'jdgap ' + r.status); return c.json({ error: 'LLM ' + r.status }, 502) }
  return c.json({ report: (await r.json() as any).choices?.[0]?.message?.content || '' })
})
// POST /ai — 站内 AI：生成/润色/校对/翻译（aicdks swe-2-medium 中转）
app.post('/ai', async c => {
  const { action, text, jd } = await c.req.json() as any
  const prompts: Record<string, string> = {
    perf: `润色下面这段简历内容，使其更专业、有结果导向（保留 markdown 格式，只返回润色后文本）：\n${text}`,
    gen: `根据下面信息写一段简历 markdown（小节 ##、要点 -、加粗 **）：\n${text}${jd ? `\n目标岗位：${jd}` : ''}`,
    proof: `校对下面简历文本的错别字与语病，返回修正后的文本（保留 markdown 格式）：\n${text}`,
    score: `你是简历评估专家。给下面这份简历打分并输出：
总分：X/100
分项：内容完整度 X/30、岗位匹配 X/25、表达质量 X/25、格式规范 X/20
Top3 问题（各一行，指出具体位置）：
简历文本：
${text}`,
    translate: `把下面简历内容翻译成${(jd || '英文')}（保留 markdown 格式）：\n${text}`,
    fix: `你是简历修改专家。下面「评分意见」和「简历文本」，请按意见逐项修复，返回修复后的完整简历 markdown（保留格式）：
评分意见：${jd || '整体提升'}
简历文本：\n${text}`,
  }
  const prompt = prompts[action]
  if (!prompt) return c.json({ error: 'unknown action' }, 400)
  {
    const u = await meRow(c)
    if (!tier(u)) {
      if (!u || Number(u.ai) <= 0) return c.json({ error: 'AI 次数已用完，开通会员无限使用', code: 'quota' }, 403)
      await c.env.DB.prepare('UPDATE users SET ai=ai-1 WHERE id=?').bind(u.id).run()
    }
  }
  const r = await fetch('https://api.aicdks.com/v1/chat/completions', {
    method: 'POST', headers: { 'content-type': 'application/json', authorization: `Bearer ${(c.env as any).GP_LLM_API_KEY}` },
    body: JSON.stringify({ model: 'swe-2-medium', messages: [{ role: 'user', content: prompt }], temperature: 0.3 }) })
  if (!r.ok) { logEvent(c, 'ai_fail', 'LLM ' + r.status); return c.json({ error: 'LLM ' + r.status }, 502) }
  const out = (await r.json() as any).choices?.[0]?.message?.content || ''
  return c.json({ text: out })
})

// POST /migrate/v1 — 把当前用户在 v1 老站的简历（resumes 表）搬入 v2 resume
// 模板收藏：GET /favorites → [tplId]，PUT /favorites {tplId,on}
app.get('/favorites', async c => {
  const u = await c.env.DB.prepare('SELECT id FROM users WHERE username=?').bind(c.get('userId')).first<any>()
  const r = await c.env.DB.prepare('SELECT tpl_type AS template_id FROM tpl_favorites WHERE user_id=?').bind(u?.id ?? -1).all<any>()
  return c.json((r.results ?? []).map(x => x.template_id))
})
app.put('/favorites', async c => {
  const { tplId, on } = await c.req.json() as any
  const u = await c.env.DB.prepare('SELECT id FROM users WHERE username=?').bind(c.get('userId')).first<any>()
  if (!u) return c.json({ error: 'no user' }, 404)
  if (on) await c.env.DB.prepare('INSERT OR IGNORE INTO tpl_favorites (user_id, tpl_type, created_at) VALUES (?,?,?)').bind(u.id, tplId, Date.now()).run()
  else await c.env.DB.prepare('DELETE FROM tpl_favorites WHERE user_id=? AND tpl_type=?').bind(u.id, tplId).run()
  return c.json({ ok: true })
})

app.post('/migrate/v1', async c => {
  const uname = c.get('userId')
  const u = await c.env.DB.prepare('SELECT id FROM users WHERE username=?').bind(uname).first<any>()
  if (!u) return c.json({ error: 'user not found' }, 404)
  const rows = await c.env.DB.prepare('SELECT id, name, md, style, updated_at FROM resumes WHERE user_id=?').bind(u.id).all<any>()
  let n = 0
  for (const r of rows.results ?? []) {
    const exist = await c.env.DB.prepare('SELECT id FROM resume WHERE user_id=? AND title=? AND content_md=?')
      .bind(uname, r.name || 'v1 简历', r.md || '').first()
    if (exist) continue
    await db(c).insert(s.resume).values({
      id: uid(), userId: uname, templateId: String(r.style || 'cv-1').replace(/^(?!cv-)/, 'cv-'),
      title: r.name || 'v1 简历', contentMd: r.md || '', createdAt: Date.now(), updatedAt: r.updated_at || Date.now(),
    })
    n++
  }
  return c.json({ migrated: n, total: (rows.results ?? []).length })
})

// ---- 会员/订单（v1 语义对齐：档位配额 + 模拟支付 + 兑换码 + 邀请 10% 返佣）----
const VIP_TIERS: Record<string, { days: number; cv: number; uploadMB: number }> = {
  '月度会员': { days: 30, cv: 4, uploadMB: 2 },
  '季度会员': { days: 90, cv: 5, uploadMB: 2 },
  '年度会员': { days: 365, cv: 15, uploadMB: 2 },
  '终身会员': { days: 36500, cv: -1, uploadMB: 10 },
}
const PLANS: Record<string, number> = { '月度会员': 1990, '季度会员': 3990, '年度会员': 9990, '终身会员': 19900 } // 分
// 事件落库（监控告警：失败事件写 ops_events，admin/stats 面板展示）
const logEvent = (c: any, kind: string, detail: string, user?: string) => {
  try { c.executionCtx?.waitUntil(
    c.env.DB.prepare('INSERT INTO ops_events (kind, detail, username, created_at) VALUES (?,?,?,?)')
      .bind(kind, String(detail).slice(0, 500), user || c.get?.('userId') || '', Date.now()).run()) } catch {}
}
const meRow = async (c: any) =>
  c.env.DB.prepare('SELECT id, vip_expire, vip_plan, ai, inviter FROM users WHERE username=?').bind(c.get('userId')).first<any>()
const tier = (u: any) => (Number(u?.vip_expire) > Date.now() ? (VIP_TIERS[u?.vip_plan] || VIP_TIERS['月度会员']) : null)

app.get('/me', async c => {
  const u = await meRow(c)
  if (!u) return c.json({ error: 'no user' }, 404)
  const t = tier(u)
  const cnt = await c.env.DB.prepare('SELECT COUNT(*) c FROM resume WHERE user_id=?').bind(c.get('userId')).first<any>()
  const today = new Date().toISOString().slice(0, 10)
  const ck = await c.env.DB.prepare('SELECT day FROM checkins WHERE user_id=? ORDER BY day DESC LIMIT 60').bind(u.id).all<any>()
  let streak = 0
  for (let i = 0; ; i++) {
    const d = new Date(Date.now() - i * 864e5).toISOString().slice(0, 10)
    if ((ck.results ?? []).some(x => x.day === d)) streak++; else break
  }
  return c.json({ username: c.get('userId'), vipExpire: u.vip_expire, vipPlan: u.vip_plan, ai: u.ai,
    member: t ? { ...t, plan: u.vip_plan } : null, resumeCount: cnt?.c ?? 0, cvQuota: t ? t.cv : 1,
    checkedToday: (ck.results ?? []).some(x => x.day === today), streak })
})
app.get('/orders', async c => {
  const u = await meRow(c)
  const r = await c.env.DB.prepare('SELECT order_no AS orderNo, plan, amount, status, created_at, paid_at FROM orders WHERE user_id=? ORDER BY created_at DESC LIMIT 100').bind(u.id).all<any>()
  return c.json(r.results ?? [])
})
app.post('/orders', async c => {
  const u = await meRow(c)
  const { plan } = await c.req.json() as any
  if (!PLANS[plan]) return c.json({ error: '档位不存在' }, 400)
  const orderNo = `CV${Date.now()}${Math.floor(Math.random() * 9000 + 1000)}`
  await c.env.DB.prepare('INSERT INTO orders (user_id, order_no, plan, amount, status, created_at) VALUES (?,?,?,?,?,?)')
    .bind(u.id, orderNo, plan, PLANS[plan], 'pending', Date.now()).run()
  return c.json({ orderNo, plan, amount: PLANS[plan] }, 201)
})
app.post('/orders/:no/pay', async c => {
  const u = await meRow(c)
  const no = c.req.param('no')
  const r = await c.env.DB.prepare("UPDATE orders SET status='paid', paid_at=? WHERE order_no=? AND user_id=? AND status='pending'")
    .bind(Date.now(), no, u.id).run()
  if (!r.meta.changes) return c.json({ error: '订单不存在或已支付' }, 400)
  const t = VIP_TIERS[(await c.env.DB.prepare('SELECT plan FROM orders WHERE order_no=?').bind(no).first<any>())?.plan] 
  if (t) {
    const base = Math.max(Date.now(), Number(u.vip_expire) || 0)
    await c.env.DB.prepare('UPDATE users SET vip_expire=?, vip_plan=? WHERE id=?')
      .bind(base + t.days * 86400e3, (await c.env.DB.prepare('SELECT plan FROM orders WHERE order_no=?').bind(no).first<any>()).plan, u.id).run()
  }
  // 邀请返佣：首笔已支付订单给邀请人 10%
  const paidCount = await c.env.DB.prepare("SELECT COUNT(*) c FROM orders WHERE user_id=? AND status='paid'").bind(u.id).first<any>()
  if (paidCount?.c === 1 && u.inviter) {
    const inv = await c.env.DB.prepare('SELECT id FROM users WHERE username=?').bind(u.inviter).first<any>()
    const ord = await c.env.DB.prepare('SELECT amount FROM orders WHERE order_no=?').bind(no).first<any>()
    if (inv && ord) await c.env.DB.prepare('INSERT INTO invites (inviter_id, invitee_id, order_no, commission, created_at) VALUES (?,?,?,?,?)')
      .bind(inv.id, u.id, no, Math.round(ord.amount * 0.1), Date.now()).run()
  }
  return c.json({ ok: true })
})
app.post('/redeem', async c => {
  const u = await meRow(c)
  const { code } = await c.req.json() as any
  const rc = await c.env.DB.prepare('SELECT code, days, used_by FROM redeem_codes WHERE code=?').bind(code).first<any>()
  if (!rc || rc.used_by) return c.json({ error: '兑换码无效或已使用' }, 400)
  await c.env.DB.prepare('UPDATE redeem_codes SET used_by=?, used_at=? WHERE code=?').bind(u.id, Date.now(), code).run()
  const base = Math.max(Date.now(), Number(u.vip_expire) || 0)
  await c.env.DB.prepare('UPDATE users SET vip_expire=?, vip_plan=? WHERE id=?')
    .bind(base + rc.days * 86400e3, rc.days >= 36500 ? '终身会员' : rc.days >= 365 ? '年度会员' : rc.days >= 90 ? '季度会员' : '月度会员', u.id).run()
  return c.json({ ok: true, days: rc.days })
})
// ---- admin 后台（is_admin=1 鉴权）----
const needAdmin = async (c: any) => {
  const u = await c.env.DB.prepare('SELECT id, is_admin FROM users WHERE username=?').bind(c.get('userId')).first<any>()
  return u?.is_admin === 1 ? u : null
}
app.get('/admin/stats', async c => {
  if (!await needAdmin(c)) return c.json({ error: 'forbidden' }, 403)
  const q = (sql: string) => c.env.DB.prepare(sql).first<any>()
  const [users, members, orders, paid, revenue, resumes, masters] = await Promise.all([
    q('SELECT COUNT(*) c FROM users'),
    q("SELECT COUNT(*) c FROM users WHERE vip_expire > " + Date.now()),
    q('SELECT COUNT(*) c FROM orders'),
    q("SELECT COUNT(*) c FROM orders WHERE status='paid'"),
    q("SELECT COALESCE(SUM(amount),0) s FROM orders WHERE status='paid'"),
    q('SELECT COUNT(*) c FROM resume'),
    q('SELECT COUNT(*) c FROM master_resume'),
  ])
  return c.json({ users: users.c, members: members.c, orders: orders.c, paid: paid.c,
    revenue: revenue.s, resumes: resumes.c, masters: masters.c })
})
app.get('/admin/users', async c => {
  if (!await needAdmin(c)) return c.json({ error: 'forbidden' }, 403)
  const r = await c.env.DB.prepare('SELECT id, username, nickname, vip_expire, vip_plan, ai, is_admin, banned, created_at FROM users ORDER BY created_at DESC LIMIT 200').all<any>()
  return c.json(r.results ?? [])
})
app.patch('/admin/users/:id', async c => {
  if (!await needAdmin(c)) return c.json({ error: 'forbidden' }, 403)
  const b = await c.req.json() as any
  const fields: string[] = []; const vals: any[] = []
  for (const k of ['vip_expire', 'vip_plan', 'ai', 'banned', 'is_admin'])
    if (b[k] !== undefined) { fields.push(`${k}=?`); vals.push(b[k]) }
  if (!fields.length) return c.json({ error: 'nothing' }, 400)
  vals.push(c.req.param('id'))
  await c.env.DB.prepare(`UPDATE users SET ${fields.join(',')} WHERE id=?`).bind(...vals).run()
  return c.json({ ok: true })
})
app.get('/admin/orders', async c => {
  if (!await needAdmin(c)) return c.json({ error: 'forbidden' }, 403)
  const r = await c.env.DB.prepare('SELECT o.order_no AS orderNo, u.username, o.plan, o.amount, o.status, o.created_at FROM orders o JOIN users u ON u.id=o.user_id ORDER BY o.created_at DESC LIMIT 200').all<any>()
  return c.json(r.results ?? [])
})
app.get('/admin/events', async c => {
  if (!await needAdmin(c)) return c.json({ error: 'forbidden' }, 403)
  const r = await c.env.DB.prepare('SELECT kind, detail, username, created_at FROM ops_events ORDER BY created_at DESC LIMIT 50').all<any>()
  return c.json(r.results ?? [])
})
app.post('/admin/redeem', async c => {
  if (!await needAdmin(c)) return c.json({ error: 'forbidden' }, 403)
  const { days, count = 1 } = await c.req.json() as any
  if (!days || days <= 0) return c.json({ error: 'days required' }, 400)
  const codes: string[] = []
  for (let i = 0; i < Math.min(count, 100); i++) {
    const code = 'CV' + [...crypto.getRandomValues(new Uint8Array(6))].map(b => 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'[b % 32]).join('')
    await c.env.DB.prepare('INSERT INTO redeem_codes (code, days) VALUES (?,?)').bind(code, days).run()
    codes.push(code)
  }
  return c.json({ codes })
})
app.post('/posts/:id/comments', async c => {
  const { content } = await c.req.json() as any
  if (!content?.trim()) return c.json({ error: 'empty' }, 400)
  const u = await meRow(c)
  await c.env.DB.prepare('INSERT INTO comments (doc_id, user_id, nickname, content, created_at) VALUES (?,?,?,?,?)')
    .bind(c.req.param('id'), u.id, c.get('userId'), content.trim(), Date.now()).run()
  return c.json({ ok: true }, 201)
})
app.post('/posts/:id/like', async c => {
  const u = await meRow(c)
  const pid = c.req.param('id')
  const ex = await c.env.DB.prepare("SELECT id FROM reactions WHERE user_id=? AND target_type='post' AND target_id=? AND kind='like'").bind(u.id, pid).first<any>()
  if (ex) {
    await c.env.DB.prepare('DELETE FROM reactions WHERE id=?').bind(ex.id).run()
    return c.json({ liked: false })
  }
  await c.env.DB.prepare('INSERT INTO reactions (user_id, target_type, target_id, kind, created_at) VALUES (?,?,?,?,?)')
    .bind(u.id, 'post', pid, 'like', Date.now()).run()
  return c.json({ liked: true })
})
app.post('/mianjing', async c => {
  const u = await meRow(c)
  const b = await c.req.json() as any
  await c.env.DB.prepare(`INSERT INTO mianjing_submissions (user_id, title, company_name, grade, batch, round, result, school, major, anonymous, content_md, created_at)
    VALUES (?,?,?,?,?,?,?,?,?,?,?,?)`)
    .bind(u.id, b.title || '', b.company_name || '', b.grade || '', b.batch || '', b.round || '', b.result || '', b.school || '', b.major || '', b.anonymous ? 1 : 0, b.content_md || b.content || '', Date.now()).run()
  return c.json({ ok: true }, 201)
})
// ---- 长尾：schools 字典 / 邀请记录 / 投递进度 ----
app.get('/schools', async c => {
  const r = await c.env.ASSETS.fetch(new URL('/seeds/schools.json', c.req.url))
  return new Response(r.body, { headers: { 'content-type': 'application/json' } })
})
// POST /checkin — 每日签到：免费用户 +3 AI 次数，连签记录 streak
app.post('/checkin', async c => {
  const u = await meRow(c)
  const day = new Date().toISOString().slice(0, 10)
  const r = await c.env.DB.prepare('INSERT OR IGNORE INTO checkins (user_id, day, created_at) VALUES (?,?,?)').bind(u.id, day, Date.now()).run()
  const first = (r.meta?.changes ?? 0) > 0
  if (first && !tier(u)) await c.env.DB.prepare('UPDATE users SET ai=ai+3 WHERE id=?').bind(u.id).run()
  const days = await c.env.DB.prepare('SELECT day FROM checkins WHERE user_id=? ORDER BY day DESC LIMIT 60').bind(u.id).all<any>()
  let streak = 0
  for (let i = 0; ; i++) {
    const d = new Date(Date.now() - i * 864e5).toISOString().slice(0, 10)
    if ((days.results ?? []).some(x => x.day === d)) streak++
    else break
  }
  const me = await meRow(c)
  return c.json({ ok: true, first, ai: me?.ai ?? 0, streak })
})
app.get('/invites', async c => {
  const u = await meRow(c)
  const r = await c.env.DB.prepare(`SELECT i.order_no AS orderNo, i.commission, i.settle_status AS settleStatus, i.created_at, u.username AS invitee
    FROM invites i JOIN users u ON u.id=i.invitee_id WHERE i.inviter_id=? ORDER BY i.created_at DESC LIMIT 100`).bind(u.id).all<any>()
  const total = await c.env.DB.prepare('SELECT COALESCE(SUM(commission),0) s FROM invites WHERE inviter_id=?').bind(u.id).first<any>()
  return c.json({ records: r.results ?? [], total: total?.s ?? 0 })
})
app.get('/progress', async c => {
  const u = await meRow(c)
  const r = await c.env.DB.prepare('SELECT id, name, post, work_location AS workLocation, status, channel, link, mark, update_time FROM progress WHERE user_id=? ORDER BY update_time DESC').bind(u.id).all<any>()
  return c.json(r.results ?? [])
})
app.post('/progress', async c => {
  const u = await meRow(c)
  const b = await c.req.json() as any
  const now = Date.now()
  const r = await c.env.DB.prepare(`INSERT INTO progress (user_id, name, post, work_location, status, channel, link, mark, snapshot, post_time, update_time, create_time)
    VALUES (?,?,?,?,?,?,?,?,?,?,?,?)`)
    .bind(u.id, b.name || '', b.post || '', b.workLocation || '', b.status || '已投递', b.channel || '', b.link || '', b.mark || '', '{}', now, now, now).run()
  const pid = r.meta.last_row_id
  await c.env.DB.prepare('INSERT INTO progress_events (progress_id, status, time) VALUES (?,?,?)').bind(pid, b.status || '已投递', now).run()
  return c.json({ id: pid }, 201)
})
app.patch('/progress/:id', async c => {
  const u = await meRow(c)
  const b = await c.req.json() as any
  const pid = c.req.param('id')
  const fields: string[] = []; const vals: any[] = []
  for (const [k, col] of Object.entries({ name: 'name', post: 'post', workLocation: 'work_location', status: 'status', channel: 'channel', link: 'link', mark: 'mark' }) as any)
    if (b[k] !== undefined) { fields.push(`${col}=?`); vals.push(b[k]) }
  fields.push('update_time=?'); vals.push(Date.now(), pid, u.id)
  await c.env.DB.prepare(`UPDATE progress SET ${fields.join(',')} WHERE id=? AND user_id=?`).bind(...vals).run()
  if (b.status) await c.env.DB.prepare('INSERT INTO progress_events (progress_id, status, time) VALUES (?,?,?)').bind(pid, b.status, Date.now()).run()
  return c.json({ ok: true })
})
app.delete('/progress/:id', async c => {
  const u = await meRow(c)
  await c.env.DB.prepare('DELETE FROM progress WHERE id=? AND user_id=?').bind(c.req.param('id'), u.id).run()
  return c.json({ ok: true })
})
app.post('/export', exportRoute())
app.all('/mcp', mcpRoute())

app.put('/resumes/:id/extras', async c => {
  const map = z.record(z.string()).parse(await c.req.json())
  const rid = c.req.param('id')
  await db(c).delete(s.resumeExtra).where(eq(s.resumeExtra.resumeId, rid))
  for (const [k, v] of Object.entries(map))
    await db(c).insert(s.resumeExtra).values({ resumeId: rid, fieldKey: k, valueMd: v })
  return c.json({ ok: true })
})

export default app

// Pages Functions 入口：所有方法都交给 Hono app
export const onRequest: PagesFunction = ctx => app.fetch(ctx.request, ctx.env as any, ctx)
