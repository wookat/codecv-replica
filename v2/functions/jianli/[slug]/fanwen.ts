// /jianli/:slug/fanwen 职业简历范文页：真实示例稿按原模板皮肤 SSR 渲染（Article + FAQPage + Breadcrumb）
import { bySlug } from '../../_seo/data'
import { templateSeed, renderPaper } from '../../_paper'
import { page, esc, breadcrumbLd, faqLd, faqHtml, articleLd, tplCard, tplName, notFound } from '../../_seo/render'

export const onRequestGet: PagesFunction = async (context) => {
  const origin = new URL(context.request.url).origin
  const env: any = context.env
  const o = bySlug(String(context.params.slug))
  if (!o) return notFound(origin)
  const ex = o.example
  const seedUrl = ex.src === 'ex' ? `/seeds/ex/${ex.seed}.json` : `/seeds/tpl/${ex.seed}.json`
  const r = await env.ASSETS.fetch(new URL(seedUrl, context.request.url))
  if (!r.ok) return new Response('范文不存在', { status: 404 })
  const d: any = await r.json()
  const md: string = String(d.content || '')
  // 与编辑器/导出同一纸面：renderPaper=convertResumeDOM(resume-module)+fontMark+种子样式；
  // ex 种子只带部分样式字段，缺失项（avatar/primaryBgColor/lineHeight）回退到它挂的模板 seed
  let styleSeed: any = d
  if (ex.src === 'ex') {
    try {
      const tplSeed: any = await templateSeed(env, context.request.url, ex.tpl)
      styleSeed = { ...tplSeed }
      for (const k of ['primaryColor', 'primaryBgColor', 'font', 'lineHeight', 'avatar'])
        if (d[k] !== undefined) styleSeed[k] = d[k]
    } catch {}
  }
  const paper = renderPaper(md, styleSeed)
  const path = `/jianli/${o.slug}/fanwen`
  const crumbs = [{ name: '首页', url: '/' }, { name: '职业简历', url: '/jianli' }, { name: `${o.name}简历模板`, url: `/jianli/${o.slug}` }, { name: `${o.name}简历范文`, url: path }]
  const editHref = `/?tpl=${esc(ex.tpl)}&ex=${esc(ex.src === 'ex' ? ex.seed : 'tpl:' + ex.seed)}`
  const words = md.replace(/[#*`:>\-\s|]/g, '').length
  const body = `<article><section class="hero"><h1>${esc(ex.title)}</h1><p class="lead">${esc(ex.note)}</p>
<p class="meta">模板：<a href="/t/${esc(ex.tpl)}">${esc(tplName(ex.tpl))}</a> · 约 ${words} 字 · 更新于 ${esc(o.updated)}</p>
<div class="cta-bar"><a class="btn lg" href="${editHref}">用此模板编辑这份范文</a><a class="btn ghost" href="/jianli/${o.slug}/zenmexie">${esc(o.name)}简历怎么写</a><a class="lnk" href="/jianli/${o.slug}">更多${esc(o.name)}模板 →</a></div></section>
<div class="paper-wrap">${paper}</div>
<section class="card"><h2>这份${esc(o.name)}简历范文好在哪</h2><ul>${ex.points.map(p => `<li>${esc(p)}</li>`).join('')}</ul>
<p>逐段写法与更多改写示例见 <a href="/jianli/${o.slug}/zenmexie">${esc(o.name)}简历怎么写</a>。</p></section>
<section class="card"><h2>换一套皮肤试试</h2><div class="grid">${o.templates.slice(0, 3).map(id => tplCard(id)).join('')}</div></section>
${faqHtml(o.exampleFaqs, '关于这份范文')}
<section class="card"><h2>其他职业范文</h2><div class="chips">${o.related.map(s => bySlug(s)).filter(Boolean).map(r => `<a href="/jianli/${r!.slug}/fanwen">${esc(r!.name)}简历范文</a>`).join('')}<a href="/jianli">全部职业 →</a></div></section></article>`
  const desc = `${ex.title}：完整的${o.name}简历示例稿（教育/经历/项目/技能全模块），按「${tplName(ex.tpl)}」模板真实渲染，可一键套用编辑并导出 PDF/Word。`
  const ld = [articleLd(origin, { url: path, headline: ex.title, desc, updated: o.updated, image: `${origin}/api/v2/thumb/${ex.tpl}` }), breadcrumbLd(origin, crumbs), faqLd(o.exampleFaqs)]
  const extraHead = `<link rel="stylesheet" href="/common.css"><link rel="stylesheet" href="/fonts/iconfont.css"><link rel="stylesheet" href="/fonts/resume-fonts.css"><link rel="stylesheet" href="/css/style_${esc(ex.tpl)}.css">`
  return page({ origin, path, crumbs, body, ld, extraHead, ogImage: `${origin}/api/v2/thumb/${ex.tpl}`, title: `${ex.title}（可直接套用）| CodeCV`, desc })
}
