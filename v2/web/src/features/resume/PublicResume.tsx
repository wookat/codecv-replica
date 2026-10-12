// 公开只读简历页 /r/:id（无登录）
import { useEffect, useState } from 'react'
import PreviewPane from './PreviewPane'
import { skinHref } from './composer'
import { useTemplateSeed } from './useTemplateSeed'

export default function PublicResume({ id }: { id: string }) {
  const [r, setR] = useState<any>(null)
  const [err, setErr] = useState('')
  const { seed, error } = useTemplateSeed(r?.templateId || '')
  useEffect(() => {
    fetch(`/api/v2/share/${id}`).then(x => x.ok ? x.json() : Promise.reject())
      .then(setR).catch(() => setErr('链接不存在或未分享'))
  }, [id])
  if (err) return <div className="min-h-screen flex items-center justify-center text-neutral-400">{err}</div>
  if (!r) return null
  return (
    <div className="min-h-screen bg-neutral-200">
      <div className="text-center text-xs text-neutral-500 py-2">「{r.title}」 · 由 CodeCV 生成</div>
      {error && <p role="alert">{error}</p>}
      <div className="h-[95vh]"><PreviewPane md={r.contentMd} skinCss={skinHref(r.templateId)} seed={seed} /></div>
    </div>
  )
}
