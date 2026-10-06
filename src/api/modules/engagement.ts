// 互动 API（对齐生产 /api/engagement/*）：点赞/收藏切换 + 评论/回复/删除
import { getLocalStorage } from '@/common/localstorage'

const TOKEN_KEY = 'TOKEN'
const token = () => (getLocalStorage(TOKEN_KEY) as string) || ''
const headers = () =>
  token() ? { Authorization: `Bearer ${token()}`, 'Content-Type': 'application/json' } : null

export interface EngageState {
  likeCount: number
  favCount: number
  commentCount: number
  liked: boolean
  faved: boolean
}

export interface EngageComment {
  id: number
  nickname: string
  content: string
  created_at: number
  parent_id: number
  user_id: number
  parent_nickname?: string
  parent_content?: string
}

export async function engagementState(
  targetType: string,
  targetId: string
): Promise<EngageState | null> {
  try {
    const h = headers() || {}
    const res = await fetch(
      `/api/engagement/state?targetType=${targetType}&targetId=${encodeURIComponent(targetId)}`,
      { headers: h }
    )
    const data = await res.json()
    return data.code === 200 ? data.data : null
  } catch {
    return null
  }
}

export async function engagementReaction(
  targetType: string,
  targetId: string,
  kind: 'like' | 'fav'
): Promise<(EngageState & { active: boolean }) | null> {
  const h = headers()
  if (!h) return null
  try {
    const res = await fetch('/api/engagement/reaction', {
      method: 'POST',
      headers: h,
      body: JSON.stringify({ targetType, targetId, kind })
    })
    const data = await res.json()
    return data.code === 200 ? data.data : null
  } catch {
    return null
  }
}

export async function engagementComments(
  targetType: string,
  targetId: string
): Promise<EngageComment[]> {
  try {
    const res = await fetch(
      `/api/engagement/comments?targetType=${targetType}&targetId=${encodeURIComponent(targetId)}`
    )
    const data = await res.json()
    return data.code === 200 ? data.data.list : []
  } catch {
    return []
  }
}

export async function engagementComment(
  targetType: string,
  targetId: string,
  content: string,
  parent_id = 0
): Promise<{ code: number; msg?: string }> {
  const h = headers()
  if (!h) return { code: 401, msg: '请先登录' }
  const res = await fetch('/api/engagement/comment', {
    method: 'POST',
    headers: h,
    body: JSON.stringify({ targetType, targetId, content, parent_id })
  })
  return await res.json()
}

export async function engagementCommentDelete(id: number): Promise<{ code: number; msg?: string }> {
  const h = headers()
  if (!h) return { code: 401, msg: '请先登录' }
  const res = await fetch('/api/engagement/comment-delete', {
    method: 'POST',
    headers: h,
    body: JSON.stringify({ id })
  })
  return await res.json()
}
