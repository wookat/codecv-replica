// /jianli/:slug/zenmexie 「XX简历怎么写」指南页（Article + FAQPage + Breadcrumb）
import { bySlug } from '../../_seo/data'
import { page, esc, breadcrumbLd, faqLd, faqHtml, articleLd, tplCard, tplName, notFound } from '../../_seo/render'

export const onRequestGet: PagesFunction = async (context) => {
  const origin = new URL(context.request.url).origin
  const o = bySlug(String(context.params.slug))
  if (!o) return notFound(origin)
  const path = `/jianli/${o.slug}/zenmexie`
  const crumbs = [{ name: '首页', url: '/' }, { name: '职业简历', url: '/jianli' }, { name: `${o.name}简历模板`, url: `/jianli/${o.slug}` }, { name: `${o.name}简历怎么写`, url: path }]
  const main = o.example.tpl
  const title = `${o.name}简历怎么写？结构、技能、项目写法与${o.rewrites.length}组改写示例`
  const body = `<article><section class="hero"><h1>${esc(title)}</h1><p class="lead">${esc(o.intro)}</p><p class="meta">${esc(o.audience)} · 更新于 ${esc(o.updated)}</p>
<div class="cta-bar"><a class="btn lg" href="/jianli/${o.slug}/fanwen">先看完整范文</a><a class="btn ghost" href="/?tpl=${esc(main)}">用模板直接开写</a></div>
<nav class="toc card" aria-label="目录"><b>本文目录：</b>${o.sections.map((s, i) => `<a href="#s${i + 1}">${esc(s.h)}</a>`).join('')}<a href="#rewrite">改写示例</a><a href="#faq">常见问题</a></nav></section>
${o.sections.map((s, i) => `<section class="card" id="s${i + 1}"><h2>${esc(s.h)}</h2>${(s.p || []).map(p => `<p>${esc(p)}</p>`).join('')}${s.bullets ? `<ul>${s.bullets.map(b => `<li>${esc(b)}</li>`).join('')}</ul>` : ''}</section>`).join('')}
<section class="card" id="rewrite"><h2>改前 / 改后：${esc(o.name)}简历句子怎么改</h2>${o.rewrites.map(r => `<div class="cmp"><div class="bad"><b>改前</b>${esc(r.bad)}</div><div class="good"><b>改后</b>${esc(r.good)}</div></div>`).join('')}</section>
<section class="card"><h2>按这个写法准备好的模板</h2><p>下面的模板示例稿本身就是按上文结构写的，套用后替换内容即可：</p><div class="grid">${o.templates.slice(0, 3).map(id => tplCard(id)).join('')}</div>
<p style="margin-top:12px"><a href="/jianli/${o.slug}">查看全部 ${o.templates.length} 套${esc(o.name)}简历模板 →</a></p></section>
${faqHtml(o.guideFaqs, `${o.name}简历写作常见问题`)}
<section class="card"><h2>相关职业</h2><div class="chips">${o.related.map(s => bySlug(s)).filter(Boolean).map(r => `<a href="/jianli/${r!.slug}/zenmexie">${esc(r!.name)}简历怎么写</a>`).join('')}<a href="/jianli">全部职业 →</a></div></section></article>`
  const desc = `${o.name}简历怎么写：推荐结构、技能栏写法、项目经历 STAR 写法、量化指标与常见扣分项，附 ${o.rewrites.length} 组改前改后示例、完整范文与「${tplName(main)}」模板。`
  const ld = [articleLd(origin, { url: path, headline: title, desc, updated: o.updated, image: `${origin}/api/v2/thumb/${main}` }), breadcrumbLd(origin, crumbs), faqLd(o.guideFaqs)]
  return page({ origin, path, crumbs, body, ld, ogImage: `${origin}/api/v2/thumb/${main}`, title: `${o.name}简历怎么写？结构/技能/项目写法+改写示例 | CodeCV`, desc })
}
