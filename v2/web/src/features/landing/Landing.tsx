// 落地页：无登录可见 — 渐变 Hero + 模板墙 + 卖点 + CTA
import catalog from '../templates/catalog.json'

export default function Landing({ onEnter }: { onEnter: () => void }) {
  const ids = Object.keys(catalog).slice(0, 12)
  return (
    <div className="min-h-screen cv-hero">
      <nav className="flex items-center justify-between px-8 py-3.5 cv-glass border-b border-[var(--cv-line)] sticky top-0 z-30">
        <span className="font-bold text-lg">CodeCV</span>
        <div className="flex items-center gap-2">
          <a href="/gallery" className="cv-btn cv-btn-ghost">简历广场</a>
          <button className="cv-btn cv-btn-primary" onClick={onEnter}>进入工作台</button>
        </div>
      </nav>
      <section className="text-center pt-20 pb-14 px-6">
        <div className="inline-block cv-chip mb-5" style={{background:"var(--cv-brand-soft)",color:"var(--cv-brand)",fontWeight:600}}>
          AI 优先 · MCP 直连 Codex / Cursor
        </div>
        <h1 className="text-5xl font-extrabold mb-5 tracking-tight">一份大简历库，<br /><span className="cv-grad">生成所有岗位</span>的简历</h1>
        <p className="cv-sub max-w-2xl mx-auto mb-9 text-[15px] leading-7">
          把全部经历/项目/奖项维护成「大简历」，每个条目可写多个版本——投前端用前端版写法、投后端用后端版写法。
          按 JD 智能选取，114 套中文模板一键套用。
        </p>
        <div className="flex gap-3 justify-center">
          <button className="cv-btn cv-btn-primary cv-elev" style={{padding:"13px 34px",fontSize:15,borderRadius:12}} onClick={onEnter}>免费开始</button>
          <a href="/gallery" className="cv-btn cv-btn-ghost" style={{padding:"13px 24px",fontSize:15,borderRadius:12}}>看看别人做的</a>
        </div>
      </section>
      <section className="px-8 pb-10">
        <h2 className="text-center font-semibold mb-6">114 套中文简历模板</h2>
        <div className="grid grid-cols-3 md:grid-cols-6 gap-3 max-w-5xl mx-auto">
          {ids.map(id => (
            <a key={id} href={`/t/${id}`} title={(catalog as any)[id].name}>
              <img src={`/api/v2/thumb/${id}`} loading="lazy" alt={(catalog as any)[id].name}
                className="cv-card cv-card-hover rounded-lg aspect-[3/4] object-cover w-full" />
            </a>
          ))}
        </div>
        <p className="text-center text-xs cv-sub mt-4">还有 {Object.keys(catalog).length - 12} 套…</p>
      </section>
      <section className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto px-8 py-12 text-sm">
        <div className="cv-card cv-card-hover cv-elev p-5"><b style={{color:"var(--cv-brand)"}}>多版本条目库</b><p className="cv-sub mt-1">同一项目按岗位写多版，选取即拼装，告别复制粘贴改简历。</p></div>
        <div className="cv-card cv-card-hover cv-elev p-5"><b style={{color:"var(--cv-brand)"}}>AI 优先（MCP）</b><p className="cv-sub mt-1">Codex/Cursor 直连：读库→按 JD 选取→成稿→视觉自查→导出，一句话完成。</p></div>
        <div className="cv-card cv-card-hover cv-elev p-5"><b style={{color:"var(--cv-brand)"}}>多格式导出</b><p className="cv-sub mt-1">PDF / PNG / docx，中文排版与字体全真还原，还能生成公开分享链接。</p></div>
      </section>
      <footer className="text-center text-xs cv-sub py-6 border-t" style={{borderColor:"var(--cv-line)"}}>CodeCV · zalize.com</footer>
    </div>
  )
}
