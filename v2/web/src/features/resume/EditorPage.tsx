// 编辑器页：左=选取面板+md 编辑，右=mth 预览；顶栏换肤+导出双链
import { useEffect, useState } from 'react'
import CodeMirror from '@uiw/react-codemirror'
import { markdown } from '@codemirror/lang-markdown'
import { api } from '../../core/api/client'
import { composeMd, skinHref, templateMeta, type SelItem } from './composer'
import PreviewPane from './PreviewPane'
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
  const [opts, setOpts] = useState({ zoom: 1, fontSize: 14, lineHeight: 1.6, color: '' })
  const [avatar, setAvatar] = useState<any>(null)
  const [photo, setPhoto] = useState('')
  const extrasRef = { current: {} as Record<string, string> }
  const [rid, setRid] = useState(initRid)
  const [aiOpen, setAiOpen] = useState(false)
  const dirtyRef = { current: false }
  const saveTimer = { current: 0 as any }

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
    if (!initRid) setMd(composeMd({ title: meta?.name ?? '我的简历', items: sels }))
  }, [sels, tplId])

  // 模板头像位配置（种子 json 的 avatar 字段）
  useEffect(() => {
    fetch(`/seeds/tpl/${tplId}.json`).then(r => r.ok ? r.json() : null)
      .then(d => setAvatar(d?.avatar ?? null)).catch(() => setAvatar(null))
  }, [tplId])

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
      api.updateResume(rid, { contentMd: md }).catch(() => {})
      if (tplId !== meta?.slug) api.updateResume(rid, { templateId: tplId }).catch(() => {})
      dirtyRef.current = false
    }, 1000)
    return () => clearTimeout(saveTimer.current)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [md])

  const exportPdf = async (kind: 'pdf' | 'png' | 'docx') => {
    setExporting(kind)
    try {
      const body = document.querySelector('.markdown-transform-html.jufe')?.innerHTML ?? ''
      const optsCss = `<style>.markdown-transform-html{font-size:${opts.fontSize}px;line-height:${opts.lineHeight};${opts.color ? `--markdown-primary-bg-color:${opts.color}` : ''}}</style>`
      const r = await fetch('/api/v2/export', {
        method: 'POST', headers: { 'content-type': 'application/json', 'authorization': `Bearer ${localStorage.getItem('v2:token') ?? ''}` },
        body: JSON.stringify({
          content: optsCss + body, style: skinHref(meta?.slug ?? tplId), name: meta?.name ?? 'resume', type: kind,
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
    const body = document.querySelector('.markdown-transform-html.jufe')?.innerHTML ?? ''
    let brand = true
    try { const me: any = await api.me(); brand = !me?.member } catch {}
    const w = window.open('', '_blank')!
    w.document.write(`<!DOCTYPE html><html><head><meta charset=utf-8><title>${meta?.name}</title>
      <link rel="stylesheet" href="${skinHref(meta?.slug ?? tplId)}">
      <style>@page{size:A4;margin:0}body{margin:0}.markdown-transform-html{width:210mm;margin:0 auto}</style>
      </head><body><div class="markdown-transform-html jufe">${body}</div>
      ${brand ? `<div style="position:fixed;bottom:6mm;right:10mm;font-size:9px;color:#b0b0b0;letter-spacing:.5px">由 CodeCV 制作 · codecv.zalize.com</div>` : ''}
      <script>onload=()=>setTimeout(()=>print(),400)<\/script></body></html>`)
    w.document.close()
  }

  return (
    <div className="h-screen flex flex-col">
      <div className="border-b px-4 py-2 flex items-center gap-3 flex-wrap">
        <button onClick={onBack} className="text-sm text-neutral-500 hover:text-black">← 模板中心</button>
        <select className="text-sm border rounded px-2 py-0.5" value={tplId} onChange={e => setTplId(e.target.value)}>
          {Object.entries(catalog as Record<string, any>).map(([id, t]) => <option key={id} value={id}>{t.name}</option>)}
        </select>
        <span className="text-xs text-neutral-400">{meta?.font}</span>
        <div className="flex border rounded overflow-hidden text-xs">
          <button className={mode === 'md' ? 'bg-black text-white px-2 py-1' : 'px-2 py-1'} onClick={() => setMode('md')}>md</button>
          <button className={mode === 'rich' ? 'bg-black text-white px-2 py-1' : 'px-2 py-1'} onClick={() => setMode('rich')}>内容模式</button>
        </div>
        <label className="text-xs text-neutral-500">字号
          <input type="number" min={10} max={20} step={0.5} className="w-12 border rounded px-1 py-0.5 ml-1" value={opts.fontSize}
            onChange={e => setOpts({ ...opts, fontSize: +e.target.value })} /></label>
        <label className="text-xs text-neutral-500">行距
          <select className="border rounded px-1 py-0.5 ml-1" value={opts.lineHeight}
            onChange={e => setOpts({ ...opts, lineHeight: +e.target.value })}>
            {[1.2,1.4,1.6,1.8,2.0].map(v => <option key={v} value={v}>{v}</option>)}
          </select></label>
        <label className="text-xs text-neutral-500">主题色
          <input type="color" className="w-7 h-6 ml-1 align-middle" value={opts.color || meta?.primaryColor || '#333333'}
            onChange={e => setOpts({ ...opts, color: e.target.value })} /></label>
        <label className="text-xs text-neutral-500">缩放
          <select className="border rounded px-1 py-0.5 ml-1" value={opts.zoom}
            onChange={e => setOpts({ ...opts, zoom: +e.target.value })}>
            {[0.5,0.7,0.85,1,1.25,1.5].map(v => <option key={v} value={v}>{v}</option>)}
          </select></label>
        <label className="text-xs">字体
          <select className="border rounded px-1 py-0.5 ml-1" value={opts.fontFamily || ''}
            onChange={e => setOpts({ ...opts, fontFamily: e.target.value || undefined })}>
            <option value="">模板默认</option>
            <option value="'Noto Sans SC', sans-serif">黑体</option>
            <option value="'Noto Serif SC', serif">宋体</option>
            <option value="'LXGW WenKai', 'Kaiti SC', serif">楷体</option>
            <option value="Arial, 'Helvetica Neue', sans-serif">英文无衬线</option>
            <option value="Georgia, 'Times New Roman', serif">英文衬线</option>
          </select></label>
        {avatar && (
          <label className="text-xs border rounded px-2 py-1 cursor-pointer">
            {photo ? '更换照片' : '上传照片'}
            <input type="file" accept="image/*" className="hidden"
              onChange={e => e.target.files?.[0] && uploadPhoto(e.target.files[0])} />
          </label>)}
        <button className={`text-xs border rounded px-2 py-1 ${aiOpen ? 'bg-black text-white' : ''}`}
          onClick={() => setAiOpen(!aiOpen)}>AI</button>
        <div className="flex-1" />
        <button className="text-xs border rounded px-2 py-1" onClick={printPdf}>打印 PDF</button>
        <button className="text-xs bg-black text-white rounded px-2 py-1" disabled={!!exporting}
          onClick={() => exportPdf('pdf')}>{exporting === 'pdf' ? '渲染中…' : 'VPS 导出 PDF'}</button>
        <button className="text-xs border rounded px-2 py-1" disabled={!!exporting}
          onClick={() => exportPdf('png')}>{exporting === 'png' ? '渲染中…' : 'VPS PNG'}</button>
        <button className="text-xs border rounded px-2 py-1" disabled={!!exporting}
          onClick={() => exportPdf('docx')}>{exporting === 'docx' ? '渲染中…' : '导出 docx'}</button>
      </div>
      <div className="flex-1 flex flex-col md:flex-row overflow-y-auto md:overflow-hidden">
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
          <PreviewPane md={md} skinCss={skinHref(meta?.slug ?? tplId)} primaryColor={meta?.primaryColor} font={meta?.font} opts={opts} avatar={avatar} photo={photo} />
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
