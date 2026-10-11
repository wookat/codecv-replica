// /t/:id 模板详情 SEO 页：可被收录的静态 HTML（名称/预览图/适用人群/CTA）
const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

export const onRequestGet: PagesFunction = async (context) => {
  const id = context.params.id as string
  const env: any = context.env
  const origin = new URL(context.request.url).origin
  const r = await env.ASSETS.fetch(new URL(`/seeds/tpl/${id}.json`, context.request.url))
  if (!r.ok) return new Response('模板不存在', { status: 404 })
  const d: any = await r.json()
  const name = d.name || `简历模板 ${id}`
  const desc = (d.description || '').slice(0, 160)
  const tags: string[] = Array.isArray(d.tags) ? d.tags : []
  const title = `${name} - 免费在线简历模板 | CodeCV`
  const html = `<!doctype html><html lang="zh-CN"><head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(title)}</title>
<meta name="description" content="${esc(desc || name + '免费在线简历模板，markdown 编辑，AI 辅助生成，支持 PDF/Word 导出。')}">
<meta property="og:title" content="${esc(title)}">
<meta property="og:image" content="${origin}/api/v2/thumb/${esc(id)}">
<link rel="canonical" href="${origin}/t/${id}">
<style>body{font-family:system-ui,sans-serif;margin:0;background:#f5f5f5;color:#222}
.wrap{max-width:860px;margin:0 auto;padding:32px 16px}
.card{background:#fff;border-radius:12px;padding:24px;display:flex;gap:24px;flex-wrap:wrap}
.frame{width:320px;max-width:100%;aspect-ratio:5/7;overflow:hidden;border:1px solid #eee;border-radius:8px;background:#f5f5f5}
img{width:100%;height:auto;display:block}
h1{font-size:22px;margin:0 0 12px}
.tag{display:inline-block;background:#eef;border-radius:4px;padding:2px 8px;font-size:12px;margin-right:6px;color:#55c}
.cta{display:inline-block;background:#000;color:#fff;padding:10px 24px;border-radius:8px;text-decoration:none;margin-top:16px}
p{color:#555;line-height:1.7}</style></head><body><main><div class="wrap">
<a href="/" style="color:#666;font-size:13px">← CodeCV 简历工具</a>
<div class="card" style="margin-top:12px">
<div class="frame"><img src="/api/v2/thumb/${id}" alt="${esc(name)}简历模板预览图" fetchpriority="high" width="794"></div>
<div style="flex:1;min-width:240px">
<h1>${esc(name)}</h1>
<div>${tags.map(t => `<span class="tag">${esc(String(t))}</span>`).join('')}</div>
<p>${esc(desc)}</p>
<p>使用 CodeCV 在线编辑此模板：内容用 Markdown 编写，AI 按目标岗位自动生成，支持导出 PDF / PNG / Word。</p>
<a class="cta" href="/?tpl=${esc(id)}">免费使用此模板 →</a>
</div></div></div></main></body></html>`
  return new Response(html, { headers: { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'public, max-age=3600' } })
}
