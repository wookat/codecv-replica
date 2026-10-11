// Admin 后台核心：看板/用户/订单/兑换码
import { useEffect, useState } from 'react'
import { api } from '../../core/api/client'

export default function AdminPage() {
  const [tab, setTab] = useState('stats')
  const [stats, setStats] = useState<any>(null)
  const [users, setUsers] = useState<any[]>([])
  const [orders, setOrders] = useState<any[]>([])
  const [days, setDays] = useState(30)
  const [codes, setCodes] = useState<string[]>([])
  const [events, setEvents] = useState<any[]>([])
  const [denied, setDenied] = useState(false)
  useEffect(() => {
    api.adminStats().then(setStats).catch(() => setDenied(true))
    api.adminUsers().then(setUsers).catch(() => {})
    api.adminOrders().then(setOrders).catch(() => {})
    api.adminEvents().then(setEvents).catch(() => {})
  }, [])
  if (denied) return <div className="p-8 text-neutral-400">无管理员权限</div>
  const upd = async (id: number, b: any) => { await api.adminUpdateUser(id, b); setUsers(await api.adminUsers()) }
  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex gap-2 mb-4 text-sm">
        {[['stats', '数据看板'], ['users', '用户管理'], ['orders', '订单'], ['redeem', '兑换码'], ['events', '告警事件']].map(([k, l]) => (
          <button key={k} className={`cv-nav ${tab === k ? 'cv-nav-on' : ''}`} onClick={() => setTab(k)}>{l}</button>
        ))}
      </div>
      {tab === 'stats' && stats && (
        <div className="grid grid-cols-3 md:grid-cols-7 gap-3 text-center">
          {[['用户', stats.users], ['在期会员', stats.members], ['订单', stats.orders], ['已支付', stats.paid],
            ['营收', '¥' + (stats.revenue / 100).toFixed(0)], ['v2简历', stats.resumes], ['大简历', stats.masters]].map(([l, v]) => (
            <div key={l} className="cv-card p-3"><div className="text-xl font-bold">{v}</div><div className="text-xs text-neutral-400">{l}</div></div>
          ))}
        </div>
      )}
      {tab === 'users' && (
        <table className="w-full text-xs border bg-white">
          <thead><tr className="bg-neutral-50"><th className="p-2 text-left">用户</th><th>会员</th><th>AI</th><th>状态</th><th className="text-left">操作</th></tr></thead>
          <tbody>{users.map(u => (
            <tr key={u.id} className="border-t">
              <td className="p-2">{u.username}{u.is_admin ? ' ⭐' : ''}</td>
              <td className="text-center">{u.vip_expire > Date.now() ? `${u.vip_plan}(${new Date(u.vip_expire).toLocaleDateString()})` : '-'}</td>
              <td className="text-center">{u.ai}</td>
              <td className="text-center">{u.banned ? '封禁' : '正常'}</td>
              <td className="p-1 space-x-1">
                <button className="cv-btn cv-btn-ghost text-xs" onClick={() => upd(u.id, { vip_expire: Date.now() + 30 * 86400e3, vip_plan: '月度会员' })}>+月卡</button>
                <button className="cv-btn cv-btn-ghost text-xs" onClick={() => upd(u.id, { ai: u.ai + 50 })}>+50AI</button>
                <button className="cv-btn cv-btn-ghost text-xs" onClick={() => upd(u.id, { banned: u.banned ? 0 : 1 })}>{u.banned ? '解封' : '封禁'}</button>
              </td>
            </tr>))}
          </tbody>
        </table>
      )}
      {tab === 'orders' && (
        <table className="w-full text-xs border bg-white">
          <thead><tr className="bg-neutral-50"><th className="p-2 text-left">订单</th><th>用户</th><th>档位</th><th>金额</th><th>状态</th></tr></thead>
          <tbody>{orders.map(o => (
            <tr key={o.orderNo} className="border-t"><td className="p-2">{o.orderNo}</td><td className="text-center">{o.username}</td>
              <td className="text-center">{o.plan}</td><td className="text-center">¥{(o.amount / 100).toFixed(2)}</td><td className="text-center">{o.status}</td></tr>))}
          </tbody>
        </table>
      )}
      {tab === 'events' && (
        <table className="w-full text-xs border bg-white">
          <thead><tr className="bg-neutral-50"><th className="p-2 text-left">类型</th><th className="text-left">详情</th><th>用户</th><th>时间</th></tr></thead>
          <tbody>{events.map((e, i) => (
            <tr key={i} className="border-t"><td className="p-2">{e.kind}</td>
              <td className="max-w-xs truncate">{e.detail}</td><td className="text-center">{e.username}</td>
              <td className="text-center">{new Date(e.created_at).toLocaleString()}</td></tr>))}
          </tbody>
        </table>
      )}
      {tab === 'redeem' && (
        <div className="space-y-2 text-sm">
          <div className="flex gap-2 items-center">
            <input type="number" className="cv-input w-24" value={days} onChange={e => setDays(+e.target.value)} /> 天
            <button className="cv-btn cv-btn-primary" onClick={async () => {
              setCodes((await api.adminMakeRedeem(days, 5)).codes)
            }}>生成 5 个</button>
          </div>
          {codes.map(x => <div key={x} className="font-mono text-xs">{x}</div>)}
        </div>
      )}
    </div>
  )
}
