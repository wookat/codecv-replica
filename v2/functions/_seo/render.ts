// 职业×简历 SEO 页公共渲染：布局/导航/面包屑/FAQ/JSON-LD/模板卡
import catalog from '../../web/src/features/templates/catalog.json'
import { OCCUPATIONS, type Faq } from './data'

export const esc = (s: string) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
export const ldScript = (obj: unknown) => `<script type="application/ld+json">${JSON.stringify(obj).replace(/</g, '\\u003c')}</script>`
export type Crumb = { name: string; url: string }
export const SITE = 'CodeCV'

export const tplName = (id: string) => (catalog as any)[id]?.name || `简历模板 ${id}`
export const tplTags = (id: string): string[] => (catalog as any)[id]?.tags || []

export const breadcrumbLd = (origin: string, crumbs: Crumb[]) => ({
  '@context': 'https://schema.org', '@type': 'BreadcrumbList',
  itemListElement: crumbs.map((c, i) => ({ '@type': 'ListItem', position: i + 1, name: c.name, item: origin + c.url })),
})
export const faqLd = (faqs: Faq[]) => ({
  '@context': 'https://schema.org', '@type': 'FAQPage',
  mainEntity: faqs.map(f => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } })),
})
export const orgLd = (origin: string) => ({ '@type': 'Organization', name: SITE, url: origin, logo: origin + '/favicon.svg' })
export const articleLd = (origin: string, o: { url: string; headline: string; desc: string; updated: string; image?: string }) => ({
  '@context': 'https://schema.org', '@type': 'Article', headline: o.headline, description: o.desc,
  mainEntityOfPage: origin + o.url, image: o.image ? [o.image] : undefined, inLanguage: 'zh-CN',
  datePublished: o.updated, dateModified: o.updated, author: orgLd(origin), publisher: orgLd(origin),
})
export const tplListLd = (origin: string, name: string, ids: string[]) => ({
  '@context': 'https://schema.org', '@type': 'ItemList', name,
  itemListElement: ids.map((id, i) => ({ '@type': 'ListItem', position: i + 1, url: `${origin}/t/${id}`, name: tplName(id), image: `${origin}/api/v2/thumb/${id}` })),
})

export const faqHtml = (faqs: Faq[], h = '常见问题') => `<section class="card"><h2 id="faq">${esc(h)}</h2>${faqs.map(f =>
  `<details class="faq" open><summary>${esc(f.q)}</summary><p>${esc(f.a)}</p></details>`).join('')}</section>`

export const tplCard = (id: string, badge?: string) => `<article class="tpl">
<a href="/t/${esc(id)}" class="thumb"><img src="/api/v2/thumb/${esc(id)}" alt="${esc(tplName(id))}简历模板预览" loading="lazy" width="300" height="400"></a>
<div class="tpl-b"><h3><a href="/t/${esc(id)}">${esc(tplName(id))}</a>${badge ? `<span class="badge">${esc(badge)}</span>` : ''}</h3>
<div class="tags">${tplTags(id).slice(0, 4).map(t => `<span>${esc(t)}</span>`).join('')}</div>
<div class="row"><a class="btn" href="/?tpl=${esc(id)}">免费使用此模板</a><a class="lnk" href="/t/${esc(id)}">查看详情</a></div></div></article>`

export const crumbsHtml = (crumbs: Crumb[]) => `<nav class="crumbs" aria-label="面包屑"><ol>${crumbs.map((c, i) =>
  i === crumbs.length - 1 ? `<li aria-current="page">${esc(c.name)}</li>` : `<li><a href="${esc(c.url)}">${esc(c.name)}</a></li>`).join('')}</ol></nav>`

