// 模板中心：114 套皮肤卡片选模板
import catalog from './catalog.json'

export default function TemplateGallery({ onPick }: { onPick: (id: string) => void }) {
  const entries = Object.entries(catalog as Record<string, any>)
  return (
    <div className="p-6">
      <h2 className="text-xl font-bold mb-4">模板中心（{entries.length} 套）</h2>
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
        {entries.map(([id, t]) => (
          <button key={id} onClick={() => onPick(id)}
            className="bg-white border rounded-lg overflow-hidden text-left hover:border-black hover:shadow transition">
            <img src={`/api/v2/thumb/${id}`} alt={t.name} loading="lazy"
              className="w-full aspect-[3/4] object-cover bg-neutral-100" />
            <div className="p-2">
              <div className="font-medium text-xs truncate">{t.name}</div>
              <div className="text-[10px] text-neutral-400 truncate">{(t.tags || []).join(' · ')}</div>
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}
