/* 复刻版本地账号态（线上版为微信 OAuth + 服务端 session） */
const KEY = 'codecv-user'

export interface LocalUser {
  name: string
  loginAt: number
}

export function currentUser(): LocalUser | null {
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
  localStorage.removeItem(KEY)
}
