// 模板中心：114 套皮肤卡片，点击出真渲染预览弹层
import { Suspense, lazy, useEffect, useRef, useState } from 'react'
import catalog from './catalog.json'
import { api } from '../../core/api/client'
import { skinHref } from '../resume/composer'

const PreviewPane = lazy(() => import('../resume/PreviewPane'))

export default function TemplateGallery({ onPick }: { onPick: (id: string) => void }) {
  const entries = Object.entries(catalog as Record<string, any>)
  const [favs, setFavs] = useState<string[]>([])
  const [onlyFav, setOnlyFav] = useState(false)
  const [q, setQ] = useState('')
  const [tag, setTag] = useState('')
  const [pv, setPv] = useState<{ id: string; seed: any } | null>(null)
  const bodyRef = useRef<HTMLDivElement>(null)
  const [zoom, setZoom] = useState(1)
  useEffect(() => {
    if (!pv) return
    const el = bodyRef.current
    const fit = () => setZoom(Math.min(1, ((el?.clientWidth ?? 800) - 24) / 794))
    fit(); const ro = new ResizeObserver(fit); el && ro.observe(el)
    return () => ro.disconnect()
  }, [pv])
  useEffect(() => { api.favorites().then(setFavs).catch(() => {}) }, [])
  const allTags = [...new Set(entries.flatMap(([, t]) => (t.tags || []) as string[]))].slice(0, 24)
  const shown = entries.filter(([id, t]) =>
    (!onlyFav || favs.includes(id)) &&
    (!tag || (t.tags || []).includes(tag)) &&
    (!q || t.name?.includes(q) || id.includes(q) || (t.tags || []).some((x: string) => x.includes(q))))
  const openPreview = async (id: string) => {
    try {
      const r = await fetch(`/seeds/tpl/${id}.json`)
      if (!r.ok) return onPick(id)
      setPv({ id, seed: await r.json() })
    } catch { onPick(id) }
  }
  const meta = pv ? (catalog as any)[pv.id] : null
  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto">
      <div className="flex items-center gap-3 mb-4">
        <h2 className="text-xl font-bold">模板中心（{shown.length} 套）</h2>
        <button className={`cv-pill ${onlyFav ? 'cv-pill-on' : ''}`}
          onClick={() => setOnlyFav(!onlyFav)}>只看收藏</button>
        <input className="ml-auto cv-input w-44" placeholder="搜索名称/标签/编号…"
          value={q} onChange={e => setQ(e.target.value)} />
      </div>
      <div className="flex flex-wrap gap-1.5 mb-4">
        {allTags.map(t => <button key={t} onClick={() => setTag(tag === t ? '' : t)}
          className={`cv-pill ${tag === t ? 'cv-pill-on' : ''}`}>{t}</button>)}
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
        {shown.map(([id, t]) => (
          <div key={id} className="relative">
          <button onClick={() => openPreview(id)}
            className="cv-card cv-card-hover w-full overflow-hidden text-left transition">
            <img src={`/api/v2/thumb/${id}`} alt={t.name} loading="lazy"
              className="w-full aspect-[3/4] object-cover" />
            <div className="p-2">
              <div className="font-medium text-xs truncate">{t.name}</div>
              <div className="text-[10px] text-neutral-400 truncate">{(t.tags || []).join(' · ')}</div>
            </div>
          </button>
          <button className="absolute top-1.5 right-1.5 text-xs bg-white/90 rounded-md px-1.5 py-0.5 shadow-sm"
            onClick={async e => {
              e.stopPropagation()
              const on = !favs.includes(id)
              await api.setFavorite(id, on).catch(() => {})
              setFavs(on ? [...favs, id] : favs.filter(x => x !== id))
            }}>{favs.includes(id) ? '♥' : '♡'}</button>
          </div>
        ))}
      </div>
      {pv && <div className="cv-modal-mask" role="dialog" aria-modal="true" aria-label={meta?.name ?? '模板预览'}
        onClick={() => setPv(null)} onKeyDown={e => e.key === 'Escape' && setPv(null)} tabIndex={-1}
        ref={el => el?.focus()}>
        <div className="cv-modal" onClick={e => e.stopPropagation()}>
          <div className="flex items-center gap-3 px-5 py-3 border-b" style={{ borderColor: 'var(--cv-line)' }}>
            <div className="min-w-0">
              <div className="font-bold truncate">{meta?.name ?? pv.id}</div>
              <div className="text-xs cv-sub truncate">{(meta?.tags || []).join(' · ')}</div>
            </div>
            <button className="cv-btn cv-btn-primary ml-auto" onClick={() => { onPick(pv.id); setPv(null) }}>使用此模板</button>
            <button className="cv-btn cv-btn-ghost" onClick={() => setPv(null)}>关闭</button>
          </div>
          <div className="flex flex-1 min-h-0">
            <div className="cv-pv-list w-44 shrink-0 overflow-y-auto border-r p-2 space-y-1" style={{ borderColor: 'var(--cv-line)' }}>
              {entries.map(([id, t]) => (
                <button key={id} onClick={() => openPreview(id)}
                  className={`w-full text-left px-2 py-1.5 rounded-md text-xs transition ${id === pv.id ? 'cv-nav-on' : 'hover:bg-black/5'}`}>
                  <div className="font-medium truncate">{t.name}</div>
                  <div className="text-[10px] cv-sub truncate">{(t.tags || []).slice(0, 3).join(' · ')}</div>
                </button>
              ))}
            </div>
            <div className="cv-modal-body flex-1" ref={bodyRef}>
              <Suspense fallback={<div className="p-10 text-center cv-sub">渲染中…</div>}>
                <PreviewPane md={pv.seed.content ?? ''} skinCss={skinHref(pv.seed.slug ?? `cv-${pv.id}`)}
                  primaryColor={pv.seed.primaryColor ?? meta?.primaryColor ?? '#333'} font={pv.seed.font ?? meta?.font}
                  avatar={pv.seed.avatar ?? null} />
              </Suspense>
            </div>
          </div>
        </div>
      </div>}
    </div>
  )
}
