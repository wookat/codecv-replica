// AI 对话式建库：访谈官多轮提问 → 结构化条目 + 多版本 → 一键入大简历
import { useRef, useState } from 'react'
import { api } from '../../core/api/client'

interface Msg { role: 'user' | 'assistant'; content: string }

export default function BuilderChat({ masterId, onDone }: { masterId: string; onDone: () => void }) {
  const [msgs, setMsgs] = useState<Msg[]>([{ role: 'assistant', content: '你好，我来帮你建大简历库。先说说你的教育背景？（学校/专业/学历/时间）' }])
  const [input, setInput] = useState('')
  const [busy, setBusy] = useState(false)
  const [items, setItems] = useState<any[] | null>(null)
  const [saved, setSaved] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)

  const send = async () => {
    const text = input.trim(); if (!text || busy) return
    const next = [...msgs, { role: 'user' as const, content: text }]
    setMsgs(next); setInput(''); setBusy(true)
    try {
      const r = await api.masterChat(next)
      setMsgs([...next, { role: 'assistant', content: r.reply }])
      if (r.items?.length) setItems(r.items)
    } catch (e) { setMsgs([...next, { role: 'assistant', content: '出了点问题，再说一次？' }]) }
    setBusy(false); inputRef.current?.focus()
  }

  const commit = async () => {
    if (!items) return
    for (const it of items) {
      const row = await api.createItem(masterId, { section: it.section || 'other', title: it.title || '未命名' })
      for (const v of (it.variants?.length ? it.variants : [{ label: '默认', contentMd: '-' }]))
        await api.createVariant(row.id, { label: v.label || '默认', contentMd: v.contentMd || '-' })
      setSaved(n => n + 1)
    }
    setItems(null); onDone()
  }

  return (
    <div className="max-w-2xl mx-auto p-6 flex flex-col h-[calc(100vh-60px)]">
      <h2 className="text-lg font-semibold mb-3">AI 建库访谈</h2>
      <div className="flex-1 overflow-auto space-y-3 border rounded-lg bg-white p-4">
        {msgs.map((m, i) => (
          <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[80%] rounded-lg px-3 py-2 text-sm whitespace-pre-wrap ${m.role === 'user' ? 'bg-blue-600 text-white' : 'bg-neutral-100'}`}>{m.content}</div>
          </div>))}
        {busy && <div className="text-xs text-neutral-400">AI 思考中…</div>}
      </div>
      {items && (
        <div className="border rounded-lg p-3 mt-3 bg-green-50 text-sm">
          AI 已整理出 <b>{items.length}</b> 条条目（共 {items.reduce((n, i) => n + (i.variants?.length || 1), 0)} 个版本）：
          <div className="text-xs text-neutral-600 my-1">{items.map(i => i.title).join('、')}</div>
          <button className="bg-green-600 text-white rounded px-4 py-1 text-sm" onClick={commit}>
            {saved ? `已入库 ${saved}…` : '一键入大简历'}</button>
        </div>)}
      <div className="flex gap-2 mt-3">
        <input ref={inputRef} className="flex-1 border rounded px-3 py-2 text-sm" placeholder="回答 AI 的问题…"
          value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && send()} />
        <button className="bg-black text-white rounded px-5" disabled={busy} onClick={send}>发送</button>
      </div>
    </div>
  )
}
