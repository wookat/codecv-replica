import { useEffect, useState } from 'react'
import { api } from './core/api/client'

export default function App() {
  const [token, setToken] = useState(localStorage.getItem('v2:token'))
  const [user, setUser] = useState('')
  const [pass, setPass] = useState('')
  const [masters, setMasters] = useState<any[]>([])
  const [err, setErr] = useState('')

  useEffect(() => {
    if (token) api.masters().then(setMasters).catch(e => setErr(String(e)))
  }, [token])

  if (!token) return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-50">
      <form className="bg-white p-8 rounded-xl shadow space-y-4 w-80" onSubmit={async e => {
        e.preventDefault()
        try {
          const r = await api.login(user, pass)
          localStorage.setItem('v2:token', r.token)
          setToken(r.token)
        } catch (e: any) { setErr('登录失败') }
      }}>
        <h1 className="text-xl font-bold">CodeCV v2 登录</h1>
        <input className="w-full border rounded px-3 py-2" placeholder="用户名" value={user} onChange={e => setUser(e.target.value)} />
        <input className="w-full border rounded px-3 py-2" type="password" placeholder="密码" value={pass} onChange={e => setPass(e.target.value)} />
        {err && <p className="text-red-500 text-sm">{err}</p>}
        <button className="w-full bg-black text-white rounded py-2">登录</button>
      </form>
    </div>
  )

  return (
    <div className="min-h-screen bg-neutral-50 p-8">
      <h1 className="text-2xl font-bold mb-4">我的大简历</h1>
      {err && <p className="text-red-500">{err}</p>}
      <button className="mb-4 bg-black text-white rounded px-4 py-2" onClick={async () => {
        const m = await api.createMaster('大简历 ' + (masters.length + 1))
        setMasters([...masters, m])
      }}>+ 新建大简历</button>
      <ul className="space-y-2">
        {masters.map(m => <li key={m.id} className="bg-white rounded p-4 shadow">{m.name} <span className="text-neutral-400 text-sm">{m.id.slice(0, 8)}</span></li>)}
      </ul>
    </div>
  )
}
