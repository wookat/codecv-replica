#!/usr/bin/env node
// 本地开发后端替身：模拟 codecv OSS 前端依赖的三类外部服务
//   1. Upstash REST 兼容：GET /get/<key>、/set/<key>[/<value>]（文件持久化 server/data.json）
//      - 使用方：导出计数 count、模板热度 templateData（{t<type>: hot}）
//      - templateData 首次访问时用生产抓取热度做种子（scripts/seeds/codecv/raw/*.json 的 hot 字段）
//   2. Gitee stargazers：GET /gitee → []（stargazers 墙留空，不伪造数据）
//   3. 导出服务：POST /export {content,style,link,name,type:0|1} → playwright chromium 真渲染出
//      {pdf:{data:[bytes]}} 或 {picture:{data:[bytes]}}，与前端 downloadOfBuffer 契约一致
// 用法：node server/dev.mjs（默认 :8787，与 .env 的 VITE_* 指向一致）
import { createServer } from 'node:http'
import { existsSync, readFileSync, writeFileSync, mkdirSync, readdirSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const DATA = resolve(root, 'server/data.json')
const store = existsSync(DATA)
  ? JSON.parse(readFileSync(DATA, 'utf8'))
  : {}
const save = () => writeFileSync(DATA, JSON.stringify(store, null, 1))

// templateData 种子：生产模板热度（raw.hot，键名 t<type>）
if (!store.templateData) {
  const td = {}
  for (const f of readdirSync(resolve(root, 'scripts/seeds/codecv/raw'))) {
    const raw = JSON.parse(readFileSync(resolve(root, 'scripts/seeds/codecv/raw', f), 'utf8'))
    td[`t${raw.type}`] = String(raw.hot || 0)
  }
  store.templateData = JSON.stringify(td)
  save()
}
store.count ??= '0'
save()

// ===== 站点种子数据（codecvcv.com 爬取快照；大文件放仓库外，SEEDS_DIR 可配） =====
const SEEDS_DIR = process.env.SEEDS_DIR || '/home/ubuntu/codecv-replica-data/seeds'
const loadSeed = (name, fallback) => {
  const p = resolve(SEEDS_DIR, name)
  return existsSync(p) ? JSON.parse(readFileSync(p, 'utf8')) : fallback
}
let _jobs = null
const jobs = () => (_jobs ??= loadSeed('jobs.json', []))

// playwright-core 懒加载（放在 resume-forge 测试目录的可用安装上；缺失时导出端点报 503）
let chromium = null
async function getBrowser() {
  if (!chromium) {
    const { chromium: c } = await import('/home/ubuntu/rf-test/node_modules/playwright-core/index.mjs')
    chromium = await c.launch({
      executablePath: '/home/ubuntu/.cache/ms-playwright/chromium-1228/chrome-linux64/chrome',
      args: ['--no-sandbox'],
    })
  }
  return chromium
}

const json = (res, obj, code = 200) => {
  res.writeHead(code, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': '*',
    'Access-Control-Allow-Methods': '*',
  })
  res.end(JSON.stringify(obj))
}

const readBody = (req) =>
  new Promise((res) => {
    let b = ''
    req.on('data', (c) => (b += c))
    req.on('end', () => res(b))
  })

