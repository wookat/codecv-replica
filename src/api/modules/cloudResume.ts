// 云端简历同步层：已登录用户把 localStorage 的 markdown-content-* 与 /api/resume/* 互相同步
import { getLocalStorage, setLocalStorage } from '@/common/localstorage'

const TOKEN_KEY = 'TOKEN'
const MD_PREFIX = 'markdown-content-'

const token = () => (getLocalStorage(TOKEN_KEY) as string) || ''
const headers = () =>
  token() ? { Authorization: `Bearer ${token()}`, 'Content-Type': 'application/json' } : null

interface CloudResume {
  type: string
  name: string
  content: string
  updated_at: number
}

export async function cloudList(): Promise<CloudResume[]> {
  const h = headers()
  if (!h) return []
  try {
    const res = await fetch('/api/resume/list', { headers: h })
    const data = await res.json()
    return data.code === 200 ? data.data : []
  } catch {
    return []
  }
}

// 按 type 去抖上传（编辑器每次击键都会触发 setMDContent）
const pending = new Map<string, ReturnType<typeof setTimeout>>()
export function cloudPush(type: string, content: string) {
  if (!token()) return
  const prev = pending.get(type)
  if (prev) clearTimeout(prev)
  pending.set(
    type,
    setTimeout(() => {
      pending.delete(type)
      const h = headers()
      if (!h) return
      fetch('/api/resume/save', {
        method: 'POST',
        headers: h,
        body: JSON.stringify({ type, content })
      }).catch(() => {
        /* 云端同步失败静默 */
      })
    }, 1500)
  )
}

export async function cloudDelete(type: string) {
  const h = headers()
  if (!h) return
  try {
    await fetch('/api/resume/delete', {
      method: 'POST',
      headers: h,
      body: JSON.stringify({ type })
    })
  } catch {
    /* 云端删除失败不阻塞本地删除 */
  }
}

// 合并策略：云端独有 → 落入 localStorage（编辑器可打开）；本地独有 → 上传；同名保留本地并覆盖云端
export async function syncLocalCloud() {
  if (!token()) return
  const cloud = await cloudList()
  const localTypes = new Set<string>()
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i) ?? ''
    if (key.startsWith(MD_PREFIX)) localTypes.add(key.slice(MD_PREFIX.length))
  }
  for (const r of cloud) {
    if (!r.type || !r.content) continue
    if (!localTypes.has(r.type)) {
      setLocalStorage(`${MD_PREFIX}${r.type}`, r.content)
    }
  }
  const cloudTypes = new Set(cloud.map(r => r.type))
  for (const t of localTypes) {
    if (!cloudTypes.has(t)) {
      const raw = getLocalStorage(`${MD_PREFIX}${t}`)
      if (typeof raw === 'string' && raw) cloudPush(t, raw)
    }
  }
}
