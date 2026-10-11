import { Suspense, lazy, useEffect, useState } from 'react'
import { api } from './core/api/client'
import TemplateGallery from './features/templates/TemplateGallery'
import ResumeList from './features/resume/ResumeList'
import PublicResume from './features/resume/PublicResume'
import Landing from './features/landing/Landing'
import GalleryPage from './features/gallery/GalleryPage'

const EditorPage = lazy(() => import('./features/resume/EditorPage'))
const VipPage = lazy(() => import('./features/vip/VipPage'))
const AdminPage = lazy(() => import('./features/admin/AdminPage'))
const CommunityPage = lazy(() => import('./features/community/CommunityPage'))
const ProgressPage = lazy(() => import('./features/progress/ProgressPage'))
const BuilderChat = lazy(() => import('./features/builder/BuilderChat'))
const L = <div className="p-10 text-center text-neutral-400 text-sm">加载中…</div>

export default function App() {
  const inv = new URLSearchParams(location.search).get('inv')
  if (inv) localStorage.setItem('v2:inviter', inv)
  const pubMatch = location.pathname.match(/^\/r\/([\w-]+)/)
  const landing = location.pathname === '/' && !localStorage.getItem('v2:token') && !location.search.includes('login')
  if (pubMatch) return <PublicResume id={pubMatch[1]} />
  if (location.pathname === '/gallery') return <GalleryPage />
  if (landing) return <Landing onEnter={() => { location.href = '/?login' }} />
  const [token, setToken] = useState(localStorage.getItem('v2:token'))
  const [user, setUser] = useState('')
  const [pass, setPass] = useState('')
  const [masters, setMasters] = useState<any[]>([])
  const [masterId, setMasterId] = useState('')
  const [page, setPage] = useState<'templates' | 'editor' | 'resumes' | 'vip' | 'admin' | 'community' | 'progress' | 'builder'>('templates')
  const [dark, setDark] = useState(localStorage.getItem('v2:theme') === 'dark')
  useEffect(() => {
    document.documentElement.classList.toggle('cv-dark', dark)
    localStorage.setItem('v2:theme', dark ? 'dark' : 'light')
  }, [dark])
  const [templateId, setTemplateId] = useState(() => new URLSearchParams(location.search).get('tpl') || '')
  const sp = new URLSearchParams(location.search)
  const [resumeId, setResumeId] = useState<string | undefined>(sp.get('r') || undefined)
  const [regMode, setRegMode] = useState(false)
  const [importing, setImporting] = useState(false)
  useEffect(() => { if (resumeId) setPage('editor') }, [])
  const [err, setErr] = useState('')

  useEffect(() => {
    if (token) api.masters().then(ms => {
      setMasters(ms)
      if (ms.length && !masterId) setMasterId(ms[0].id)
    }).catch(e => setErr(String(e)))
  }, [token])

  if (!token) return (
    <div className="min-h-screen flex items-center justify-center" style={{background:"var(--cv-bg)"}}>
      <form className="bg-white p-8 rounded-xl shadow space-y-4 w-80" onSubmit={async e => {
        e.preventDefault()
        try {
          const r = regMode ? await api.register(user, pass, localStorage.getItem('v2:inviter') || undefined) : await api.login(user, pass)
          if (regMode) localStorage.removeItem('v2:inviter')
          localStorage.setItem('v2:token', r.token)
          setToken(r.token)
        } catch (ex: any) { setErr((regMode ? '注册失败' : '登录失败') + '：' + String(ex).slice(0, 80)) }
      }}>
        <h1 className="text-xl font-bold">CodeCV v2 {regMode ? '注册' : '登录'}</h1>
        {regMode && localStorage.getItem('v2:inviter') &&
          <p className="text-xs text-green-600">通过 {localStorage.getItem('v2:inviter')} 的邀请注册</p>}
        <input className="w-full border rounded px-3 py-2" placeholder="用户名" value={user} onChange={e => setUser(e.target.value)} />
        <input className="w-full border rounded px-3 py-2" type="password" placeholder="密码" value={pass} onChange={e => setPass(e.target.value)} />
        {err && <p className="text-red-500 text-sm">{err}</p>}
        <button className="w-full cv-btn cv-btn-primary justify-center py-2.5">{regMode ? '注册并登录' : '登录'}</button>
        <button type="button" className="w-full text-xs text-neutral-500"
          onClick={() => { setRegMode(!regMode); setErr('') }}>{regMode ? '已有账号？去登录' : '没有账号？注册'}</button>
      </form>
    </div>
  )

  if (page === 'editor' && (templateId || resumeId))
    return <Suspense fallback={L}><EditorPage templateId={templateId || ''} masterId={masterId} resumeId={resumeId}
      onBack={() => { setResumeId(undefined); setPage(resumeId ? 'resumes' : 'templates') }} /></Suspense>

  return (
    <div className="min-h-screen" style={{background:"var(--cv-bg)"}}>
      <div className="border-b border-[var(--cv-line)] bg-white px-3 sm:px-6 py-2.5 flex items-center gap-1 sm:gap-2 flex-wrap sticky top-0 z-30">
        <h1 className="font-bold text-base mr-2">CodeCV</h1>
        <button className={`cv-nav ${page === 'templates' ? 'cv-nav-on' : ''}`}
          onClick={() => setPage('templates')}>模板中心</button>
        <button className={`cv-nav ${page === 'resumes' ? 'cv-nav-on' : ''}`}
          onClick={() => setPage('resumes')}>我的简历</button>
        <button className={`cv-nav ${page === 'vip' ? 'cv-nav-on' : ''}`}
          onClick={() => setPage('vip')}>会员</button>
        <button className={`cv-nav ${page === 'admin' ? 'cv-nav-on' : ''}`}
          onClick={() => setPage('admin')}>后台</button>
        <button className={`cv-nav ${page === 'community' ? 'cv-nav-on' : ''}`}
          onClick={() => setPage('community')}>社区</button>
        <button className={`cv-nav ${page === 'progress' ? 'cv-nav-on' : ''}`}
          onClick={() => setPage('progress')}>投递</button>
        {templateId && page !== 'editor' && <button className="cv-nav cv-nav-on" onClick={() => setPage('editor')}>继续编辑</button>}
        <select aria-label="选择大简历" className="cv-input" value={masterId} onChange={e => setMasterId(e.target.value)}>
          {masters.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
        </select>
        <button className="cv-btn cv-btn-ghost" onClick={async () => {
          const m = await api.createMaster('大简历 ' + (masters.length + 1))
          setMasters([...masters, m]); setMasterId(m.id)
        }}>+ 新建大简历</button>
        <button className="cv-btn cv-btn-primary"
          onClick={() => setPage('builder')}>AI 建库</button>
        <button className="cv-btn cv-btn-ghost" title="切换深色模式" onClick={() => setDark(!dark)}>{dark ? '☀️' : '🌙'}</button>
        <label className="cv-btn cv-btn-ghost cursor-pointer">
          {importing ? '导入中…' : '导入简历建库'}
          <input type="file" accept=".pdf,.docx,.txt,.md" className="hidden" onChange={async e => {
            const f = e.target.files?.[0]; if (!f) return
            setImporting(true)
            try {
              const buf = new Uint8Array(await f.arrayBuffer())
              let bin = ''; for (let i = 0; i < buf.length; i += 0x8000) bin += String.fromCharCode(...buf.subarray(i, i + 0x8000))
              const m = await api.importMaster({ filename: f.name, data: btoa(bin) })
              const ms = await api.masters(); setMasters(ms); setMasterId(m.id)
              setErr('')
            } catch (ex) { setErr('导入失败：' + String(ex).slice(0, 120)) }
            setImporting(false); e.target.value = ''
          }} />
        </label>
        {err && <span className="text-xs text-red-500">{err}</span>}
      </div>
      <main aria-label="主要内容">
      {page === 'templates'
        ? <TemplateGallery onPick={id => { setResumeId(undefined); setTemplateId(id); setPage('editor') }} />
        : page === 'resumes'
        ? <ResumeList onEdit={id => { setTemplateId(''); setResumeId(id); setPage('editor') }} />
        : page === 'vip' ? <Suspense fallback={L}><VipPage /></Suspense> : page === 'admin' ? <Suspense fallback={L}><AdminPage /></Suspense> : page === 'community' ? <Suspense fallback={L}><CommunityPage /></Suspense> : page === 'progress' ? <Suspense fallback={L}><ProgressPage /></Suspense>
        : <Suspense fallback={L}><BuilderChat masterId={masterId} onDone={() => setPage('templates')} /></Suspense>}
      </main>
    </div>
  )
}
