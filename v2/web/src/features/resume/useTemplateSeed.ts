import { useEffect, useState } from 'react'
import type { TemplateSeed } from './renderContract'

const seeds = new Map<string, Promise<TemplateSeed>>()

export function loadTemplateSeed(templateId: string): Promise<TemplateSeed> {
  const id = templateId.replace(/^cv-/, '')
  let pending = seeds.get(id)
  if (!pending) {
    pending = fetch(`/seeds/tpl/${encodeURIComponent(id)}.json`).then(async r => {
      if (!r.ok) throw new Error(`模板 ${id} 加载失败（${r.status}）`)
      return r.json() as Promise<TemplateSeed>
    }).catch(e => { seeds.delete(id); throw e })
    seeds.set(id, pending)
  }
  return pending
}

export function useTemplateSeed(id: string) {
  const [result, setResult] = useState<{ id: string; seed?: TemplateSeed; error?: string }>({ id })
  useEffect(() => {
    let active = true
    if (id) loadTemplateSeed(id).then(seed => {
      if (active) setResult({ id, seed })
    }).catch(e => {
      if (active) setResult({ id, error: String(e.message || e) })
    })
    return () => { active = false }
  }, [id])
  return result.id === id ? result : { id }
}
