// POST /api/v2/export {content, style, name, type:'pdf'|'png'} → 自托管渲染服务转 PDF/PNG
// 渲染链: RENDER_URL + RENDER_TOKEN → cloudflared 隧道 https://cvrender.zalize.com → VPS Chrome114
// 关键约束: 远程 Chrome 回连不了本站——皮肤 css（@import 链）与字体 url() 全部服务端内嵌成自包含 HTML。
// 静态资源经 env.ASSETS 读（Pages 绑定），不走 origin 自抓——workerd 单进程会死锁。

interface Env { RENDER_URL?: string; RENDER_TOKEN?: string; ASSETS?: { fetch: (r: Request) => Promise<Response> } }

// 共用渲染链：contentHtml + skinHref → 自包含 HTML → VPS Chrome114 → bytes（MCP 与 /export 共用）
export async function renderSelfContained(c: any, contentHtml: string, style: string, type: 'pdf' | 'png' | 'docx'): Promise<Uint8Array | null> {
  const env = c.env as Env
  const RENDER_URL = env.RENDER_URL || 'https://cvrender.zalize.com/render'
  const RENDER_TOKEN = env.RENDER_TOKEN || ''
  if (!RENDER_TOKEN) { (c as any).__render_err='no token'; return null }

  const origin = new URL(c.req.url).origin
  const fetchAsset = async (u: string) => {
    const path = new URL(u).pathname
    if (env.ASSETS) {
      const r = await env.ASSETS.fetch(new Request(origin + path)).catch(() => null as any)
      if (r && r.ok) return r
    }
    return fetch(u)
  }
  const skinCss = await inlineCssRecursive(style || '', origin, fetchAsset)
  const htmlDoc = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>resume</title>
<style>${skinCss}</style>
<style>@page{size:A4;margin:0}body{margin:0;padding:0}.markdown-transform-html{width:210mm;margin:0 auto;box-shadow:none}</style>
</head><body>
<div class="markdown-transform-html jufe">${contentHtml || ''}</div>
</body></html>`

  try {
    const r = await fetch(RENDER_URL, {
      method: 'POST', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ html: htmlDoc, type, token: RENDER_TOKEN }),
    })
    const j = await r.json() as any
    if (j?.data) return new Uint8Array(j.data)
    ;(c as any).__render_err = 'status ' + r.status + ' ' + JSON.stringify(j).slice(0, 200)
  } catch (e: any) { (c as any).__render_err = String(e && e.stack || e).slice(0, 300) }
  return null
}

export default function exportRoute() {
  return async (c: any) => {
    const { content, style, name, type } = await c.req.json()
    if (!c.env.RENDER_TOKEN) return c.json({ code: 503, msg: 'RENDER_TOKEN 未配置' }, 503)
    const bytes = await renderSelfContained(c, content || '', style || '', type === 'docx' ? 'docx' : type === 'png' ? 'png' : 'pdf')
    if (!bytes) return c.json({ code: 503, msg: 'render 服务无响应' }, 503)

    return new Response(bytes.buffer, {
      headers: {
        'content-type': type === 'docx' ? 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' : type === 'png' ? 'image/png' : 'application/pdf',
        'content-disposition': `attachment; filename="${encodeURIComponent(name || 'resume')}.${type === 'docx' ? 'docx' : type === 'png' ? 'png' : 'pdf'}"`,
      },
    })
  }
}

type Fetcher = (u: string) => Promise<Response | null>

// 递归内嵌 css：@import 链展开 + url() 资源转 data-URI（字体/图片），自包含可远程渲染
async function inlineCssRecursive(href: string, origin: string, fetcher: Fetcher, depth = 0): Promise<string> {
  if (depth > 4 || !href) return ''
  const abs = href.startsWith('http') ? href : origin + (href.startsWith('/') ? href : '/' + href)
  const res = await fetcher(abs)
  if (!res || !res.ok) return ''
  const base = abs.slice(0, abs.lastIndexOf('/') + 1)
  let css = await res.text()

  // @import url("x") / @import "x"
  const imports = [...css.matchAll(/@import\s+(?:url\()?['"]?([^'")]+)['"]?\)?\s*;/g)]
  for (const m of imports) {
    const sub = await inlineCssRecursive(new URL(m[1], base).href, origin, fetcher, depth + 1)
    css = css.replace(m[0], sub)
  }

  // url() 资源 → data-URI（woff2/woff/ttf/otf/png/jpg/svg，≤3MB）
  const urls = [...css.matchAll(/url\((?!['"]?data:)['"]?([^'")]+)['"]?\)/g)]
  for (const m of urls) {
    const u = new URL(m[1], base).href
    try {
      const r2 = await fetcher(u)
      if (!r2 || !r2.ok) continue
      const buf = await r2.arrayBuffer()
      if (buf.byteLength > 3e6) continue
      const mime = u.match(/\.(woff2?|ttf|otf|png|jpe?g|svg|webp)(\?|$)/i)
        ? 'font/' + (u.match(/\.woff2/i) ? 'woff2' : u.match(/\.woff/i) ? 'woff' : u.match(/\.ttf|\.otf/i) ? 'truetype' : 'x')
        : 'application/octet-stream'
      css = css.replace(m[0], `url(data:${mime};base64,${b64(buf)})`)
    } catch {}
  }
  return css
}

function b64(buf: ArrayBuffer): string {
  const bytes = new Uint8Array(buf)
  let s = ''
  for (let i = 0; i < bytes.length; i += 0x8000) s += String.fromCharCode(...bytes.subarray(i, i + 0x8000))
  return btoa(s)
}
