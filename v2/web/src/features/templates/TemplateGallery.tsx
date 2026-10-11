// 模板中心：114 套皮肤卡片选模板
import { useEffect, useState } from 'react'
import catalog from './catalog.json'
import { api } from '../../core/api/client'

export default function TemplateGallery({ onPick }: { onPick: (id: string) => void }) {
  const entries = Object.entries(catalog as Record<string, any>)
  const [favs, setFavs] = useState<string[]>([])
  const [onlyFav, setOnlyFav] = useState(false)
  useEffect(() => { api.favorites().then(setFavs).catch(() => {}) }, [])
  const shown = onlyFav ? entries.filter(([id]) => favs.includes(id)) : entries
  return (
    <div className="p-6">
      <div className="flex items-center gap-3 mb-4">
        <h2 className="text-xl font-bold">模板中心（{shown.length} 套）</h2>
        <button className={`text-xs border rounded px-2 py-1 ${onlyFav ? 'bg-black text-white' : ''}`}
          onClick={() => setOnlyFav(!onlyFav)}>只看收藏</button>
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
