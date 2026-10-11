// 预览窗格：mth 引擎渲染 + 皮肤 css <link> 挂载（.jufe DOM 契约复刻 v1）
import { useEffect, useRef, useState } from 'react'
import { markdownToHTML } from '../../../../../src/lib/mth/index'

export default function PreviewPane({ md, skinCss, primaryColor = '#333', font = '', opts = {} }: {
  md: string; skinCss: string; primaryColor?: string; font?: string
  opts?: { zoom?: number; fontSize?: number; lineHeight?: number; color?: string }
}) {
  const ref = useRef<HTMLDivElement>(null)
  const [err, setErr] = useState('')

  useEffect(() => {
    if (!ref.current) return
    try {
      ref.current.innerHTML = markdownToHTML(md)
      setErr('')
    } catch (e: any) {
      setErr(String(e?.message ?? e))
    }
  }, [md])

  return (
    <div className="h-full overflow-auto bg-neutral-200 p-4" style={{ fontFamily: font }}>
      <link rel="stylesheet" href={skinCss} />
      <style>{`.markdown-transform-html{--markdown-primary-bg-color:${opts.color || primaryColor};font-size:${opts.fontSize || 14}px;line-height:${opts.lineHeight || 1.6}}`}</style>
      {err && <div className="text-red-500 text-sm mb-2">渲染错误: {err}</div>}
      <div className="re-render mx-auto" style={{ width: 794, zoom: opts.zoom ?? 1 }}>
        <div ref={ref} className="markdown-transform-html jufe" />
      </div>
    </div>
  )
}
