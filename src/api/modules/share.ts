// 分享/面经投稿/评论 后端 API（Pages Functions + D1）
import { getLocalStorage } from '@/common/localstorage'

const TOKEN_KEY = 'TOKEN'
const token = () => (getLocalStorage(TOKEN_KEY) as string) || ''

const post = async (url: string, body: object) => {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token()}` },
    body: JSON.stringify(body)
  })
  return res.json()
}
const get = async (url: string) => {
  const res = await fetch(url, { headers: { Authorization: `Bearer ${token()}` } })
  return res.json()
}

export const createShare = (p: { type: string; name: string; content: string }) =>
  post('/api/share/create', p)
export const getShare = (id: string) => get(`/api/share/get?id=${encodeURIComponent(id)}`)

export const submitMianjing = (f: object) => post('/api/mianjing/submit', f)
export const myMianjing = () => get('/api/mianjing/mine')
export const delMianjing = (id: number | string) => post('/api/mianjing/del-mine', { id })

export const listComments = (doc: string) => get(`/api/comment/list?doc=${encodeURIComponent(doc)}`)
export const createComment = (doc: string, content: string) =>
  post('/api/comment/create', { doc, content })
