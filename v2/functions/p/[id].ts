// /p/:id 帖子详情 SEO 页：社区帖子的可收录 HTML
const esc = (s: string) => (s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
const mdLite = (md: string) => esc(md)
  .replace(/^###### (.*)$/gm, '<h6>$1</h6>').replace(/^##### (.*)$/gm, '<h5>$1</h5>')
  .replace(/^#### (.*)$/gm, '<h4>$1</h4>').replace(/^### (.*)$/gm, '<h3>$1</h3>')
  .replace(/^## (.*)$/gm, '<h2>$1</h2>').replace(/^# (.*)$/gm, '<h1>$1</h1>')
  .replace(/\*\*([^*]+)\*\*/g, '<b>$1</b>').replace(/\n{2,}/g, '</p><p>').replace(/\n/g, '<br>')

export const onRequestGet: PagesFunction = async (context) => {
  const id = context.params.id as string
  const env: any = context.env
  const origin = new URL(context.request.url).origin
  const p: any = await env.DB.prepare('SELECT _id, title, content, author, tag, likes, views, created_at FROM posts WHERE _id=? AND deleted=0').bind(id).first()
  if (!p) return new Response('帖子不存在', { status: 404 })
  const html = `<!doctype html><html lang="zh-CN"><head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(p.title)} | CodeCV 社区</title>
<meta name="description" content="${esc((p.content || '').slice(0, 150))}">
<link rel="canonical" href="${origin}/p/${id}">
<style>body{font-family:system-ui,sans-serif;max-width:760px;margin:0 auto;padding:32px 16px;color:#222;line-height:1.8}
h1{font-size:24px}h2{font-size:18px;margin-top:24px}h3{font-size:16px}
.meta{color:#888;font-size:13px;margin-bottom:16px}
article{border-top:1px solid #eee;padding-top:16px}</style></head><body>
<a href="/" style="color:#666;font-size:13px">← CodeCV 简历工具</a>
<h1>${esc(p.title)}</h1>
<div class="meta">${esc(p.author || '')} · ${esc(p.tag || '')} · ${new Date(p.created_at).toLocaleDateString('zh-CN')} · ${p.views || 0} 阅读</div>
<article><p>${mdLite(p.content || '')}</p></article>
</body></html>`
  return new Response(html, { headers: { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'public, max-age=600' } })
}
