// 我的简历：列表/改名/复制/删除/继续编辑
import { useEffect, useState } from 'react'
import { api } from '../../core/api/client'

export default function ResumeList({ onEdit }: { onEdit: (resumeId: string) => void }) {
  const [list, setList] = useState<any[]>([])
  const [err, setErr] = useState('')
  const [sel, setSel] = useState<Set<string>>(new Set())
  const tog = (id: string) => { const n = new Set(sel); n.has(id) ? n.delete(id) : n.add(id); setSel(n) }
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
      <div className="flex items-center gap-3 mb-4 flex-wrap">
        <h2 className="text-lg font-semibold">我的简历（{list.length}）</h2>
        <button className="text-xs border rounded px-2 py-1" onClick={async () => {
          const r = await api.migrateV1().catch(e => ({ error: String(e) }) as any)
          alert(r.error ? '迁移失败：' + r.error : `迁移完成：新增 ${r.migrated} 份（v1 共 ${r.total} 份）`)
          load()
        }}>从旧站迁移简历</button>
        {sel.size > 0 && <div className="flex gap-2 text-xs flex-wrap">
          <button className="border rounded px-2 py-1" onClick={async () => {
            for (const id of sel) { const r = list.find(x => x.id === id)!; await copy(r) }
            setSel(new Set())
          }}>批量复制({sel.size})</button>
          <button className="border rounded px-2 py-1" onClick={async () => {
            for (const id of sel) {
              const src = await api.resume(id)
              const map = Object.fromEntries((src.extras ?? []).map((e: any) => [e.fieldKey, e.valueMd]))
              map.share_on = '1'; await api.saveExtras(id, map)
            }
            alert(`已批量开启 ${sel.size} 份分享`); setSel(new Set()); load()
          }}>批量分享({sel.size})</button>
          <button className="border rounded px-2 py-1 text-red-500" onClick={async () => {
            if (!confirm(`删除选中的 ${sel.size} 份简历？`)) return
            for (const id of sel) await api.deleteResume(id)
            setSel(new Set()); load()
          }}>批量删除({sel.size})</button>
        </div>}
      </div>
      {err && <div className="text-red-500 text-sm mb-2">{err}</div>}
      {!list.length && <div className="text-neutral-400 text-sm">还没有简历——去模板中心挑一个模板建一份</div>}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {list.map(r => (
          <div key={r.id} className="border rounded-lg p-4 bg-white hover:shadow relative">
            <input type="checkbox" aria-label="选择这份简历" className="absolute top-3 right-3" checked={sel.has(r.id)} onChange={() => tog(r.id)} />
            <div className="font-medium truncate pr-5">{r.title || r.templateId}</div>
            <div className="text-xs text-neutral-400 mt-1">{r.templateId} · {new Date(r.updatedAt || r.updated_at || 0).toLocaleString()}</div>
            <div className="flex gap-2 mt-3 text-xs flex-wrap">
              <button className="bg-black text-white rounded px-2 py-1" onClick={() => onEdit(r.id)}>继续编辑</button>
              <button className="border rounded px-2 py-1" onClick={() => rename(r)}>改名</button>
              <button className="border rounded px-2 py-1" onClick={() => copy(r)}>复制</button>
              <button className="border rounded px-2 py-1" onClick={async () => {
                const src = await api.resume(r.id)
                const map = Object.fromEntries((src.extras ?? []).map((e: any) => [e.fieldKey, e.valueMd]))
                map.share_on = '1'
                await api.saveExtras(r.id, map)
                const link = location.origin + '/r/' + r.id
                await navigator.clipboard.writeText(link).catch(() => {})
                alert('已开启分享，链接已复制：' + link)
              }}>分享</button>
              <button className="border rounded px-2 py-1 text-red-500" onClick={() => del(r)}>删除</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