const footer = () => `<footer class="foot"><div class="wrap">
<div class="cols"><div><h4>按职业找简历</h4>${OCCUPATIONS.map(o => `<a href="/jianli/${o.slug}">${esc(o.name)}简历模板</a>`).join('')}</div>
<div><h4>简历怎么写</h4>${OCCUPATIONS.map(o => `<a href="/jianli/${o.slug}/zenmexie">${esc(o.name)}简历怎么写</a>`).join('')}</div>
<div><h4>简历范文</h4>${OCCUPATIONS.map(o => `<a href="/jianli/${o.slug}/fanwen">${esc(o.name)}简历范文</a>`).join('')}</div>
<div><h4>CodeCV</h4><a href="/">免费在线简历编辑器</a><a href="/jianli">职业简历导航</a><a href="/gallery">简历广场</a><a href="/t/10front_end">全部简历模板</a></div></div>
<p class="copy">CodeCV · zalize.com · 114 套免费简历模板，Markdown 编辑，PDF/Word 导出</p></div></footer>`

const CSS = `*{box-sizing:border-box}html{-webkit-text-size-adjust:100%}body{margin:0;background:#f5f6f8;color:#1b1f24;font:15px/1.7 -apple-system,BlinkMacSystemFont,"PingFang SC","Noto Sans SC","Microsoft YaHei",sans-serif}
a{color:#2f6bfe}.wrap{max-width:1000px;margin:0 auto;padding:0 16px}
.top{position:sticky;top:0;z-index:5;backdrop-filter:blur(12px);background:rgba(255,255,255,.75);border-bottom:1px solid #e6e8ee}.top .wrap{display:flex;align-items:center;gap:18px;height:56px}
.top .logo{font-weight:800;font-size:18px;color:#1b1f24;text-decoration:none;background:linear-gradient(90deg,#2f6bfe,#8b5cf6,#ec4899);-webkit-background-clip:text;background-clip:text;-webkit-text-fill-color:transparent}
.top nav a{color:#4b5563;text-decoration:none;margin-right:14px;font-size:14px}.top .sp{flex:1}
.btn{display:inline-block;background:#2f6bfe;color:#fff;padding:9px 18px;border-radius:999px;text-decoration:none;font-weight:600;font-size:14px;white-space:nowrap}.btn:hover{background:#1f56e0}
.btn.lg{padding:12px 26px;font-size:16px}.btn.ghost{background:#fff;color:#2f6bfe;border:1px solid #c7d4ff}.lnk{font-size:14px;margin-left:12px}
.crumbs{font-size:13px;color:#6b7280;margin:16px 0}.crumbs ol{list-style:none;padding:0;margin:0;display:flex;flex-wrap:wrap;gap:6px}.crumbs li+li:before{content:"›";margin-right:6px;color:#9ca3af}.crumbs a{color:#6b7280;text-decoration:none}
h1{font-size:30px;line-height:1.3;margin:8px 0 10px;letter-spacing:-.01em}h2{font-size:20px;margin:0 0 12px}h3{font-size:16px;margin:0 0 6px}
.hero{padding:8px 0 20px}.hero p.lead{font-size:16px;color:#4b5563;margin:0 0 16px;max-width:760px}.hero .meta{font-size:13px;color:#6b7280}
.card{background:#fff;border-radius:14px;padding:22px 24px;margin:0 0 18px;box-shadow:0 1px 2px rgba(16,24,40,.04),0 4px 16px rgba(16,24,40,.05)}
.card ul{padding-left:20px;margin:6px 0}.card li{margin:4px 0}.card p{margin:8px 0}
.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(210px,1fr));gap:16px}
.tpl{background:#fff;border-radius:14px;overflow:hidden;box-shadow:0 1px 2px rgba(16,24,40,.04),0 4px 16px rgba(16,24,40,.05);display:flex;flex-direction:column}
.tpl .thumb{display:block;background:#eef0f4;aspect-ratio:3/4;overflow:hidden}.tpl img{width:100%;height:100%;object-fit:cover;object-position:top;display:block;transition:transform .3s}.tpl:hover img{transform:scale(1.03)}
.tpl-b{padding:12px 14px 14px}.tpl h3 a{color:#1b1f24;text-decoration:none}.badge{display:inline-block;margin-left:8px;font-size:11px;background:#eaf0ff;color:#2f6bfe;border-radius:999px;padding:1px 8px;vertical-align:middle}
.tags span{display:inline-block;font-size:12px;background:#f1f3f7;color:#4b5563;border-radius:999px;padding:1px 9px;margin:4px 6px 0 0}.row{margin-top:12px;display:flex;align-items:center;flex-wrap:wrap;gap:6px}
.faq{border-top:1px solid #eef0f4;padding:10px 0}.faq summary{font-weight:600;cursor:pointer}.faq p{margin:6px 0 0;color:#374151}
.cmp{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin:10px 0}.cmp div{border-radius:10px;padding:12px 14px;font-size:14px}.cmp .bad{background:#fff1f2;color:#9f1239}.cmp .good{background:#ecfdf5;color:#065f46}.cmp b{display:block;font-size:12px;margin-bottom:4px;opacity:.8}
.toc a{display:inline-block;margin:2px 12px 2px 0;font-size:14px}
.paper-wrap{background:#e9ebf0;border-radius:14px;padding:20px;overflow:auto;margin-bottom:18px}.paper{width:794px;min-height:1000px;margin:0 auto;background:#fff;box-shadow:0 8px 30px rgba(0,0,0,.12);padding:28px 36px;position:relative}
.cta-bar{display:flex;gap:10px;flex-wrap:wrap;align-items:center;margin:14px 0 22px}
.chips a{display:inline-block;background:#fff;border:1px solid #e6e8ee;border-radius:999px;padding:6px 14px;margin:0 8px 8px 0;text-decoration:none;color:#1b1f24;font-size:14px}.chips a:hover{border-color:#2f6bfe;color:#2f6bfe}
.foot{margin-top:40px;border-top:1px solid #e6e8ee;background:#fff;padding:28px 0 20px;font-size:13px}.foot .cols{display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:18px}.foot h4{margin:0 0 8px;font-size:13px;color:#1b1f24}.foot a{display:block;color:#6b7280;text-decoration:none;margin:3px 0}.foot .copy{color:#9ca3af;margin-top:20px;text-align:center}
@media(max-width:860px){h1{font-size:24px}.card{padding:16px}.cmp{grid-template-columns:1fr}.top nav{display:none}.paper-wrap{padding:8px}.paper{zoom:.44;padding:20px}}`

