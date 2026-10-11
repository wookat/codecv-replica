// 模板中心：114 套皮肤卡片选模板
import { useEffect, useState } from 'react'
import catalog from './catalog.json'
import { api } from '../../core/api/client'

export default function TemplateGallery({ onPick }: { onPick: (id: string) => void }) {
  const entries = Object.entries(catalog as Record<string, any>)
  const [favs, setFavs] = useState<string[]>([])
  const [onlyFav, setOnlyFav] = useState(false)
  const [q, setQ] = useState('')
  const [tag, setTag] = useState('')
  useEffect(() => { api.favorites().then(setFavs).catch(() => {}) }, [])
  const allTags = [...new Set(entries.flatMap(([, t]) => (t.tags || []) as string[]))].slice(0, 24)
  const shown = entries.filter(([id, t]) =>
    (!onlyFav || favs.includes(id)) &&
    (!tag || (t.tags || []).includes(tag)) &&
    (!q || t.name?.includes(q) || id.includes(q) || (t.tags || []).some((x: string) => x.includes(q))))
  return (
    <div className="p-6">
      <div className="flex items-center gap-3 mb-4">
        <h2 className="text-xl font-bold">模板中心（{shown.length} 套）</h2>
        <button className={`text-xs border rounded px-2 py-1 ${onlyFav ? 'bg-black text-white' : ''}`}
          onClick={() => setOnlyFav(!onlyFav)}>只看收藏</button>
        <input className="ml-auto border rounded px-2 py-1 text-xs w-44" placeholder="搜索名称/标签/编号…"
          value={q} onChange={e => setQ(e.target.value)} />
      </div>
      <div className="flex flex-wrap gap-1.5 mb-4">
        {allTags.map(t => <button key={t} onClick={() => setTag(tag === t ? '' : t)}
          className={`text-[10px] border rounded-full px-2 py-0.5 ${tag === t ? 'bg-black text-white border-black' : 'text-neutral-500'}`}>{t}</button>)}
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
        {shown.map(([id, t]) => (
          <div key={id} className="relative">
          <button onClick={() => onPick(id)}
            className="w-full bg-white border rounded-lg overflow-hidden text-left hover:border-black hover:shadow transition">
            <img src={`/api/v2/thumb/${id}`} alt={t.name} loading="lazy"
              className="w-full aspect-[3/4] object-cover bg-neutral-100" />
            <div className="p-2">
              <div className="font-medium text-xs truncate">{t.name}</div>
              <div className="text-[10px] text-neutral-400 truncate">{(t.tags || []).join(' · ')}</div>
            </div>
          </button>
          <button className="absolute top-1 right-1 text-sm bg-white/80 rounded px-1"
            onClick={async e => {
              e.stopPropagation()
              const on = !favs.includes(id)
              await api.setFavorite(id, on).catch(() => {})
              setFavs(on ? [...favs, id] : favs.filter(x => x !== id))
            }}>{favs.includes(id) ? '♥' : '♡'}</button>
          </div>
        ))}
      </div>
    </div>
  )
}
