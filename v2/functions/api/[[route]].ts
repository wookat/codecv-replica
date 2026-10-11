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
  const { username, password } = await c.req.json()
  if (!username || !password) return c.json({ error: '用户名或密码不能为空' }, 400)
  const exist = await c.env.DB.prepare('SELECT id FROM users WHERE username=?').bind(username).first()
  if (exist) return c.json({ error: '用户名已被注册' }, 400)
  const { salt, hash } = await hashPassword(password)
  await c.env.DB.prepare('INSERT INTO users (username, pwd_hash, salt, nickname, origin, created_at) VALUES (?,?,?,?,?,?)')
    .bind(username, hash, salt, username, 'web', Date.now()).run()
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
// GET /health — 监控探针（公开）
app.get('/health', async c => {
  let db = false
  try { await c.env.DB.prepare('SELECT 1').first(); db = true } catch {}
  return c.json({ ok: db, service: 'cv-v2', ts: Date.now() }, db ? 200 : 503)
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
// POST /ai — 站内 AI：生成/润色/校对/翻译（aicdks swe-2-medium 中转）
app.post('/ai', async c => {
  const { action, text, jd } = await c.req.json() as any
  const prompts: Record<string, string> = {
    perf: `润色下面这段简历内容，使其更专业、有结果导向（保留 markdown 格式，只返回润色后文本）：\n${text}`,
    gen: `根据下面信息写一段简历 markdown（小节 ##、要点 -、加粗 **）：\n${text}${jd ? `\n目标岗位：${jd}` : ''}`,
    proof: `校对下面简历文本的错别字与语病，返回修正后的文本（保留 markdown 格式）：\n${text}`,
    translate: `把下面简历内容翻译成${(jd || '英文')}（保留 markdown 格式）：\n${text}`,
  }
  const prompt = prompts[action]
  if (!prompt) return c.json({ error: 'unknown action' }, 400)
  const r = await fetch('https://api.aicdks.com/v1/chat/completions', {
    method: 'POST', headers: { 'content-type': 'application/json', authorization: `Bearer ${(c.env as any).GP_LLM_API_KEY}` },
    body: JSON.stringify({ model: 'swe-2-medium', messages: [{ role: 'user', content: prompt }], temperature: 0.3 }) })
  if (!r.ok) return c.json({ error: 'LLM ' + r.status }, 502)
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
