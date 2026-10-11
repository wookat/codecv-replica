// /r/:id 分享简历 SSR 页：可被收录的公开简历正文 + CTA
const esc = (s: string) => (s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
const mdLite = (md: string) => esc(md)
  .replace(/^:::.*$/gm, '')
  .replace(/^## (.*)$/gm, '<h2>$1</h2>').replace(/^# (.*)$/gm, '<h1>$1</h1>')
  .replace(/^- (.*)$/gm, '<li>$1</li>')
  .replace(/\*\*([^*]+)\*\*/g, '<b>$1</b>')
  .replace(/\n{2,}/g, '</p><p>').replace(/\n/g, '<br>')

export const onRequestGet: PagesFunction = async (context) => {
  const env: any = context.env
  const id = context.params.id as string
  const r: any = await env.DB.prepare('SELECT title, template_id, content_md, updated_at FROM resume WHERE id=?').bind(id).first()
  if (!r) return new Response('简历不存在', { status: 404 })
  const ex = await env.DB.prepare("SELECT value_md FROM resume_extra WHERE resume_id=? AND field_key='share_on'").bind(id).first<any>()
  if (ex?.value_md !== '1') return new Response('该简历未公开分享', { status: 404 })
  const origin = new URL(context.request.url).origin
  const html = `<!doctype html><html lang="zh-CN"><head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(r.title)} | CodeCV 简历分享</title>
<meta name="description" content="${esc((r.content_md || '').replace(/[#*:`\n]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 150))}">
<link rel="canonical" href="${origin}/r/${esc(id)}">
<meta property="og:title" content="${esc(r.title)} | CodeCV">
<meta property="og:type" content="article">
<style>body{font-family:system-ui,sans-serif;max-width:760px;margin:0 auto;padding:32px 16px;color:#222;line-height:1.8}
h1{font-size:26px}h2{font-size:18px;margin-top:22px;border-left:4px solid #111;padding-left:8px}
li{margin:4px 0;list-style:inside disc}.meta{color:#595959;font-size:13px}
.cta{display:inline-block;margin-top:28px;background:#111;color:#fff;padding:10px 20px;border-radius:8px;text-decoration:none;font-size:14px}
</style></head><body>
<a href="/" style="color:#666;font-size:13px">← CodeCV 简历工具</a>
<h1>${esc(r.title)}</h1>
<div class="meta">更新于 ${new Date(r.updated_at).toLocaleDateString('zh-CN')} · 由 CodeCV 制作</div>
<main><article><p>${mdLite(r.content_md || '')}</p></article></main>
<a class="cta" href="/?tpl=${esc(r.template_id)}">用这个模板做我的简历 →</a>
</body></html>`
  return new Response(html, { headers: { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'public, max-age=600' } })
}
