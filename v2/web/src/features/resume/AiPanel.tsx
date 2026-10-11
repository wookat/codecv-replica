// 编辑器 AI 面板：对当前 md 生成/润色/校对/翻译，结果可替换/追加
import { useState } from 'react'
import { api } from '../../core/api/client'

export default function AiPanel({ md, onApply, onClose }: {
  md: string; onApply: (md: string, mode: 'replace' | 'append') => void; onClose: () => void
}) {
  const [jd, setJd] = useState('')
  const [cmd, setCmd] = useState('')
  const [busy, setBusy] = useState('')
  const [out, setOut] = useState('')
  const [lastAction, setLastAction] = useState('')
  const run = async (a: string) => {
    setBusy(a); setOut('')
    try { const j = a === 'edit' ? cmd : (a === 'fix' ? (lastAction === 'score' && out ? out.slice(0, 2000) : jd) : jd); setOut((await api.ai(a, md, j)).text); setLastAction(a) } catch (e) { setOut('失败：' + String(e).slice(0, 100)) }
    setBusy('')
  }
  return (
    <div className="fixed right-4 bottom-4 w-96 max-w-[90vw] border rounded-lg shadow-lg p-3 bg-white text-sm space-y-2 z-50">
      <div className="flex items-center gap-2">
        <b>AI 助手</b>
        <button className="text-xs text-neutral-400 ml-auto" onClick={onClose}>收起</button>
      </div>
      <input className="w-full border rounded px-2 py-1 text-xs" placeholder="目标岗位 JD（生成/翻译语言可选）" value={jd} onChange={e => setJd(e.target.value)} />
      <div className="flex gap-2">
        <input className="flex-1 border rounded px-2 py-1 text-xs" placeholder="说句话就改：如「项目改成突出高并发」"
          value={cmd} onChange={e => setCmd(e.target.value)} />
        <button className="bg-green-600 text-white rounded px-2 py-1 text-xs" disabled={!!busy || !cmd.trim()}
          onClick={() => { setJd(cmd); run('edit') }}>{busy === 'edit' ? '…' : '改稿'}</button>
      </div>
      <div className="flex gap-2 flex-wrap">
        {[['gen', '生成'], ['perf', '润色'], ['proof', '校对'], ['score', '评分'], ['fix', '按评分修复'], ['translate', '翻译']].map(([a, l]) => (
          <button key={a} className="border rounded px-2 py-1 text-xs" disabled={!!busy} onClick={() => run(a)}>
            {busy === a ? '…' : l}
          </button>
        ))}
      </div>
      {out && busy !== 'score' && lastAction !== 'score' && (
        <>
          <pre className="whitespace-pre-wrap border rounded p-2 text-xs max-h-48 overflow-auto bg-white">{out}</pre>
          <div className="flex gap-2">
            <button className="bg-black text-white rounded px-2 py-1 text-xs" onClick={() => onApply(out, 'replace')}>替换全文</button>
            <button className="border rounded px-2 py-1 text-xs" onClick={() => onApply(out, 'append')}>追加到末尾</button>
          </div>
        </>
      )}
    </div>
  )
}
