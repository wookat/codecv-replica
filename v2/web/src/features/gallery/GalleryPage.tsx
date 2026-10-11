// 简历广场：公开浏览已分享简历 → /r/:id 只读页
import { useEffect, useState } from 'react'
import { api } from '../../core/api/client'

export default function GalleryPage() {
  const [list, setList] = useState<any[]>([])
  useEffect(() => { api.gallery().then(setList).catch(() => {}) }, [])
  return (
    <div className="min-h-screen bg-neutral-50 p-6">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center gap-4 mb-6">
          <a href="/" className="font-bold">CodeCV</a>
          <h1 className="text-lg font-semibold">简历广场</h1>
          <span className="text-xs text-neutral-400">{list.length} 份公开简历 · 点开查看成品效果</span>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {list.map(r => (
            <a key={r.id} href={`/r/${r.id}`} className="bg-white border rounded-lg overflow-hidden hover:shadow-md transition">
              <img src={`/api/v2/thumb/${r.templateId}`} loading="lazy" className="w-full aspect-[3/4] object-cover bg-neutral-100" alt={r.title} />
              <div className="p-2 text-xs truncate">{r.title || '未命名简历'}</div>
            </a>))}
        </div>
        {!list.length && <div className="text-center text-neutral-400 py-20 text-sm">还没有公开分享的简历——分享你的简历即可出现在这里</div>}
      </div>
    </div>
  )
}
