// /jianli/:slug 职业简历模板页（ItemList + FAQPage + Breadcrumb）
import { bySlug } from '../../_seo/data'
import { page, esc, breadcrumbLd, faqLd, faqHtml, tplCard, tplListLd, tplName, notFound } from '../../_seo/render'

export const onRequestGet: PagesFunction = async (context) => {
  const origin = new URL(context.request.url).origin
  const o = bySlug(String(context.params.slug))
  if (!o) return notFound(origin)
  const path = `/jianli/${o.slug}`
  const crumbs = [{ name: '首页', url: '/' }, { name: '职业简历', url: '/jianli' }, { name: `${o.name}简历模板`, url: path }]
  const main = o.templates[0]
  const body = `<section class="hero"><h1>${esc(o.name)}简历模板（${o.templates.length} 套免费可编辑）</h1>
<p class="lead">${esc(o.intro)}</p><p class="meta">${esc(o.audience)} · 更新于 ${esc(o.updated)}</p>
<div class="cta-bar"><a class="btn lg" href="/?tpl=${esc(main)}">用「${esc(tplName(main))}」开始写</a><a class="btn ghost" href="${path}/fanwen">看${esc(o.name)}简历范文</a><a class="lnk" href="${path}/zenmexie">${esc(o.name)}简历怎么写 →</a></div></section>
<section><h2>推荐模板</h2><div class="grid">${o.templates.map((id, i) => tplCard(id, i === 0 ? '主推' : undefined)).join('')}</div></section>
<section class="card" style="margin-top:18px"><h2>${esc(o.name)}简历要突出什么</h2><ul>${o.highlights.map(h => `<li>${esc(h)}</li>`).join('')}</ul>
<p>完整写法见 <a href="${path}/zenmexie">${esc(o.name)}简历怎么写</a>，或直接参考 <a href="${path}/fanwen">${esc(o.name)}简历范文</a>。</p></section>
<section class="card"><h2>一句话改写示例</h2>${o.rewrites.slice(0, 2).map(r => `<div class="cmp"><div class="bad"><b>改前</b>${esc(r.bad)}</div><div class="good"><b>改后</b>${esc(r.good)}</div></div>`).join('')}</section>
${faqHtml(o.tplFaqs, `${o.name}简历模板常见问题`)}
<section class="card"><h2>相关职业</h2><div class="chips">${o.related.map(s => bySlug(s)).filter(Boolean).map(r => `<a href="/jianli/${r!.slug}">${esc(r!.name)}简历模板</a>`).join('')}<a href="/jianli">全部职业 →</a></div></section>`
  const ld = [tplListLd(origin, `${o.name}简历模板`, o.templates), breadcrumbLd(origin, crumbs), faqLd(o.tplFaqs),
    { '@context': 'https://schema.org', '@type': 'WebPage', name: `${o.name}简历模板`, url: origin + path, inLanguage: 'zh-CN', dateModified: o.updated, keywords: o.kw.join(',') }]
  return page({ origin, path, crumbs, body, ld, ogImage: `${origin}/api/v2/thumb/${main}`,
    title: `${o.name}简历模板免费下载（${o.templates.length}套可在线编辑）| CodeCV`,
    desc: `${o.name}简历模板 ${o.templates.length} 套，含「${tplName(main)}」等真实示例稿，在线编辑、一键导出 PDF/Word。附${o.name}简历怎么写要点与常见问题。` })
}
