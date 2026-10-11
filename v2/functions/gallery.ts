// /gallery 简历广场 SSR 页：公开分享简历列表，可被收录
const esc = (s: string) => (s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
export const onRequestGet: PagesFunction = async (context) => {
  const env: any = context.env
  const origin = new URL(context.request.url).origin
  const rows = await env.DB.prepare(`SELECT r.id, r.title, r.template_id AS tpl, r.updated_at FROM resume r
    JOIN resume_extra e ON e.resume_id=r.id WHERE e.field_key='share_on' AND e.value_md='1'
    ORDER BY r.updated_at DESC LIMIT 60`).all<any>()
  const items = (rows.results ?? []).map((r: any) =>
    `<a class="card" href="/r/${r.id}"><img src="/api/v2/thumb/${r.tpl}" loading="lazy" alt=""><b>${esc(r.title)}</b><span>${new Date(r.updated_at).toLocaleDateString('zh-CN')}</span></a>`).join('\n')
  const html = `<!doctype html><html lang="zh-CN"><head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>简历广场 | CodeCV——用户真实简历案例库</title>
<meta name="description" content="CodeCV 用户公开分享的中文简历案例库，覆盖前端/后端/算法/产品等岗位，一键套用同款模板。">
<link rel="canonical" href="${origin}/gallery">
<style>body{font-family:system-ui,sans-serif;max-width:1100px;margin:0 auto;padding:32px 16px;color:#222}
h1{font-size:26px}.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(180px,1fr));gap:14px;margin-top:20px}
.card{border:1px solid #eee;border-radius:10px;padding:10px;text-decoration:none;color:#222;display:block}
.card img{width:100%;aspect-ratio:3/4;object-fit:cover;border-radius:6px;background:#f5f5f5}
.card b{display:block;font-size:13px;margin-top:8px}.card span{font-size:11px;color:#999}
</style></head><body>
<a href="/" style="color:#666;font-size:13px">← CodeCV 简历工具</a>
<h1>简历广场</h1>
<p style="color:#666;font-size:14px">用户公开分享的真实简历案例，点开即可查看正文并套用同款模板。</p>
<div class="grid">${items || '<p>暂无分享，来做第一份公开的简历吧。</p>'}</div>
</body></html>`
  return new Response(html, { headers: { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'public, max-age=300' } })
}
