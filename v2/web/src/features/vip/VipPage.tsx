// 会员中心：档位购买/订单/兑换码/配额展示
import { useEffect, useState } from 'react'
import { api } from '../../core/api/client'

const PLANS = [['月度会员', '¥19.9'], ['季度会员', '¥39.9'], ['年度会员', '¥99.9'], ['终身会员', '¥199']]

export default function VipPage() {
  const [me, setMe] = useState<any>(null)
  const [orders, setOrders] = useState<any[]>([])
  const [code, setCode] = useState('')
  const [msg, setMsg] = useState('')
  const [inv, setInv] = useState<any>(null)
  const load = () => { api.me().then(setMe).catch(() => {}); api.orders().then(setOrders).catch(() => {}); api.invites().then(setInv).catch(() => {}) }
  useEffect(() => { load() }, [])
  const buy = async (plan: string) => {
    const o = await api.createOrder(plan)
    if (confirm(`订单 ${o.orderNo}（${plan}）— 模拟支付确认？`)) {
      await api.payOrder(o.orderNo); setMsg('已开通会员'); load()
    }
  }
  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <h2 className="text-lg font-semibold">会员中心</h2>
      {me && (
        <div className="border rounded-lg p-4 bg-white text-sm">
          <b>{me.username}</b>
          {me.member
            ? <span className="ml-2 text-green-600">{me.vipPlan} · 至 {new Date(me.vipExpire).toLocaleDateString()}</span>
            : <span className="ml-2 text-neutral-400">免费版</span>}
          <div className="text-xs text-neutral-500 mt-1">
            简历 {me.resumeCount}/{me.cvQuota === -1 ? '∞' : me.cvQuota} · AI 次数 {me.member ? '∞' : me.ai}
            {me.streak > 0 && <span className="ml-2 text-orange-500">🔥 连签 {me.streak} 天</span>}
          </div>
          {!me.member && (
            <button className={`mt-2 text-xs rounded px-3 py-1.5 ${me.checkedToday ? 'bg-neutral-200 text-neutral-500' : 'bg-orange-500 text-white'}`}
              disabled={me.checkedToday} onClick={async () => {
                const r = await api.checkin(); setMsg(r.first ? `签到成功 +3 AI 次数（连签 ${r.streak} 天）` : '今天已签过')
                load()
              }}>{me.checkedToday ? '今日已签到' : '签到 +3 AI 次数'}</button>)}
        </div>
      )}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {PLANS.map(([p, price]) => (
          <div key={p} className="border rounded-lg p-4 bg-white text-center">
            <div className="font-semibold">{p}</div>
            <div className="text-xl my-2">{price}</div>
            <button className="bg-black text-white rounded px-3 py-1 text-sm" onClick={() => buy(p)}>开通</button>
          </div>
        ))}
      </div>
      <div className="flex gap-2 items-center text-sm">
        <input className="border rounded px-2 py-1" placeholder="兑换码" value={code} onChange={e => setCode(e.target.value)} />
        <button className="border rounded px-3 py-1" onClick={async () => {
          const r = await api.redeem(code).catch((e: any) => ({ error: String(e) }))
          setMsg(r.error ? '兑换失败' : `兑换成功 +${r.days} 天`); load()
        }}>兑换</button>
        {msg && <span className="text-xs text-neutral-500">{msg}</span>}
      </div>
      {me && (
        <div className="border rounded-lg p-4 bg-white text-sm space-y-2">
          <h3 className="font-medium">邀请好友 · 返佣 10%</h3>
          <div className="flex gap-2 items-center">
            <input readOnly className="border rounded px-2 py-1 text-xs flex-1 bg-neutral-50"
              value={`${location.origin}/?inv=${me.username}`} />
            <button className="bg-black text-white text-xs rounded px-3 py-1.5" onClick={async e => {
              await navigator.clipboard.writeText(`${location.origin}/?inv=${me.username}`)
              ;(e.target as HTMLElement).textContent = '已复制'
            }}>复制邀请链接</button>
          </div>
          <div className="text-xs text-neutral-500">好友通过链接注册并首次付费，你获订单金额 10% 返佣{inv ? ` · 累计返佣 ¥${(inv.total / 100).toFixed(2)}` : ''}</div>
          {inv?.records?.length > 0 && (
            <table className="w-full text-xs border mt-2">
              <thead><tr className="bg-neutral-50"><th className="p-1.5 text-left">被邀请人</th><th>订单号</th><th>返佣</th><th>结算</th><th>时间</th></tr></thead>
              <tbody>{inv.records.map((r: any) => (
                <tr key={r.orderNo} className="border-t">
                  <td className="p-1.5">{r.invitee}</td><td>{r.orderNo}</td>
                  <td>¥{(r.commission / 100).toFixed(2)}</td><td>{r.settleStatus}</td>
                  <td>{new Date(r.created_at).toLocaleDateString()}</td>
                </tr>))}
              </tbody>
            </table>)}
        </div>)}
      <div>
        <h3 className="font-medium mb-2 text-sm">订单记录</h3>
        <table className="w-full text-xs border">
          <thead><tr className="bg-neutral-50"><th className="p-2 text-left">订单号</th><th>档位</th><th>金额</th><th>状态</th><th>时间</th></tr></thead>
          <tbody>{orders.map(o => (
            <tr key={o.orderNo} className="border-t">
              <td className="p-2">{o.orderNo}</td><td className="text-center">{o.plan}</td>
              <td className="text-center">¥{(o.amount / 100).toFixed(2)}</td>
              <td className="text-center">{o.status === 'paid' ? '已支付' : '待支付'}</td>
              <td className="text-center">{new Date(o.created_at).toLocaleDateString()}</td>
            </tr>))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
