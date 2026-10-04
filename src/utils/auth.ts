/* 账号态：真后端 /user/* 会话（TOKEN/USERNAME 存于 localStorage），loginLocal 仅为兼容兜底 */
import { getLocalStorage, removeLocalStorage, setLocalStorage } from '@/common/localstorage'

const TOKEN = 'TOKEN'
const USERNAME = 'USERNAME'
const KEY = 'codecv-user'

export interface LocalUser {
  name: string
  loginAt: number
}

export function currentUser(): LocalUser | null {
  const token = getLocalStorage(TOKEN)
  const username = getLocalStorage(USERNAME)
  if (token && username) return { name: String(username), loginAt: 0 }
  try {
    const raw = localStorage.getItem(KEY)
    return raw ? (JSON.parse(raw) as LocalUser) : null
  } catch {
    return null
  }
}

export function loginLocal(name = '微信用户') {
  localStorage.setItem(KEY, JSON.stringify({ name, loginAt: Date.now() }))
}

export function logoutLocal() {
  const username = getLocalStorage(USERNAME)
  if (username) {
    fetch('/user/logout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username })
    }).catch(() => {
      /* 云端同步失败静默 */
    })
  }
  removeLocalStorage(TOKEN)
  removeLocalStorage(USERNAME)
  localStorage.removeItem(KEY)
}

export { setLocalStorage }
