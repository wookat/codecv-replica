// MCP endpoint：/api/v2/mcp —— AI agent 操作简历系统的唯一入口（设计文档 §5.6）
// 五个能力面：大简历 CRUD / 按 JD 选取建简历 / 简历 md 读写 / 视觉回传(inspect PNG) / 导出 PDF
// 协议：@modelcontextprotocol/sdk McpServer + WebStandardStreamableHTTPServerTransport（stateless）
// 鉴权：Authorization: Bearer <v2 token>（与页面 API 同一套 sess: KV token）
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { WebStandardStreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js'
import { z } from 'zod'
import { drizzle } from 'drizzle-orm/d1'
import { eq, and, asc } from 'drizzle-orm'
import { tokenUser, bearerToken } from '../_auth'
import * as s from '../schema'
import { composeResumeMd, SECTION_TITLE } from '../_compose'
import { markdownToHTML } from '../_mth/index'
import { renderSelfContained } from './export'

const uid = () => crypto.randomUUID()
const now = () => Date.now()
const text = (t: string) => ({ content: [{ type: 'text' as const, text: t }] })

export default function mcpRoute() {
  return async (c: any) => {
    const userId = await tokenUser(c.env.UPSTASH_KV, bearerToken(c.req.raw))
    if (!userId) return c.json({ error: 'unauthorized' }, 401)
    const db = drizzle(c.env.DB, { schema: s })

    const server = new McpServer({ name: 'codecv-v2', version: '0.1.0' })

    // ---- ① 大简历 CRUD ----
    server.tool('master_list', '列出当前用户全部大简历', {},
      async () => text(JSON.stringify(await db.select().from(s.masterResume).where(eq(s.masterResume.userId, userId)))))

    server.tool('master_create', '新建大简历', { name: z.string() },
      async ({ name }) => {
        const row = { id: uid(), userId, name, createdAt: now(), updatedAt: now() }
        await db.insert(s.masterResume).values(row)
        return text(JSON.stringify(row))
      })

    server.tool('master_get', '读大简历全部条目及各条目的全部版本(md 内容)', { masterId: z.string() },
      async ({ masterId }) => {
        if (!await ownM(masterId)) return text(JSON.stringify({ error: 'not found' }))
        const items = await db.select().from(s.resumeItem).where(eq(s.resumeItem.masterId, masterId)).orderBy(asc(s.resumeItem.sort))
        const out = []
        for (const it of items) {
          const vars = await db.select().from(s.itemVariant).where(eq(s.itemVariant.itemId, it.id))
          out.push({ ...it, variants: vars })
        }
        return text(JSON.stringify({ items: out, sections: SECTION_TITLE }))
      })

    server.tool('master_add_item', '往大简历加条目（可顺带挂一个版本）', {
      masterId: z.string(), section: z.enum(['education', 'internship', 'project', 'award', 'skill', 'selfeval', 'other']),
      title: z.string(), contentMd: z.string().optional(), label: z.string().optional(),
    }, async ({ masterId, section, title, contentMd, label }) => {
      if (!await ownM(masterId)) return text(JSON.stringify({ error: 'not found' }))
      const row = { id: uid(), masterId, section, title, sort: 0, metaJson: '{}', createdAt: now(), updatedAt: now() }
      await db.insert(s.resumeItem).values(row)
      let variant = null
      if (contentMd !== undefined) {
        variant = { id: uid(), itemId: row.id, label: label ?? '默认', contentMd, createdAt: now() }
        await db.insert(s.itemVariant).values(variant)
      }
      return text(JSON.stringify({ item: row, variant }))
    })

    server.tool('master_add_variant', '给条目挂新版本（同一项目的不同写法）', {
      itemId: z.string(), label: z.string(), contentMd: z.string(),
    }, async ({ itemId, label, contentMd }) => {
      if (!await ownI(itemId)) return text(JSON.stringify({ error: 'not found' }))
      const row = { id: uid(), itemId, label, contentMd, createdAt: now() }
      await db.insert(s.itemVariant).values(row)
      return text(JSON.stringify(row))
    })

    server.tool('master_update_variant', '改写某版本 md 内容', {
      variantId: z.string(), contentMd: z.string(),
    }, async ({ variantId, contentMd }) => {
      if (!await ownV(variantId)) return text(JSON.stringify({ error: 'not found' }))
      await db.update(s.itemVariant).set({ contentMd }).where(eq(s.itemVariant.id, variantId))
      return text(JSON.stringify({ ok: true }))
    })

    // ---- ①.5 建库：AI 把「扔进来的一份现有简历」结构化成条目+版本，一次写入 ----
    server.tool('master_ingest', '扔一份现有简历进来建大简历：一次写入条目+各版本（内容已结构化）', {
      name: z.string(),
      items: z.array(z.object({
        section: z.enum(['education', 'internship', 'project', 'award', 'skill', 'selfeval', 'other']),
        title: z.string(), sort: z.number().optional(),
        variants: z.array(z.object({ label: z.string(), contentMd: z.string() })),
      })),
    }, async ({ name, items }) => {
      const master = { id: uid(), userId, name, createdAt: now(), updatedAt: now() }
      await db.insert(s.masterResume).values(master)
      const out = []
      for (const [i, it] of items.entries()) {
        const item = { id: uid(), masterId: master.id, section: it.section, title: it.title, sort: it.sort ?? i, metaJson: '{}', createdAt: now(), updatedAt: now() }
        await db.insert(s.resumeItem).values(item)
        const vars = []
        for (const v of it.variants) {
          const vr = { id: uid(), itemId: item.id, label: v.label, contentMd: v.contentMd, createdAt: now() }
          await db.insert(s.itemVariant).values(vr)
          vars.push(vr)
        }
        out.push({ ...item, variants: vars })
      }
      return text(JSON.stringify({ masterId: master.id, items: out.length }))
    })

    const ownM = async (mid: string) =>
      (await db.select({ id: s.masterResume.id }).from(s.masterResume).where(and(eq(s.masterResume.id, mid), eq(s.masterResume.userId, userId)))).length > 0
    const ownI = async (iid: string) => {
      const [it] = await db.select().from(s.resumeItem).where(eq(s.resumeItem.id, iid))
      return !!it && ownM(it.masterId)
    }
    const ownV = async (vid: string) => {
      const [v] = await db.select().from(s.itemVariant).where(eq(s.itemVariant.id, vid))
      return !!v && ownI(v.itemId)
    }
    const ownR = async (rid: string) =>
      (await db.select({ id: s.resume.id }).from(s.resume).where(and(eq(s.resume.id, rid), eq(s.resume.userId, userId)))).length > 0

    // ---- ② 按 JD 选取建简历：AI 自己读大简历→决定选取→此工具落库并合成 md ----
    server.tool('resume_select', '为大简历按 JD 建一份岗位简历：写选取清单并返回合成 md', {
      masterId: z.string(), templateId: z.string(), title: z.string().optional(), targetJd: z.string(),
      selections: z.array(z.object({ itemId: z.string(), variantId: z.string().nullable().optional(), ord: z.number() })),
    }, async ({ masterId, templateId, title, targetJd, selections }) => {
      if (!await ownM(masterId)) return text(JSON.stringify({ error: 'not found' }))
      const row = { id: uid(), userId, masterId, templateId, title: title ?? '', targetJd: targetJd ?? '', contentMd: '', createdAt: now(), updatedAt: now() }
      await db.insert(s.resume).values(row)
      for (const it of selections)
        await db.insert(s.resumeSelection).values({ resumeId: row.id, itemId: it.itemId, variantId: it.variantId ?? null, ord: it.ord, overridesJson: '{}' })
      const md = await composeFor(db, row.id, title ?? '')
      await db.update(s.resume).set({ contentMd: md }).where(eq(s.resume.id, row.id))
      return text(JSON.stringify({ resumeId: row.id, md }))
    })

    // ---- ③ 简历 md 读写 ----
    server.tool('resume_md_get', '读简历当前 md', { resumeId: z.string() },
      async ({ resumeId }) => {
        const [r] = await db.select().from(s.resume).where(and(eq(s.resume.id, resumeId), eq(s.resume.userId, userId)))
        if (!r) return text(JSON.stringify({ error: 'not found' }))
        return text(r.contentMd || await composeFor(db, resumeId, r.title))
      })

    server.tool('resume_md_set', '整文改写简历 md', { resumeId: z.string(), md: z.string() },
      async ({ resumeId, md }) => {
        await db.update(s.resume).set({ contentMd: md, updatedAt: now() })
          .where(and(eq(s.resume.id, resumeId), eq(s.resume.userId, userId)))
        return text(JSON.stringify({ ok: true }))
      })

    // ---- ④ 视觉回传：渲染成 PNG 回给 AI 自查样式 ----
    server.tool('resume_inspect', '把简历 md 套皮肤渲染成 PNG 回传（视觉自查）', {
      resumeId: z.string().optional(), md: z.string().optional(), templateId: z.string(),
    }, async ({ resumeId, md, templateId }) => {
      let contentMd = md ?? ''
      if (!contentMd && resumeId) {
        const [r] = await db.select().from(s.resume).where(and(eq(s.resume.id, resumeId), eq(s.resume.userId, userId)))
        if (r) contentMd = r.contentMd || await composeFor(db, resumeId, r.title)
      }
      const png = await renderPng(c, contentMd, templateId)
      if (!png) return text(JSON.stringify({ error: 'render 失败', detail: (c as any).__render_err }))
      return { content: [{ type: 'image' as const, data: b64(png), mimeType: 'image/png' }] }
    })

    // ---- ⑤ 导出 PDF ----
    server.tool('resume_export', '导出简历 PDF（VPS Chrome114 渲染链）', {
      resumeId: z.string(), filename: z.string().optional(),
    }, async ({ resumeId, filename }) => {
      const [r] = await db.select().from(s.resume).where(and(eq(s.resume.id, resumeId), eq(s.resume.userId, userId)))
      if (!r) return text(JSON.stringify({ error: 'not found' }))
      const contentMd = r.contentMd || await composeFor(db, resumeId, r.title)
      const pdf = await renderKind(c, contentMd, r.templateId, 'pdf')
      if (!pdf) return text(JSON.stringify({ error: 'render 失败', detail: (c as any).__render_err }))
      return { content: [{ type: 'resource' as const, resource: { uri: `file:///${encodeURIComponent(filename || r.title || 'resume')}.pdf`, mimeType: 'application/pdf', blob: b64(pdf) } }] }
    })

    const transport = new WebStandardStreamableHTTPServerTransport({ sessionIdGenerator: undefined })
    await server.connect(transport)
    return transport.handleRequest(c.req.raw)
  }
}

// ---- helpers ----

// 合成 resume md：selections → variant.contentMd（复刻 web composer 逻辑，保持同构）
async function composeFor(db: any, resumeId: string, title: string): Promise<string> {
  const sel = await db.select().from(s.resumeSelection).where(eq(s.resumeSelection.resumeId, resumeId)).orderBy(asc(s.resumeSelection.ord))
  const items = []
  for (const it of sel) {
    const [item] = await db.select().from(s.resumeItem).where(eq(s.resumeItem.id, it.itemId))
    let body = ''
    if (it.variantId) {
      const [v] = await db.select().from(s.itemVariant).where(eq(s.itemVariant.id, it.variantId))
      body = v?.contentMd ?? ''
    }
    items.push({ section: item?.section ?? 'other', title: item?.title ?? '', contentMd: body })
  }
  return composeResumeMd({ title, items })
}

async function renderKind(c: any, md: string, templateId: string, kind: 'pdf' | 'png'): Promise<Uint8Array | null> {
  const html = markdownToHTML(md)
  const skin = skinHref(templateId)
  return renderSelfContained(c, html, skin, kind)
}

async function renderPng(c: any, md: string, templateId: string) {
  return renderKind(c, md, templateId, 'png')
}

export function skinHref(templateId: string) {
  return `/css/style_${templateId.replace(/^cv-/, '')}.css`
}

function b64(buf: Uint8Array): string {
  let s = ''
  for (let i = 0; i < buf.length; i += 0x8000) s += String.fromCharCode(...buf.subarray(i, i + 0x8000))
  return btoa(s)
}
