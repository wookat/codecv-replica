// v2 API — Hono 单 router 收口（设计文档：单一 API 面，治 31 个散落路由的病）
// Pages Functions: /api/v2/* 全部进这一个 Hono app
import { Hono } from 'hono'
import { drizzle } from 'drizzle-orm/d1'
import { eq, and, asc } from 'drizzle-orm'
import { z } from 'zod'
import { pbkdf2, hashPassword, issueToken, tokenUser, bearerToken } from '../_auth'
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
