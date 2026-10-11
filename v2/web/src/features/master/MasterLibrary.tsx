// 大简历库 + 选取面板：条目按 section 分组、勾选进简历、dnd-kit 拖拽排序
import { useEffect, useState } from 'react'
import { api } from '../../core/api/client'
import { DndContext, pointerWithin, PointerSensor, KeyboardSensor, useSensor, useSensors } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy, useSortable, arrayMove, sortableKeyboardCoordinates } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

const SECTIONS = ['education', 'internship', 'project', 'award', 'skill', 'selfeval', 'other']
const SEC_LABEL: Record<string, string> = { education: '教育', internship: '实习', project: '项目', award: '奖项', skill: '技能', selfeval: '自评', other: '其他' }

interface Sel { itemId: string; variantId: string | null; ord: number; contentMd: string; section: string; title: string }

function SortableRow({ sel, onVariant, onRemove }: { sel: Sel; onVariant: (v: string) => void; onRemove: () => void }) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: sel.itemId })
  return (
    <div ref={setNodeRef} style={{ transform: CSS.Transform.toString(transform), transition }}
      className="flex items-center gap-1 bg-white rounded px-2 py-1.5 mb-1 border">
      <span {...attributes} {...listeners} className="cursor-grab text-neutral-400 select-none">⠿</span>
      <span className="flex-1 text-xs truncate">{sel.title}</span>
      <VariantSelect itemId={sel.itemId} value={sel.variantId} onChange={onVariant} />
      <button className="text-neutral-300 hover:text-red-500 text-xs" onClick={onRemove}>×</button>
    </div>
  )
}
const variantCache: Record<string, any[]> = {}
function VariantSelect({ itemId, value, onChange }: { itemId: string; value: string | null; onChange: (v: string) => void }) {
  const [vs, setVs] = useState<any[]>(variantCache[itemId] ?? [])
  useEffect(() => { if (!variantCache[itemId]) api.variants(itemId).then(v => { variantCache[itemId] = v; setVs(v) }) }, [itemId])
  return <select className="text-xs border rounded px-0.5" value={value ?? ''} onChange={e => onChange(e.target.value)}>
    {vs.map(v => <option key={v.id} value={v.id}>{v.label}</option>)}
  </select>
}

