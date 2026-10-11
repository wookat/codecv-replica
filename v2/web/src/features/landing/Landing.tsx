// 落地页：无登录可见 — Hero + 模板缩略图墙 + 功能卖点 + CTA
import catalog from '../templates/catalog.json'

export default function Landing({ onEnter }: { onEnter: () => void }) {
  const ids = Object.keys(catalog).slice(0, 12)
  return (
    <div className="min-h-screen bg-white">
      <nav className="flex items-center justify-between px-8 py-4 border-b">
        <span className="font-bold text-lg">CodeCV</span>
        <button className="bg-black text-white rounded-lg px-4 py-2 text-sm" onClick={onEnter}>进入工作台</button>
      </nav>
      <section className="text-center py-16 px-6">
        <h1 className="text-4xl font-bold mb-4">一份大简历库，生成所有岗位的简历</h1>
        <p className="text-neutral-500 max-w-2xl mx-auto mb-8">
          把全部经历/项目/奖项维护成「大简历」，每个条目可写多个版本——投前端用前端版写法、投后端用后端版写法。
          按 JD 智能选取，114 套中文模板一键套用，AI 助手（Codex/Cursor 走 MCP）一句话帮你成稿。
        </p>
        <div className="flex gap-3 justify-center">
          <button className="bg-black text-white rounded-lg px-6 py-3" onClick={onEnter}>免费开始</button>
        </div>
      </section>
      <section className="px-8 pb-8">
        <h2 className="text-center font-semibold mb-6">114 套中文简历模板</h2>
        <div className="grid grid-cols-3 md:grid-cols-6 gap-3 max-w-5xl mx-auto">
          {ids.map(id => (
            <a key={id} href={`/t/${id}`} title={(catalog as any)[id].name}>
              <img src={`/api/v2/thumb/${id}`} loading="lazy" alt={(catalog as any)[id].name}
                className="rounded border aspect-[3/4] object-cover bg-neutral-100 hover:shadow-md transition" />
            </a>
          ))}
        </div>
        <p className="text-center text-xs text-neutral-400 mt-4">还有 {Object.keys(catalog).length - 12} 套…</p>
      </section>
      <section className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto px-8 py-12 text-sm">
        <div><b>多版本条目库</b><p className="text-neutral-500 mt-1">同一项目按岗位写多版，选取即拼装，告别复制粘贴改简历。</p></div>
        <div><b>AI 优先（MCP）</b><p className="text-neutral-500 mt-1">Codex/Cursor 直连：读库→按 JD 选取→成稿→视觉自查→导出，一句话完成。</p></div>
        <div><b>多格式导出</b><p className="text-neutral-500 mt-1">PDF / PNG / docx，中文排版与字体全真还原，还能生成公开分享链接。</p></div>
      </section>
      <footer className="text-center text-xs text-neutral-400 py-6 border-t">CodeCV · zalize.com</footer>
    </div>
  )
}
