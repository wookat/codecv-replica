// /jianli 职业简历导航：按职业分类聚合「模板 / 怎么写 / 范文」入口（CollectionPage + ItemList）
import { OCCUPATIONS, CATEGORIES } from '../_seo/data'
import { page, esc, breadcrumbLd, faqLd, faqHtml, tplCard } from '../_seo/render'

const FAQS = [
  { q: '职业简历模板和普通简历模板有什么区别？', a: '职业模板的示例稿、技能栏目与版式都是按该岗位的招聘习惯准备的：前端突出项目与技术栈，护士突出执业资格与科室经历。直接替换内容即可，比从空白开始快得多。' },
  { q: 'CodeCV 的简历模板免费吗？', a: '114 套模板全部免费在线编辑并导出 PDF / Word / PNG / Markdown；AI 改稿、按 JD 自动生成等为会员功能。' },
  { q: '找不到我的职业怎么办？', a: '职业页会持续增加。你可以先从相近职业页或模板列表挑选版式，内容按「怎么写」指南中的结构填写即可。' },
]

export const onRequestGet: PagesFunction = async (context) => {
  const origin = new URL(context.request.url).origin
  const crumbs = [{ name: '首页', url: '/' }, { name: '职业简历', url: '/jianli' }]
  const body = `<section class="hero"><h1>按职业找简历：模板 · 怎么写 · 范文</h1>
<p class="lead">每个职业提供三样东西：可直接套用的真实模板、按招聘习惯写的「简历怎么写」指南、以及一份完整的示例范文。全部免费在线编辑，支持 PDF / Word 导出。</p>
<div class="chips">${OCCUPATIONS.map(o => `<a href="/jianli/${o.slug}">${esc(o.name)}简历</a>`).join('')}</div></section>
${CATEGORIES.map(c => `<section class="card"><h2>${esc(c.name)}</h2>${c.items.map(o => `<div style="padding:10px 0;border-top:1px solid #eef0f4">
<h3><a href="/jianli/${o.slug}">${esc(o.name)}简历模板</a></h3><p style="color:#4b5563;margin:4px 0 8px">${esc(o.intro)}</p>
<div class="row" style="margin-top:4px"><a class="btn ghost" href="/jianli/${o.slug}">${esc(o.name)}简历模板（${o.templates.length} 套）</a><a class="lnk" href="/jianli/${o.slug}/zenmexie">${esc(o.name)}简历怎么写</a><a class="lnk" href="/jianli/${o.slug}/fanwen">${esc(o.name)}简历范文</a></div></div>`).join('')}</section>`).join('')}
<section><h2>各职业主推模板</h2><div class="grid">${OCCUPATIONS.map(o => tplCard(o.templates[0], o.name)).join('')}</div></section>
${faqHtml(FAQS)}`
  const ld = [
    { '@context': 'https://schema.org', '@type': 'CollectionPage', name: '按职业找简历模板与写法', url: origin + '/jianli', inLanguage: 'zh-CN',
      mainEntity: { '@type': 'ItemList', itemListElement: OCCUPATIONS.map((o, i) => ({ '@type': 'ListItem', position: i + 1, name: `${o.name}简历模板`, url: `${origin}/jianli/${o.slug}` })) } },
    breadcrumbLd(origin, crumbs), faqLd(FAQS),
  ]
  return page({ origin, path: '/jianli', crumbs, body, ld, ogImage: `${origin}/api/v2/thumb/${OCCUPATIONS[0].templates[0]}`,
    title: '按职业找简历模板与写法：前端/Java/数据分析/运营/护士 | CodeCV',
    desc: `CodeCV 职业简历导航：${OCCUPATIONS.map(o => o.name).join('、')}等职业的免费简历模板、简历怎么写指南与完整范文，在线编辑一键导出 PDF/Word。` })
}
