// 预览窗格：mth 引擎渲染 + 皮肤 css <link> 挂载（.jufe DOM 契约复刻 v1）
import { useEffect, useRef, useState } from 'react'
import { markdownToHTML } from '../../../../../src/lib/mth/index'

export default function PreviewPane({ md, skinCss, primaryColor = '#333', font = '', opts = {}, avatar, photo }: {
  md: string; skinCss: string; primaryColor?: string; font?: string
  opts?: { zoom?: number; fontSize?: number; lineHeight?: number; color?: string; showPages?: boolean }
  avatar?: { top: number; left: number; type?: string } | null
  photo?: string
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
      <div className="re-render mx-auto relative" style={{ width: 794, zoom: opts.zoom ?? 1 }}>
        <div ref={ref} className="markdown-transform-html jufe" />
        {opts.showPages !== false && (
          <div className="absolute inset-0 pointer-events-none">
            {[1123, 2246, 3369, 4492].map(y => (
              <div key={y} className="absolute left-0 right-0 border-t-2 border-dashed border-blue-300/60" style={{ top: y }} />
            ))}
          </div>)}
        {avatar && photo && (
          <img src={photo} alt="photo" className="absolute object-cover"
            style={{ top: avatar.top, left: avatar.left, width: 96, height: 120,
              borderRadius: avatar.type === 'circle' ? '50%' : 4 }} />
        )}
      </div>
    </div>
  )
}
