// 认证：沿用 v1 的 PBKDF2+KV sess token 机制（better-auth 不引入——现成轮子够用）
import type { KVNamespace } from '@cloudflare/workers-types'

const ITERATIONS = 100000
const toHex = (buf: ArrayBuffer) => [...new Uint8Array(buf)].map(b => b.toString(16).padStart(2, '0')).join('')

export async function pbkdf2(password: string, saltHex: string): Promise<string> {
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveBits'])
  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', hash: 'SHA-256', salt: new TextEncoder().encode(saltHex), iterations: ITERATIONS },
    key, 256)
  return toHex(bits)
}

export async function hashPassword(password: string): Promise<{ salt: string; hash: string }> {
  const salt = toHex(crypto.getRandomValues(new Uint8Array(16)).buffer)
  return { salt, hash: await pbkdf2(password, salt) }
}

export async function issueToken(kv: KVNamespace, username: string): Promise<string> {
  const token = toHex(crypto.getRandomValues(new Uint8Array(32)).buffer)
  await kv.put(`sess:${token}`, username, { expirationTtl: 30 * 24 * 3600 })
  await kv.put(`tok:${username}`, token, { expirationTtl: 30 * 24 * 3600 })
  return token
}

export async function tokenUser(kv: KVNamespace, token: string | undefined): Promise<string | null> {
  if (!token) return null
  return kv.get(`sess:${token}`)
}

export function bearerToken(request: Request): string | undefined {
  const auth = request.headers.get('Authorization') || ''
  return auth.startsWith('Bearer ') ? auth.slice(7) : undefined
}
