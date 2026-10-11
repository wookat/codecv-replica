// 我的简历：列表/改名/复制/删除/继续编辑
import { useEffect, useState } from 'react'
import { api } from '../../core/api/client'

export default function ResumeList({ onEdit }: { onEdit: (resumeId: string) => void }) {
  const [list, setList] = useState<any[]>([])
  const [err, setErr] = useState('')
  const load = () => api.resumes().then(setList).catch(e => setErr(String(e)))
  useEffect(() => { load() }, [])

  const rename = async (r: any) => {
    const t = prompt('简历标题', r.title)
    if (t === null) return
    await api.updateResume(r.id, { title: t }); load()
  }
  const copy = async (r: any) => {
    const n = await api.createResume({ templateId: r.templateId, title: r.title + ' 副本', masterId: r.masterId ?? undefined })
    const src = await api.resume(r.id)
    if (src.content_md || src.contentMd) await api.updateResume(n.id, { contentMd: src.content_md ?? src.contentMd })
    if (src.selections?.length)
      await api.saveSelections(n.id, src.selections.map((x: any) => ({ itemId: x.itemId, variantId: x.variantId, ord: x.ord })))
    load()
  }
  const del = async (r: any) => {
    if (!confirm(`删除「${r.title}」？`)) return
    await api.deleteResume(r.id); load()
  }

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <h2 className="text-lg font-semibold mb-4">我的简历（{list.length}）</h2>
      {err && <div className="text-red-500 text-sm mb-2">{err}</div>}
      {!list.length && <div className="text-neutral-400 text-sm">还没有简历——去模板中心挑一个模板建一份</div>}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {list.map(r => (
          <div key={r.id} className="border rounded-lg p-4 bg-white hover:shadow">
            <div className="font-medium truncate">{r.title || r.templateId}</div>
            <div className="text-xs text-neutral-400 mt-1">{r.templateId} · {new Date(r.updatedAt || r.updated_at || 0).toLocaleString()}</div>
            <div className="flex gap-2 mt-3 text-xs">
              <button className="bg-black text-white rounded px-2 py-1" onClick={() => onEdit(r.id)}>继续编辑</button>
              <button className="border rounded px-2 py-1" onClick={() => rename(r)}>改名</button>
              <button className="border rounded px-2 py-1" onClick={() => copy(r)}>复制</button>
              <button className="border rounded px-2 py-1 text-red-500" onClick={() => del(r)}>删除</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
