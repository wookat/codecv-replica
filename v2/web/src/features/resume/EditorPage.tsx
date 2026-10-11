// 编辑器页：左=选取面板+md 编辑，右=mth 预览；顶栏换肤+导出双链
import { useEffect, useState } from 'react'
import CodeMirror from '@uiw/react-codemirror'
import { markdown } from '@codemirror/lang-markdown'
import { api } from '../../core/api/client'
import { composeMd, skinHref, templateMeta, type SelItem } from './composer'
import PreviewPane from './PreviewPane'
import ContentEditor from './ContentEditor'
import catalog from '../templates/catalog.json'

export default function EditorPage({ templateId: initTpl, masterId, onBack }: {
  templateId: string; masterId: string; onBack: () => void
}) {
  const [tplId, setTplId] = useState(initTpl)          // 快捷换肤
  const meta = templateMeta(tplId)
  const [md, setMd] = useState('')
  const [sels, setSels] = useState<SelItem[]>([])
  const [exporting, setExporting] = useState('')
  const [mode, setMode] = useState<'md' | 'rich'>('md')   // md 编辑 | 内容模式

  useEffect(() => {
    api.createResume({ masterId, templateId: tplId, title: meta?.name ?? tplId }).catch(() => {})
  }, [tplId, masterId])

  useEffect(() => {
    setMd(composeMd({ title: meta?.name ?? '我的简历', items: sels }))
  }, [sels, tplId])

  const exportPdf = async (kind: 'pdf' | 'png') => {
    setExporting(kind)
    try {
      const body = document.querySelector('.markdown-transform-html.jufe')?.innerHTML ?? ''
      const r = await fetch('/api/v2/export', {
        method: 'POST', headers: { 'content-type': 'application/json', 'authorization': `Bearer ${localStorage.getItem('v2:token') ?? ''}` },
        body: JSON.stringify({
          content: body, style: skinHref(meta?.slug ?? tplId), name: meta?.name ?? 'resume', type: kind,
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

  const printPdf = () => {
    const body = document.querySelector('.markdown-transform-html.jufe')?.innerHTML ?? ''
    const w = window.open('', '_blank')!
    w.document.write(`<!DOCTYPE html><html><head><meta charset=utf-8><title>${meta?.name}</title>
      <link rel="stylesheet" href="${skinHref(meta?.slug ?? tplId)}">
      <style>@page{size:A4;margin:0}body{margin:0}.markdown-transform-html{width:210mm;margin:0 auto}</style>
      </head><body><div class="markdown-transform-html jufe">${body}</div>
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
        <div className="flex-1" />
        <button className="text-xs border rounded px-2 py-1" onClick={printPdf}>打印 PDF</button>
        <button className="text-xs bg-black text-white rounded px-2 py-1" disabled={!!exporting}
          onClick={() => exportPdf('pdf')}>{exporting === 'pdf' ? '渲染中…' : 'VPS 导出 PDF'}</button>
        <button className="text-xs border rounded px-2 py-1" disabled={!!exporting}
          onClick={() => exportPdf('png')}>{exporting === 'png' ? '渲染中…' : 'VPS PNG'}</button>
      </div>
      <div className="flex-1 flex flex-col md:flex-row overflow-y-auto md:overflow-hidden">
        <div className="md:w-80 w-full md:border-r border-b bg-neutral-50 md:overflow-y-auto">
          <MasterPick masterId={masterId} onSelect={setSels} />
        </div>
        <div className="md:w-[420px] w-full md:border-r border-b min-h-[300px]">
          {mode === 'md'
            ? <CodeMirror value={md} height="100%" style={{ height: '100%' }}
                extensions={[markdown()]} onChange={v => setMd(v)} />
            : <ContentEditor md={md} onMd={setMd} />}
        </div>
        <div className="flex-1">
          <PreviewPane md={md} skinCss={skinHref(meta?.slug ?? tplId)} primaryColor={meta?.primaryColor} font={meta?.font} />
        </div>
      </div>
    </div>
  )
}

import MasterLibrary from '../master/MasterLibrary'
function MasterPick(props: { masterId: string; onSelect: (s: SelItem[]) => void }) {
  return <MasterLibrary {...props} />
}
