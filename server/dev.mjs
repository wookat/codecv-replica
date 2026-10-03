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