export default function MasterLibrary({ masterId, onSelect, templateId }: {
  masterId: string
  onSelect: (sel: Sel[]) => void
  templateId?: string
}) {
  const [items, setItems] = useState<any[]>([])
  const [variants, setVariants] = useState<Record<string, any[]>>({})
  const [sels, setSels] = useState<Sel[]>([])   // 有序已选清单
  const [newItem, setNewItem] = useState({ section: 'project', title: '' })
  const [jdOpen, setJdOpen] = useState(false)
  const [jd, setJd] = useState('')
  const [jdBusy, setJdBusy] = useState(false)
  const [jdMsg, setJdMsg] = useState('')
  const [gap, setGap] = useState('')
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  useEffect(() => { api.items(masterId).then(setItems).catch(() => {}) }, [masterId])
  useEffect(() => {
    for (const it of items) if (!variants[it.id])
      api.variants(it.id).then(v => { variantCache[it.id] = v; setVariants(s => ({ ...s, [it.id]: v })) }).catch(() => {})
  }, [items])

  const emit = (list: Sel[]) => { const re = list.map((s, i) => ({ ...s, ord: i })); setSels(re); onSelect(re) }

  const toggle = (it: any, on: boolean) => {
    if (on) {
      const v = (variants[it.id] ?? [])[0]
      emit([...sels, { itemId: it.id, variantId: v?.id ?? null, ord: sels.length, contentMd: v?.contentMd ?? '', section: it.section, title: it.title }])
    } else emit(sels.filter(s => s.itemId !== it.id))
  }

  const setVariant = (itemId: string, variantId: string) => {
    emit(sels.map(s => {
      if (s.itemId !== itemId) return s
      const v = (variants[itemId] ?? []).find(x => x.id === variantId)
      return { ...s, variantId, contentMd: v?.contentMd ?? s.contentMd }
    }))
  }

  const onDragEnd = (e: any) => {
    const { active, over } = e
    if (!over || active.id === over.id) return
    const oldIdx = sels.findIndex(s => s.itemId === active.id)
    const newIdx = sels.findIndex(s => s.itemId === over.id)
    emit(arrayMove(sels, oldIdx, newIdx))
  }

  const applyJd = async () => {
    if (!jd.trim()) return
    setJdBusy(true); setJdMsg('')
    try {
      const { selections } = await api.jdSelect(masterId, jd)
      if (!selections?.length) { setJdMsg('AI 没选出条目，请补充 JD 或先充实大简历'); return }
      const next: Sel[] = []
      for (const p of selections) {
        const it = items.find(x => x.id === p.itemId); if (!it) continue
        let vs = variants[it.id]
        if (!vs) { vs = await api.variants(it.id); variantCache[it.id] = vs; setVariants(s => ({ ...s, [it.id]: vs })) }
        const v = (vs ?? []).find((x: any) => x.id === p.variantId) ?? (vs ?? [])[0]
        next.push({ itemId: it.id, variantId: v?.id ?? null, ord: next.length, contentMd: v?.contentMd ?? '', section: it.section, title: it.title })
      }
      emit(next); setJdOpen(false)
    } catch (e) { setJdMsg('选取失败：' + String(e).slice(0, 80)) }
    setJdBusy(false)
  }
  return (
    <div className="h-full overflow-auto p-3 space-y-3 text-sm">
      <button className="w-full text-xs border rounded py-1.5 bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100"
        onClick={() => setJdOpen(true)}>✨ 按 JD 一键选取</button>
      {jdOpen && (
        <div className="border rounded-lg p-2 bg-blue-50/50 space-y-2">
          <textarea className="w-full border rounded px-2 py-1 text-xs h-28" placeholder="粘贴目标岗位 JD…" value={jd} onChange={e => setJd(e.target.value)} />
          <div className="flex gap-2 items-center">
            <button className="bg-blue-600 text-white text-xs rounded px-3 py-1" disabled={jdBusy} onClick={applyJd}>
              {jdBusy ? '处理中…' : 'AI 推荐并替换已选'}</button>
            {templateId && <button className="text-xs bg-green-600 text-white rounded px-3 py-1" disabled={jdBusy} onClick={async () => {
              if (!jd.trim()) return; setJdBusy(true); setJdMsg('')
              try { const r = await api.jdGenerate(masterId, jd, templateId); location.href = `/?r=${r.id}` }
              catch (e: any) { setJdMsg(e?.code === 'quota' ? '简历份数达上限，升级会员可建更多' : '成稿失败：' + String(e).slice(0, 60)) }
              setJdBusy(false)
            }}>一键成稿</button>}
            <button className="text-xs border border-blue-300 text-blue-600 rounded px-3 py-1" disabled={jdBusy} onClick={async () => {
              if (!jd.trim()) return; setJdBusy(true); setGap('')
              try { setGap((await api.jdGap(masterId, jd)).report) } catch (e) { setJdMsg('分析失败：' + String(e).slice(0, 60)) }
              setJdBusy(false)
            }}>差距分析</button>
            <button className="text-xs text-neutral-400" onClick={() => { setJdOpen(false); setGap('') }}>取消</button>
          </div>
          {jdMsg && <div className="text-xs text-red-500">{jdMsg}</div>}
          {gap && <pre className="text-xs whitespace-pre-wrap bg-white border rounded p-2 max-h-56 overflow-auto">{gap}</pre>}
        </div>)}
      <div>
        <div className="font-semibold mb-1">已选（拖拽排序 = 简历顺序）</div>
        <DndContext sensors={sensors} collisionDetection={pointerWithin} onDragEnd={onDragEnd}>
          <SortableContext items={sels.map(s => s.itemId)} strategy={verticalListSortingStrategy}>
            {sels.length === 0 && <div className="text-xs text-neutral-400">从下方勾选条目</div>}
            {sels.map(s => <SortableRow key={s.itemId} sel={s}
              onVariant={v => setVariant(s.itemId, v)} onRemove={() => toggle({ id: s.itemId }, false)} />)}
          </SortableContext>
        </DndContext>
      </div>
      {SECTIONS.map(sec => {
        const list = items.filter(i => i.section === sec)
        if (!list.length) return null
        return (
          <div key={sec}>
            <div className="text-xs font-semibold text-neutral-500 mb-1">{SEC_LABEL[sec]}</div>
            {list.map(it => (
              <label key={it.id} className="flex items-center gap-2 px-2 py-1 hover:bg-neutral-100 rounded cursor-pointer">
                <input type="checkbox" checked={sels.some(s => s.itemId === it.id)} onChange={e => toggle(it, e.target.checked)} />
                <span className="text-xs">{it.title}</span>
              </label>
            ))}
          </div>
        )
      })}
      <div className="pt-2 border-t">
        <div className="text-xs font-semibold mb-1">+ 新条目</div>
        <div className="flex gap-1">
          <select className="border rounded px-1 text-xs" value={newItem.section} onChange={e => setNewItem({ ...newItem, section: e.target.value })}>
            {SECTIONS.map(s2 => <option key={s2} value={s2}>{SEC_LABEL[s2]}</option>)}
          </select>
          <input className="border rounded px-1.5 py-0.5 text-xs flex-1 min-w-0" placeholder="条目标题" value={newItem.title}
            onChange={e => setNewItem({ ...newItem, title: e.target.value })} />
          <button className="bg-black text-white text-xs rounded px-2" onClick={async () => {
            const it = await api.createItem(masterId, newItem)
            await api.createVariant(it.id, { label: '默认', contentMd: '- 内容…' })
            setItems([...items, it]); setVariants(s => ({ ...s, [it.id]: undefined as any }))
          }}>加</button>
        </div>
      </div>
    </div>
  )
}
