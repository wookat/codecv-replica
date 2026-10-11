// 编辑器页：左=选取面板+md 编辑，右=mth 预览（皮肤实时挂载）
import { useEffect, useState } from 'react'
import CodeMirror from '@uiw/react-codemirror'
import { markdown } from '@codemirror/lang-markdown'
import { api } from '../../core/api/client'
import { composeMd, skinHref, templateMeta, type SelItem } from './composer'
import PreviewPane from './PreviewPane'

export default function EditorPage({ templateId, masterId, onBack }: {
  templateId: string; masterId: string; onBack: () => void
}) {
  const meta = templateMeta(templateId)
  const [md, setMd] = useState('')
  const [resumeId, setResumeId] = useState('')
  const [sels, setSels] = useState<SelItem[]>([])

  useEffect(() => {
    api.createResume({ masterId, templateId, title: meta?.name ?? templateId }).then(r => setResumeId(r.id))
  }, [templateId, masterId])

  useEffect(() => {
    setMd(composeMd({ title: meta?.name ?? '我的简历', items: sels }))
  }, [sels])

  return (
    <div className="h-screen flex flex-col">
      <div className="border-b px-4 py-2 flex items-center gap-3">
        <button onClick={onBack} className="text-sm text-neutral-500 hover:text-black">← 模板中心</button>
        <span className="font-medium">{meta?.name ?? templateId}</span>
        <span className="text-xs text-neutral-400">{meta?.font}</span>
      </div>
      <div className="flex-1 flex overflow-hidden">
        <div className="w-80 border-r bg-neutral-50">
          <MasterPick masterId={masterId} onSelect={setSels} />
        </div>
        <div className="w-[420px] border-r">
          <CodeMirror value={md} height="100%" style={{ height: '100%' }}
            extensions={[markdown()]} onChange={v => setMd(v)} />
        </div>
        <div className="flex-1">
          <PreviewPane md={md} skinCss={skinHref(meta?.slug ?? templateId)} primaryColor={meta?.primaryColor} font={meta?.font} />
        </div>
      </div>
    </div>
  )
}

import MasterLibrary from '../master/MasterLibrary'
function MasterPick(props: { masterId: string; onSelect: (s: SelItem[]) => void }) {
  return <MasterLibrary {...props} />
}
