// 预览窗格：mth 引擎渲染 + 皮肤 css <link> 挂载（.jufe DOM 契约复刻 v1）
import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react'
import { createResumePaper, PAPER_RESET, type PaperOptions, type TemplateSeed } from './renderContract'

export type PreviewHandle = { paperHTML: () => string }

const PreviewPane = forwardRef<PreviewHandle, {
  md: string
  skinCss: string
  seed?: TemplateSeed
  opts?: PaperOptions
  photo?: string
}>(function PreviewPane({ md, skinCss, seed = {}, opts = {}, photo }, apiRef) {
  const host = useRef<HTMLDivElement>(null)
  const paperRef = useRef<HTMLDivElement | null>(null)
  const [err, setErr] = useState('')

  useImperativeHandle(apiRef, () => ({
    paperHTML: () => paperRef.current?.outerHTML || '',
  }), [])

  useEffect(() => {
    if (!host.current) return
    const root = host.current.shadowRoot || host.current.attachShadow({ mode: 'open' })
    root.replaceChildren()
    const reset = document.createElement('style')
    reset.textContent = PAPER_RESET
    root.appendChild(reset)
    for (const href of ['/fonts/iconfont.css', '/common.css', skinCss]) {
      const link = document.createElement('link')
      link.rel = 'stylesheet'
      link.href = href
      link.onerror = () => setErr(`样式加载失败：${href}`)
      root.appendChild(link)
    }
    const paper = document.createElement('div')
    paper.className = 'markdown-transform-html jufe'
    root.appendChild(paper)
    paperRef.current = paper
    return () => { paperRef.current = null }
  }, [skinCss])

  useEffect(() => {
    const paper = paperRef.current
    if (!paper) return
    try {
      const next = createResumePaper(md, seed, opts, photo)
      paper.replaceWith(next)
      paperRef.current = next
      setErr('')
    } catch (e) {
      setErr(e instanceof Error ? e.message : String(e))
    }
  }, [md, seed, opts, photo, skinCss])

  return (
    <div className="h-full overflow-auto bg-neutral-200 p-4">
      {err && <div role="alert" className="text-red-500 text-sm mb-2">渲染错误：{err}</div>}
      <div className="re-render mx-auto relative" style={{ width: 794, zoom: opts.zoom ?? 1 }}>
        <div ref={host} data-resume-preview />
        {opts.showPages !== false && (
          <div className="absolute inset-0 pointer-events-none">
            {[1123, 2246, 3369, 4492].map(y => (
              <div key={y} className="absolute left-0 right-0 border-t-2 border-dashed border-blue-300/60" style={{ top: y }} />
            ))}
          </div>)}
      </div>
    </div>
  )
})

export default PreviewPane
