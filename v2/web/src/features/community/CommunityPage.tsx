// 社区：帖子列表/详情/评论/点赞 + 面经浏览/投递
import { useEffect, useState } from 'react'
import { api } from '../../core/api/client'

export default function CommunityPage() {
  const [tab, setTab] = useState('posts')
  const [posts, setPosts] = useState<any[]>([])
  const [cur, setCur] = useState<any>(null)
  const [mj, setMj] = useState<any[]>([])
  const [cmt, setCmt] = useState('')
  const [form, setForm] = useState<any>({ anonymous: true })
  const loadPosts = () => api.posts().then(setPosts).catch(() => {})
  useEffect(() => { loadPosts(); api.mianjing().then(setMj).catch(() => {}) }, [])
  const open = (id: string) => api.post(id).then(setCur)
  const like = async () => { await api.likePost(cur.id); open(cur.id); }
  const comment = async () => {
    if (!cmt.trim()) return
    await api.commentPost(cur.id, cmt); setCmt(''); open(cur.id)
  }
  if (cur) return (
    <div className="p-6 max-w-3xl mx-auto">
      <button className="text-sm text-neutral-500 mb-3" onClick={() => setCur(null)}>← 返回列表</button>
      <h2 className="text-xl font-bold">{cur.title}</h2>
      <div className="text-xs text-neutral-400 my-2">{cur.author} · {new Date(cur.created_at).toLocaleDateString()}</div>
      <article className="prose prose-sm max-w-none whitespace-pre-wrap cv-card p-4">{cur.content_md}</article>
      <button className="cv-btn cv-btn-ghost mt-3 text-sm" onClick={like}>♥ {cur.likes}</button>
      <div className="mt-6 space-y-3">
        <h3 className="font-medium text-sm">评论 {cur.comments.length}</h3>
        {cur.comments.map((x: any) => (
          <div key={x.id} className="text-sm border-b pb-2"><b className="text-xs">{x.nickname}</b> {x.content}
            <span className="text-[10px] text-neutral-400 ml-2">{new Date(x.created_at).toLocaleDateString()}</span></div>))}
        <div className="flex gap-2">
          <input className="cv-input flex-1" placeholder="写评论…" value={cmt} onChange={e => setCmt(e.target.value)} />
          <button className="cv-btn cv-btn-primary" onClick={comment}>发表</button>
        </div>
      </div>
    </div>
  )
  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex gap-2 mb-4 text-sm">
        {[['posts', '社区帖子'], ['mj', '面经'], ['submit', '投递面经']].map(([k, l]) => (
          <button key={k} className={`cv-nav ${tab === k ? 'cv-nav-on' : ''}`} onClick={() => setTab(k)}>{l}</button>))}
      </div>
      {tab === 'posts' && (
        <div className="grid gap-3">{posts.map(p => (
          <button key={p.id} className="cv-card cv-card-hover p-4 text-left" onClick={() => open(p.id)}>
            <div className="font-medium">{p.title}</div>
            <div className="text-xs text-neutral-400 mt-1">{p.summary || p.category} · {p.author}</div>
          </button>))}
          {!posts.length && <div className="text-neutral-400 text-sm">暂无帖子</div>}
        </div>)}
      {tab === 'mj' && (
        <table className="w-full text-xs border bg-white">
          <thead><tr className="bg-neutral-50"><th className="p-2 text-left">标题</th><th>公司</th><th>批次</th><th>轮次</th><th>结果</th></tr></thead>
          <tbody>{mj.map(m => (
            <tr key={m.id} className="border-t"><td className="p-2">{m.title}</td><td className="text-center">{m.company_name}</td>
              <td className="text-center">{m.batch}</td><td className="text-center">{m.round}</td><td className="text-center">{m.result}</td></tr>))}
          </tbody>
        </table>)}
      {tab === 'submit' && (
        <div className="space-y-2 max-w-md text-sm">
          {[['title', '标题'], ['company_name', '公司'], ['grade', '年级'], ['batch', '批次(如 2024秋招)'], ['round', '轮次'], ['result', '结果'], ['school', '学校'], ['major', '专业']].map(([k, l]) => (
            <input key={k} className="cv-input w-full" placeholder={l}
              onChange={e => setForm({ ...form, [k]: e.target.value })} />))}
          <textarea className="cv-input w-full h-32" placeholder="面经内容…"
            onChange={e => setForm({ ...form, content: e.target.value })} />
          <label className="text-xs"><input type="checkbox" checked={form.anonymous} onChange={e => setForm({ ...form, anonymous: e.target.checked })} /> 匿名</label>
          <button className="cv-btn cv-btn-primary" onClick={async () => {
            await api.submitMianjing(form); alert('投递成功'); api.mianjing().then(setMj); setTab('mj')
          }}>投递</button>
        </div>)}
    </div>
  )
}
