// 投递进度看板：新增投递 + 状态流推进
import { useEffect, useState } from 'react'
import { api } from '../../core/api/client'

const STAGES = ['已投递', '筛选中', '笔试', '一面', '二面', '三面', 'Offer', '流程终止']

export default function ProgressPage() {
  const [list, setList] = useState<any[]>([])
  const [f, setF] = useState<any>({ status: '已投递' })
  const [resumes, setResumes] = useState<any[]>([])
  const load = () => api.progressList().then(setList).catch(() => {})
  useEffect(() => { load(); api.resumes().then(setResumes).catch(() => {}) }, [])
  const rTitle = (id: string) => resumes.find(r => r.id === id)?.title
  return (
    <div className="p-6 max-w-5xl mx-auto">
      <h2 className="text-lg font-semibold mb-4">投递进度（{list.length}）</h2>
      <div className="flex gap-2 mb-4 text-xs flex-wrap">
        <input className="border rounded px-2 py-1" aria-label="公司" placeholder="公司" onChange={e => setF({ ...f, name: e.target.value })} />
        <input className="border rounded px-2 py-1" aria-label="岗位" placeholder="岗位" onChange={e => setF({ ...f, post: e.target.value })} />
        <input className="border rounded px-2 py-1" aria-label="工作地点" placeholder="工作地点" onChange={e => setF({ ...f, workLocation: e.target.value })} />
        <input className="border rounded px-2 py-1" aria-label="渠道" placeholder="渠道" onChange={e => setF({ ...f, channel: e.target.value })} />
        <select aria-label="绑定简历" className="border rounded px-2 py-1" value={f.resumeId || ''} onChange={e => setF({ ...f, resumeId: e.target.value })}>
          <option value="">绑定简历…</option>
          {resumes.map(r => <option key={r.id} value={r.id}>{r.title}</option>)}
        </select>
        <button className="bg-black text-white rounded px-3" onClick={async () => { await api.addProgress(f); load() }}>+ 投递</button>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {list.map(p => (
          <div key={p.id} className="border rounded-lg p-3 bg-white text-sm">
            <div className="font-medium">{p.name}</div>
            <div className="text-xs text-neutral-500">{p.post} · {p.workLocation}</div>
            <div className="text-[10px] text-neutral-400">{p.channel} · 更新 {new Date(p.update_time).toLocaleDateString()}</div>
            <select aria-label="投递状态" className="mt-2 border rounded px-1 py-0.5 text-xs w-full" value={p.status}
              onChange={async e => { await api.updateProgress(p.id, { status: e.target.value }); load() }}>
              {STAGES.map(x => <option key={x}>{x}</option>)}
            </select>
            <select aria-label="绑定简历" className="mt-1 border rounded px-1 py-0.5 text-xs w-full" value={p.resumeId || ''}
              onChange={async e => { await api.updateProgress(p.id, { resumeId: e.target.value || null }); load() }}>
              <option value="">未绑定简历</option>
              {resumes.map(r => <option key={r.id} value={r.id}>{r.title}</option>)}
            </select>
            {p.resumeId && <a className="text-[10px] text-blue-500" href={`/?r=${p.resumeId}`}>打开绑定简历：{rTitle(p.resumeId) || p.resumeId.slice(0,6)}</a>}
            <button className="text-[10px] text-red-400 mt-1 block" onClick={async () => { await api.delProgress(p.id); load() }}>删除</button>
          </div>))}
      </div>
    </div>
  )
}
