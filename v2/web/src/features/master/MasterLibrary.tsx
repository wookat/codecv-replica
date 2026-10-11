// 大简历库 + 选取面板：条目按 section 分组，挑版本、勾选进简历
import { useEffect, useState } from 'react'
import { api } from '../../core/api/client'

const SECTIONS = ['education', 'internship', 'project', 'award', 'skill', 'selfeval', 'other']
const SEC_LABEL: Record<string, string> = { education: '教育', internship: '实习', project: '项目', award: '奖项', skill: '技能', selfeval: '自评', other: '其他' }

export default function MasterLibrary({ masterId, onSelect }: {
  masterId: string
  onSelect: (sel: { itemId: string; variantId: string | null; ord: number; contentMd: string; section: string; title: string }[]) => void
}) {
  const [items, setItems] = useState<any[]>([])
  const [variants, setVariants] = useState<Record<string, any[]>>({})
  const [picked, setPicked] = useState<Record<string, string | null>>({})  // itemId -> variantId
  const [newItem, setNewItem] = useState({ section: 'project', title: '' })

  useEffect(() => { api.items(masterId).then(setItems).catch(() => {}) }, [masterId])
  useEffect(() => {
    for (const it of items) if (!variants[it.id])
      api.variants(it.id).then(v => setVariants(s => ({ ...s, [it.id]: v }))).catch(() => {})
  }, [items])

  const emit = (p: typeof picked) => {
    const sel = Object.entries(p).filter(([, v]) => v !== null).map(([itemId, variantId], i) => {
      const it = items.find(x => x.id === itemId)!
      const v = (variants[itemId] ?? []).find(x => x.id === variantId)
      return { itemId, variantId, ord: i, contentMd: v?.contentMd ?? '', section: it.section, title: it.title }
    })
    onSelect(sel)
  }

  return (
    <div className="h-full overflow-auto p-4 space-y-4">
      <h3 className="font-bold">大简历条目（勾选进简历）</h3>
      {SECTIONS.map(sec => {
        const list = items.filter(i => i.section === sec)
        if (!list.length) return null
        return (
          <div key={sec}>
            <div className="text-sm font-semibold text-neutral-500 mb-1">{SEC_LABEL[sec]}</div>
            {list.map(it => (
              <div key={it.id} className="flex items-center gap-2 bg-white rounded px-3 py-2 mb-1 border">
                <input type="checkbox" checked={picked[it.id] !== undefined && picked[it.id] !== null}
                  onChange={e => {
                    const v = variants[it.id] ?? []
                    const p = { ...picked, [it.id]: e.target.checked ? (v[0]?.id ?? 'default') : null }
                    setPicked(p); emit(p)
                  }} />
                <span className="flex-1 text-sm">{it.title}</span>
                <select className="text-xs border rounded px-1" value={picked[it.id] ?? ''} disabled={picked[it.id] == null}
                  onChange={e => { const p = { ...picked, [it.id]: e.target.value }; setPicked(p); emit(p) }}>
                  {(variants[it.id] ?? []).map(v => <option key={v.id} value={v.id}>{v.label}</option>)}
                </select>
              </div>
            ))}
          </div>
        )
      })}
      <div className="pt-2 border-t">
        <div className="text-sm font-semibold mb-1">+ 新条目</div>
        <div className="flex gap-2">
          <select className="border rounded px-2 text-sm" value={newItem.section} onChange={e => setNewItem({ ...newItem, section: e.target.value })}>
            {SECTIONS.map(s2 => <option key={s2} value={s2}>{SEC_LABEL[s2]}</option>)}
          </select>
          <input className="border rounded px-2 py-1 text-sm flex-1" placeholder="条目标题" value={newItem.title}
            onChange={e => setNewItem({ ...newItem, title: e.target.value })} />
          <button className="bg-black text-white text-sm rounded px-3" onClick={async () => {
            const it = await api.createItem(masterId, newItem)
            await api.createVariant(it.id, { label: '默认', contentMd: '- 内容…' })
            setItems([...items, it]); setVariants(s => ({ ...s, [it.id]: undefined as any }))
          }}>加</button>
        </div>
      </div>
    </div>
  )
}