createServer(async (req, res) => {
  const url = new URL(req.url, 'http://x')
  if (req.method === 'OPTIONS') return json(res, {})

  // Upstash 兼容层
  const m = url.pathname.match(/^\/upstash\/(get|set)\/([^/]+)(?:\/(.*))?$/)
  if (m) {
    const [, op, key, val] = m
    if (op === 'get') return json(res, { result: store[key] ?? null })
    if (op === 'set') {
      if (val !== undefined) {
        store[key] = decodeURIComponent(val)
      } else {
        store[key] = await readBody(req)
      }
      save()
      return json(res, { result: 'OK' })
    }
  }
  if (url.pathname === '/gitee') return json(res, [])

  // ===== 校招岗位 API（契约对齐 codecvcv.com） =====
  if (url.pathname === '/api/job/page' && req.method === 'POST') {
    const q = JSON.parse(await readBody(req) || '{}')
    const { batch, channel, title, company, workLocation, industry, positions, current = 1, pageSize = 25 } = q
    const sub = (field, v) => !v || String(field ?? '').toLowerCase().includes(String(v).toLowerCase())
    const filtered = jobs().filter((j) => {
      if (batch && String(j.graduationYear ?? '') !== String(batch)) return false
      if (channel && j.channel !== channel) return false
      if (!sub(j.title, title)) return false
      if (!sub(j.company, company)) return false
      if (
        workLocation &&
        !sub(j.workLocation, workLocation) &&
        !(j.normalizedWorkLocations || []).some((l) => sub(l, workLocation))
      )
        return false
      if (!sub(j.industry, industry)) return false
      if (!sub(j.positions, positions)) return false
      return true
    })
    filtered.sort((a, b) => (b.createTime || 0) - (a.createTime || 0))
    const start = (current - 1) * pageSize
    return json(res, {
      code: 200,
      data: filtered.slice(start, start + pageSize),
      total: filtered.length,
      message: '获取招聘岗位列表成功',
    })
  }
  if (url.pathname === '/api/job/today' && req.method === 'POST') {
    const dayStart = new Date()
    dayStart.setHours(0, 0, 0, 0)
    const n = jobs().filter((j) => (j.createTime || 0) >= dayStart.getTime()).length
    return json(res, { code: 200, data: n, message: '获取当日新增岗位数量成功' })
  }

  // ===== 面经 API（与线上一致：GET） =====
  if (url.pathname === '/api/mianjing/list') {
    const q = req.method === 'POST' ? JSON.parse(await readBody(req) || '{}') : Object.fromEntries(url.searchParams)
    const { current, page = 1, pageSize = 20, company, position, grade, batch, round, keyword } = q
    const cur = +(current ?? page ?? 1)
    const sub = (field, v) => !v || String(field ?? '').toLowerCase().includes(String(v).toLowerCase())
    const filtered = loadSeed('mianjing-list.json', []).filter((m) => {
      if (company && m.companySlug !== company && m.companyName !== company) return false
      if (position && m.positionSlug !== position && m.positionName !== position) return false
      if (grade && String(m.grade) !== String(grade)) return false
      const BATCH_MAP = { 秋招: 'qiuzhao', 春招: 'chunzhao', 暑期实习: 'shuqi', 日常实习: 'richang', 社招: 'shezhao' }
      if (batch && m.batch !== batch && m.batch !== (BATCH_MAP[batch] ?? batch)) return false
      if (round && m.round !== round) return false
      if (keyword && !sub(m.title, keyword) && !sub(m.summary, keyword) && !sub(m.companyName, keyword) && !sub(m.positionName, keyword)) return false
      return true
    })
    filtered.sort((a, b) => (b.publishTime || 0) - (a.publishTime || 0))
    const start = (cur - 1) * pageSize
    return json(res, { code: 200, data: filtered.slice(start, start + +pageSize), total: filtered.length, message: '查询成功' })
  }
  const mjMeta = url.pathname.match(/^\/api\/mianjing\/(companies|positions|topics|stats|company-facets|topic-facets)$/)
  if (mjMeta) {
    const meta = loadSeed('mianjing-meta.json', {})
    return json(res, { code: 200, data: meta[mjMeta[1]] ?? (mjMeta[1] === 'stats' ? {} : []), message: '获取成功' })
  }
  if (url.pathname === '/api/mianjing/detail') {
    const q = req.method === 'POST' ? JSON.parse(await readBody(req) || '{}') : Object.fromEntries(url.searchParams)
    const details = loadSeed('mianjing-detail.json', {})
    const hit = details[q.id || q._id]
    return json(res, hit ? { code: 200, data: hit, message: '查询成功' } : { code: 404, data: null, message: '面经不存在' })
  }

  // ===== 求职攻略文章 =====
  if (url.pathname === '/api/post/page' && req.method === 'POST') {
    const q = JSON.parse(await readBody(req) || '{}')
    const { current = 1, pageSize = 12, keyword } = q
    const sub = (field, v) => !v || String(field ?? '').toLowerCase().includes(String(v).toLowerCase())
    const filtered = loadSeed('posts.json', []).filter(
      (p) => sub(p.title, keyword) || sub(p.description, keyword)
    )
    filtered.sort((a, b) => (b.create_time || 0) - (a.create_time || 0))
    const start = (current - 1) * pageSize
    return json(res, {
      code: 200,
      data: filtered.slice(start, start + pageSize).map((p) => ({ ...p, content: undefined })),
      total: filtered.length,
      message: '查询成功',
    })
  }
  if (url.pathname === '/api/post/detail') {
    const q = req.method === 'POST' ? JSON.parse(await readBody(req) || '{}') : Object.fromEntries(url.searchParams)
    const hit = loadSeed('posts.json', []).find((p) => p._id === q.id)
    const body = loadSeed('post-detail.json', {})[q.id]
    return json(
      res,
      hit ? { code: 200, data: { ...hit, contentMd: body?.contentMd }, message: '查询成功' } : { code: 404, data: null, message: '文章不存在' },
    )
  }

  if (url.pathname === '/export' && req.method === 'POST') {
    try {
      const { content, style, link, name, type } = JSON.parse(await readBody(req))
      const browser = await getBrowser()
      const page = await browser.newPage()
      const linkTag = link && link !== 'none' ? `<link rel="stylesheet" href="${link}">` : ''
      await page.setContent(
        `<!doctype html><html><head><meta charset="utf-8"><link rel="stylesheet" href="http://127.0.0.1:5299/fonts/iconfont.css">${linkTag}<style>${style}</style></head><body>${content}</body></html>`,
        { waitUntil: 'networkidle' },
      )
      await page.evaluate(() => document.fonts?.ready)
      const isPdf = Number(type) === 0
      const buf = isPdf
        ? await page.pdf({ width: '794px', height: '1123px', printBackground: true, pageRanges: '' })
        : await page.locator('.jufe-wrapper-page').first().screenshot()
      await page.close()
      return json(res, isPdf ? { pdf: { data: [...buf] } } : { picture: { data: [...buf] } })
    } catch (e) {
      return json(res, { msg: String(e?.message || e) }, 503)
    }
  }

  json(res, { msg: 'not found' }, 404)
}).listen(8787, () => console.log('dev backend on :8787'))
