// 投递进度云端 API（/api/progress/*，需登录；未登录时页面回落 localStorage）
import { getLocalStorage } from '@/common/localstorage'

const TOKEN_KEY = 'TOKEN'
const token = () => (getLocalStorage(TOKEN_KEY) as string) || ''
const headers = () =>
  token() ? { Authorization: `Bearer ${token()}`, 'Content-Type': 'application/json' } : null

export interface CloudProgress {
  id: number
  name: string
  post: string
  workLocation: string
  status: string
  channel: string
  link: string
  mark: string
  snapshot: Record<string, unknown>
  post_time: number
  update_time: number
  create_time: number
  events?: { status: string; time: number }[]
}

export async function progressPage(): Promise<CloudProgress[]> {
  const h = headers()
  if (!h) return []
  try {
    const res = await fetch('/api/progress/page', { headers: h })
    const data = await res.json()
    return data.code === 200 ? data.data.list : []
  } catch {
    return []
  }
}

export async function progressAdd(body: {
  name: string
  post?: string
  workLocation?: string
  status?: string
  channel?: string
  link?: string
  mark?: string
  snapshot?: Record<string, unknown>
  post_time?: number
}): Promise<{ code: number; data?: { id: number }; msg?: string }> {
  const h = headers()
  if (!h) return { code: 401, msg: '请先登录' }
  const res = await fetch('/api/progress/add', {
    method: 'POST',
    headers: h,
    body: JSON.stringify(body)
  })
  return await res.json()
}

export async function progressEdit(body: {
  id: number
  name?: string
  post?: string
  workLocation?: string
  status?: string
  channel?: string
  link?: string
  mark?: string
  post_time?: number
}): Promise<{ code: number; msg?: string }> {
  const h = headers()
  if (!h) return { code: 401, msg: '请先登录' }
  const res = await fetch('/api/progress/edit', {
    method: 'POST',
    headers: h,
    body: JSON.stringify(body)
  })
  return await res.json()
}

export async function progressDelete(id: number): Promise<{ code: number; msg?: string }> {
  const h = headers()
  if (!h) return { code: 401, msg: '请先登录' }
  const res = await fetch('/api/progress/delete', {
    method: 'POST',
    headers: h,
    body: JSON.stringify({ id })
  })
  return await res.json()
}
