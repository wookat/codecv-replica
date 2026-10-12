// 编辑器页：左=选取面板+md 编辑，右=mth 预览；顶栏换肤+导出双链
import { useEffect, useRef, useState } from 'react'
import CodeMirror from '@uiw/react-codemirror'
import { markdown } from '@codemirror/lang-markdown'
import { api } from '../../core/api/client'
import { composeMd, skinHref, templateMeta, type SelItem } from './composer'
import PreviewPane, { type PreviewHandle } from './PreviewPane'
import { FONT_STYLESHEETS, PAPER_RESET, type PaperOptions } from './renderContract'
import { useTemplateSeed } from './useTemplateSeed'
import ContentEditor from './ContentEditor'
import AiPanel from './AiPanel'
import catalog from '../templates/catalog.json'

export default function EditorPage({ templateId: initTpl, masterId, resumeId: initRid, onBack }: {
  templateId: string; masterId: string; resumeId?: string; onBack: () => void
}) {
  const [tplId, setTplId] = useState(initTpl)          // 快捷换肤
  const meta = templateMeta(tplId)
  const [md, setMd] = useState('')
  const [sels, setSels] = useState<SelItem[]>([])
  const [exporting, setExporting] = useState('')
  const [mode, setMode] = useState<'md' | 'rich'>('md')   // 排版控件状态：字号/行距/主题色/缩放
  const [opts, setOpts] = useState<PaperOptions>({ zoom: 1, color: '' })
  const { seed, error: seedError } = useTemplateSeed(tplId)
  const avatar = seed?.avatar
  const preview = useRef<PreviewHandle>(null)
  const [photo, setPhoto] = useState('')
  const extrasRef = useRef<Record<string, string>>({})
  const [rid, setRid] = useState(initRid)
  const [aiOpen, setAiOpen] = useState(false)
  const [histOpen, setHistOpen] = useState(false)
  const [hist, setHist] = useState<any[]>([])
  const [saveErr, setSaveErr] = useState('')
  const dirtyRef = useRef(false)
  const saveTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  // 载入已有简历（resume 模式）或新建（模板模式）
  useEffect(() => {
    if (initRid) {
      api.resume(initRid).then(r => {
        setMd(r.contentMd ?? r.content_md ?? '')
        if (r.templateId) setTplId(r.templateId)
        for (const e of r.extras ?? []) extrasRef.current[e.fieldKey] = e.valueMd
        if (extrasRef.current.photo) setPhoto(extrasRef.current.photo)
      }).catch(() => {})
    } else {
      api.createResume({ masterId, templateId: tplId, title: meta?.name ?? tplId })
        .then(r => setRid(r.id)).catch(() => {})
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initRid])

  useEffect(() => {
    if (!initRid && sels.length) {
      dirtyRef.current = true
      setMd(composeMd({ title: meta?.name ?? '我的简历', items: sels }))
    }
  }, [sels])

  // 模板头像位配置（种子 json 的 avatar 字段）
  useEffect(() => {
    if (!initRid && seed?.content) {
      setMd(current => current || seed.content || '')
      dirtyRef.current = true
    }
  }, [seed, initRid])

  const uploadPhoto = (f: File) => {
    const img = new Image()
    img.onload = () => {
      const cv = document.createElement('canvas')
      const scale = Math.min(1, 360 / img.width)
      cv.width = img.width * scale; cv.height = img.height * scale
      cv.getContext('2d')!.drawImage(img, 0, 0, cv.width, cv.height)
      const url = cv.toDataURL('image/jpeg', 0.85)
      setPhoto(url)
      extrasRef.current.photo = url
      if (rid) api.saveExtras(rid, extrasRef.current).catch(() => {})
    }
    img.src = URL.createObjectURL(f)
  }

  // md 变更自动落库（1s 防抖）
  useEffect(() => {
    if (!rid || !dirtyRef.current) return
    clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(() => {
      api.updateResume(rid, { contentMd: md }).then(() => setSaveErr('')).catch(() => setSaveErr('保存失败，编辑未落库'))
      if (tplId !== meta?.slug) api.updateResume(rid, { templateId: tplId }).catch(() => setSaveErr('换肤保存失败'))
      dirtyRef.current = false
    }, 1000)
    return () => clearTimeout(saveTimer.current)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [md, rid])

  const exportPdf = async (kind: 'pdf' | 'png' | 'docx') => {
    setExporting(kind)
    try {
      const body = preview.current?.paperHTML()
      if (!body) throw new Error('简历尚未渲染，请稍后再试')
      const r = await fetch('/api/v2/export', {
        method: 'POST', headers: { 'content-type': 'application/json', 'authorization': `Bearer ${localStorage.getItem('v2:token') ?? ''}` },
        body: JSON.stringify({
          content: body, fullPaper: true, style: skinHref(meta?.slug ?? tplId), name: meta?.name ?? 'resume', type: kind,
        }),
      })
      if (!r.ok) throw new Error(await r.text())
      const blob = await r.blob()
      const a = document.createElement('a')
      a.href = URL.createObjectURL(blob)
      a.download = `${meta?.name ?? 'resume'}.${kind}`
      a.click()
    } catch (e: any) { alert('导出失败: ' + e.message) }
    setExporting('')
  }

  const printPdf = async () => {
    const body = preview.current?.paperHTML()
    if (!body) return
    let brand = true
    try { const me: any = await api.me(); brand = !me?.member } catch {}
    const w = window.open('', '_blank')!
    w.document.write(`<!DOCTYPE html><html><head><meta charset=utf-8><title>${meta?.name}</title>
      <link rel="stylesheet" href="${skinHref(meta?.slug ?? tplId)}">
      ${FONT_STYLESHEETS.map(href => `<link rel="stylesheet" href="${href}">`).join('')}
      <style>${PAPER_RESET}@page{size:A4;margin:0}body{margin:0}.markdown-transform-html{width:210mm;margin:0 auto}</style>
      </head><body>${body}
      ${brand ? `<div style="position:fixed;bottom:6mm;right:10mm;font-size:9px;color:#b0b0b0;letter-spacing:.5px">由 CodeCV 制作 · codecv.zalize.com</div>` : ''}
      <script>onload=async()=>{await document.fonts.ready;print()}<\/script></body></html>`)
    w.document.close()
  }

  return (
    <div className="h-screen flex flex-col">
      <div className="border-b px-4 py-2 flex items-center gap-3 flex-wrap">
        <button onClick={onBack} className="text-sm text-neutral-500 hover:text-black">← 模板中心</button>
        <select aria-label="换肤" className="cv-input" value={tplId} onChange={e => setTplId(e.target.value)}>
          {Object.entries(catalog as Record<string, any>).map(([id, t]) => <option key={id} value={id}>{t.name}</option>)}
        </select>
        <span className="text-xs text-neutral-400">{meta?.font}</span>
        <div className="flex cv-card overflow-hidden text-xs p-0.5 gap-0.5">
          <button className={mode === 'md' ? 'cv-nav cv-nav-on px-2 py-0.5' : 'cv-nav px-2 py-0.5'} onClick={() => setMode('md')}>md</button>
          <button className={mode === 'rich' ? 'cv-nav cv-nav-on px-2 py-0.5' : 'cv-nav px-2 py-0.5'} onClick={() => setMode('rich')}>内容模式</button>
        </div>
        <label className="text-xs text-neutral-500">字号
          <input type="number" min={10} max={20} step={0.5} className="cv-input w-14 ml-1" value={opts.fontSize ?? 14}
            onChange={e => setOpts({ ...opts, fontSize: +e.target.value })} /></label>
        <label className="text-xs text-neutral-500">行距
          <select aria-label="行距" className="cv-input ml-1" value={opts.lineHeight ?? ''}
            onChange={e => setOpts({ ...opts, lineHeight: e.target.value ? +e.target.value : undefined })}>
            <option value="">模板默认（{seed?.lineHeight ?? 25}px）</option>
            {[1.2,1.4,1.6,1.8,2.0].map(v => <option key={v} value={v}>{v}</option>)}
          </select></label>
        <label className="text-xs text-neutral-500">主题色
          <input type="color" className="w-7 h-6 ml-1 align-middle" value={opts.color || seed?.primaryBgColor || '#333333'}
            onChange={e => setOpts({ ...opts, color: e.target.value })} /></label>
        <label className="text-xs text-neutral-500">缩放
          <select aria-label="缩放" className="cv-input ml-1" value={opts.zoom}
            onChange={e => setOpts({ ...opts, zoom: +e.target.value })}>
            {[0.5,0.7,0.85,1,1.25,1.5].map(v => <option key={v} value={v}>{v}</option>)}
          </select></label>
        <label className="text-xs">字体
          <select aria-label="字体" className="cv-input ml-1" value={opts.fontFamily || ''}
            onChange={e => setOpts({ ...opts, fontFamily: e.target.value || undefined })}>
            <option value="">模板默认</option>
            <option value="'Noto Sans SC', sans-serif">黑体</option>
            <option value="'Noto Serif SC', serif">宋体</option>
            <option value="'LXGW WenKai', 'Kaiti SC', serif">楷体</option>
            <option value="Arial, 'Helvetica Neue', sans-serif">英文无衬线</option>
            <option value="Georgia, 'Times New Roman', serif">英文衬线</option>
          </select></label>
        {avatar && (
          <label className="cv-btn cv-btn-ghost text-xs cursor-pointer">
            {photo ? '更换照片' : '上传照片'}
            <input type="file" accept="image/*" className="hidden"
              onChange={e => e.target.files?.[0] && uploadPhoto(e.target.files[0])} />
          </label>)}
        {initRid && <button className="cv-btn cv-btn-ghost text-xs" onClick={async () => {
          setHist(await api.resumeVersions(initRid).catch(() => [])); setHistOpen(true)
        }}>历史</button>}
        <button className={`cv-btn cv-btn-ghost text-xs ${aiOpen ? 'cv-nav-on' : ''}`}
          onClick={() => setAiOpen(!aiOpen)}>AI</button>
        <div className="flex-1" />
        {saveErr && <span className="text-xs text-red-500" role="alert">{saveErr}</span>}
        {!saveErr && initRid && <span className="text-[10px] text-neutral-400">已自动保存</span>}
        <button className="cv-btn cv-btn-ghost text-xs" onClick={printPdf}>打印 PDF</button>
        <button className="cv-btn cv-btn-primary text-xs" disabled={!!exporting}
          onClick={() => exportPdf('pdf')}>{exporting === 'pdf' ? '渲染中…' : 'VPS 导出 PDF'}</button>
        <button className="cv-btn cv-btn-ghost text-xs" disabled={!!exporting}
          onClick={() => exportPdf('png')}>{exporting === 'png' ? '渲染中…' : 'VPS PNG'}</button>
        <button className="cv-btn cv-btn-ghost text-xs" disabled={!!exporting}
          onClick={() => exportPdf('docx')}>{exporting === 'docx' ? '渲染中…' : '导出 docx'}</button>
      </div>
      {histOpen && <div className="cv-light-zone border-b bg-white px-3 py-2 max-h-40 overflow-auto">
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs font-semibold">版本历史（保留最近 30 次改动）</span>
          <button className="text-xs text-neutral-400" onClick={() => setHistOpen(false)}>关闭</button>
        </div>
        {hist.length === 0 && <div className="text-xs text-neutral-400">暂无历史版本，编辑后会自动存快照</div>}
        {hist.map(v => <div key={v.id} className="flex items-center gap-2 text-xs py-0.5">
          <span className="text-neutral-400 w-32 shrink-0">{new Date(v.created_at).toLocaleString()}</span>
          <span className="flex-1 truncate text-neutral-500">{v.preview}…</span>
          <button className="text-blue-600" onClick={async () => {
            const r = await api.restoreVersion(initRid!, v.id)
            setMd(r.contentMd); setHistOpen(false)
          }}>恢复此版本</button>
        </div>)}
      </div>}
      <div className="cv-light-zone flex-1 flex flex-col md:flex-row overflow-y-auto md:overflow-hidden">
        <div className="md:w-80 w-full md:border-r border-b bg-neutral-50 md:overflow-y-auto">
          <MasterPick masterId={masterId} onSelect={setSels} templateId={tplId} />
        </div>
        <div className="md:w-[420px] w-full md:border-r border-b min-h-[300px]">
          {mode === 'md'
            ? <CodeMirror value={md} height="100%" style={{ height: '100%' }}
                extensions={[markdown()]} onChange={v => { dirtyRef.current = true; setMd(v) }} />
            : <ContentEditor md={md} onMd={v => { dirtyRef.current = true; setMd(v) }} />}
        </div>
        <div className="flex-1">
          {seedError && <p role="alert">{seedError}</p>}
          <PreviewPane ref={preview} md={md} skinCss={skinHref(meta?.slug ?? tplId)} seed={seed} opts={opts} photo={photo} />
        </div>
        {aiOpen && <AiPanel md={md} onClose={() => setAiOpen(false)}
          onApply={(t, m) => { dirtyRef.current = true; setMd(m === 'replace' ? t : md + '\n' + t); setAiOpen(false) }} />}
      </div>
    </div>
  )
}

import MasterLibrary from '../master/MasterLibrary'
function MasterPick(props: { masterId: string; onSelect: (s: SelItem[]) => void; templateId?: string }) {
  return <MasterLibrary {...props} />
}
