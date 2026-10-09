// 模板收藏：登录走云端 /api/favorite/*，未登录落 localStorage（提示登录同步）
import { getLocalStorage } from '@/common/localstorage'
import { currentUser } from '@/utils/auth'

const FAV_KEY = 'tpl-favorites'
const token = () => (getLocalStorage('TOKEN') as string) || ''
const headers = () => ({
  Authorization: `Bearer ${token()}`,
  'Content-Type': 'application/json'
})

const localGet = (): string[] => {
  try {
    return JSON.parse(localStorage.getItem(FAV_KEY) || '[]')
  } catch {
    return []
  }
}
const localSet = (list: string[]) => localStorage.setItem(FAV_KEY, JSON.stringify(list))

export async function favoriteList(): Promise<{ types: string[]; cloud: boolean }> {
  if (currentUser() && token()) {
    try {
      const res = await fetch('/api/favorite/list', { headers: headers() })
      const data = await res.json()
      if (data.code === 200)
        return { types: data.data.map((r: { type: string }) => r.type), cloud: true }
    } catch {
      /* 降级本地 */
    }
  }
  return { types: localGet(), cloud: false }
}

export async function favoriteToggle(
  type: string
): Promise<{ favorited: boolean; cloud: boolean }> {
  if (currentUser() && token()) {
    try {
      const res = await fetch('/api/favorite/toggle', {
        method: 'POST',
        headers: headers(),
        body: JSON.stringify({ type })
      })
      const data = await res.json()
      if (data.code === 200) return { favorited: data.data.favorited, cloud: true }
    } catch {
      /* 降级本地 */
    }
  }
  const list = localGet()
  const i = list.indexOf(type)
  if (i >= 0) {
    list.splice(i, 1)
    localSet(list)
    return { favorited: false, cloud: false }
  }
  list.push(type)
  localSet(list)
  return { favorited: true, cloud: false }
}
