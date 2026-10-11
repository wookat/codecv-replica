// sitemap.xml：模板详情页 + 帖子页全量
import { TPL_IDS } from './_catalog'

export const onRequestGet: PagesFunction = async (context) => {
  const env: any = context.env
  const origin = new URL(context.request.url).origin
  const posts = await env.DB.prepare('SELECT _id FROM posts WHERE deleted=0 LIMIT 500').all<any>()
  const urls = ['', '/?login',
    ...TPL_IDS.map(id => `/t/${id}`),
    ...(posts.results ?? []).map((p: any) => `/p/${p._id}`)]
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map(u => `  <url><loc>${origin}${u}</loc></url>`).join('\n')}
</urlset>`
  return new Response(xml, { headers: { 'content-type': 'application/xml' } })
}
