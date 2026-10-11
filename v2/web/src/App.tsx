import { useEffect, useState } from 'react'
import { api } from './core/api/client'
import TemplateGallery from './features/templates/TemplateGallery'
import EditorPage from './features/resume/EditorPage'

export default function App() {
  const [token, setToken] = useState(localStorage.getItem('v2:token'))
  const [user, setUser] = useState('')
  const [pass, setPass] = useState('')
  const [masters, setMasters] = useState<any[]>([])
  const [masterId, setMasterId] = useState('')
  const [page, setPage] = useState<'templates' | 'editor'>('templates')
  const [templateId, setTemplateId] = useState('')
  const [err, setErr] = useState('')

  useEffect(() => {
    if (token) api.masters().then(ms => {
      setMasters(ms)
      if (ms.length && !masterId) setMasterId(ms[0].id)
    }).catch(e => setErr(String(e)))
  }, [token])

  if (!token) return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-50">
      <form className="bg-white p-8 rounded-xl shadow space-y-4 w-80" onSubmit={async e => {
        e.preventDefault()
        try {
          const r = await api.login(user, pass)
          localStorage.setItem('v2:token', r.token)
          setToken(r.token)
        } catch { setErr('登录失败') }
      }}>
        <h1 className="text-xl font-bold">CodeCV v2 登录</h1>
        <input className="w-full border rounded px-3 py-2" placeholder="用户名" value={user} onChange={e => setUser(e.target.value)} />
        <input className="w-full border rounded px-3 py-2" type="password" placeholder="密码" value={pass} onChange={e => setPass(e.target.value)} />
        {err && <p className="text-red-500 text-sm">{err}</p>}
        <button className="w-full bg-black text-white rounded py-2">登录</button>
      </form>
    </div>
  )

  if (page === 'editor' && templateId && masterId)
    return <EditorPage templateId={templateId} masterId={masterId} onBack={() => setPage('templates')} />

  return (
    <div className="min-h-screen bg-neutral-50">
      <div className="border-b bg-white px-6 py-3 flex items-center gap-4">
        <span className="font-bold">CodeCV v2</span>
        <select className="border rounded px-2 py-1 text-sm" value={masterId} onChange={e => setMasterId(e.target.value)}>
          {masters.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
        </select>
        <button className="text-sm border rounded px-2 py-1" onClick={async () => {
          const m = await api.createMaster('大简历 ' + (masters.length + 1))
          setMasters([...masters, m]); setMasterId(m.id)
        }}>+ 新建大简历</button>
      </div>
      <TemplateGallery onPick={id => { setTemplateId(id); setPage('editor') }} />
    </div>
  )
}
