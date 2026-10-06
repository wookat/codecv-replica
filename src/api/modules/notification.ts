// 站内通知 API（/api/notification/{list,unread-count,read}）
import { getLocalStorage } from '@/common/localstorage'
import { post } from '../config'

// OSS 旧版接口（comment-reply-msg 使用）
export function queryNotification(data: { pageSize: number; pageNum: number; uid: number }) {
  return post('/notification/list', data)
}

export function updateNotificationState(data: { commentId: number }) {
  return post('/notification/read', data)
}

const TOKEN_KEY = 'TOKEN'
const token = () => (getLocalStorage(TOKEN_KEY) as string) || ''
const headers = () => (token() ? { Authorization: `Bearer ${token()}` } : null)

export interface Notice {
  id: number
  title: string
  content: string
  type: string
  link: string
  is_read: number
  created_at: number
}

export async function notifyUnreadCount(): Promise<number> {
  const h = headers()
  if (!h) return 0
  try {
    const res = await fetch('/api/notification/unread-count', { headers: h })
    const data = await res.json()
    return data.code === 200 ? data.data.count : 0
  } catch {
    return 0
  }
}

export async function notifyList(): Promise<Notice[]> {
  const h = headers()
  if (!h) return []
  try {
    const res = await fetch('/api/notification/list', { headers: h })
    const data = await res.json()
    return data.code === 200 ? data.data.list : []
  } catch {
    return []
  }
}

export async function notifyRead(id?: number): Promise<void> {
  const h = headers()
  if (!h) return
  await fetch('/api/notification/read', {
    method: 'POST',
    headers: { ...h, 'Content-Type': 'application/json' },
    body: JSON.stringify(id ? { id } : { all: true })
  })
}