export function page(o: { origin: string; path: string; title: string; desc: string; crumbs: Crumb[]; body: string; ld: unknown[]; ogImage?: string; extraHead?: string; status?: number }) {
  const canonical = o.origin + o.path
  const html = `<!doctype html><html lang="zh-CN"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(o.title)}</title><meta name="description" content="${esc(o.desc)}"><link rel="canonical" href="${esc(canonical)}">
<meta property="og:type" content="article"><meta property="og:site_name" content="CodeCV"><meta property="og:title" content="${esc(o.title)}"><meta property="og:description" content="${esc(o.desc)}"><meta property="og:url" content="${esc(canonical)}">${o.ogImage ? `<meta property="og:image" content="${esc(o.ogImage)}">` : ''}
<meta name="twitter:card" content="summary_large_image"><link rel="icon" href="/favicon.svg">
${o.extraHead || ''}<style>${CSS}</style>${o.ld.map(ldScript).join('')}</head><body>
<header class="top"><div class="wrap"><a class="logo" href="/">CodeCV</a><nav><a href="/jianli">职业简历</a><a href="/gallery">简历广场</a><a href="/t/10front_end">模板</a></nav><span class="sp"></span><a class="btn" href="/">免费制作简历</a></div></header>
<main class="wrap">${crumbsHtml(o.crumbs)}${o.body}</main>${footer()}</body></html>`
  return new Response(html, { status: o.status || 200, headers: { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'public, max-age=600, s-maxage=3600' } })
}

export const notFound = (origin: string) => page({ origin, path: '/jianli', title: '页面不存在 | CodeCV', desc: '该职业简历页不存在', crumbs: [{ name: '首页', url: '/' }, { name: '职业简历', url: '/jianli' }], ld: [], status: 404,
  body: `<section class="card"><h1>页面不存在</h1><p>可以从<a href="/jianli">职业简历导航</a>重新选择。</p></section>` })
