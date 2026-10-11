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
            className="bg-white border rounded-lg p-3 text-left hover:border-black transition">
            <div className="font-medium text-sm">{t.name}</div>
            <div className="text-xs text-neutral-400 mt-1">{(t.tags || []).join(' · ')}</div>
            <div className="mt-2 h-2 rounded" style={{ background: t.primaryColor }} />
          </button>
        ))}
      </div>
    </div>
  )
}
