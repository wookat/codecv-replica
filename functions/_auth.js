// 认证公共库：PBKDF2 密码哈希 + KV 会话 token + D1 用户查询
// users 表契约对齐前端 store/modules/user.ts 的 IUserInfo 字段

const ITERATIONS = 100000

const toHex = buf => [...new Uint8Array(buf)].map(b => b.toString(16).padStart(2, '0')).join('')

async function pbkdf2(password, saltHex) {
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(password),
    'PBKDF2',
    false,
    ['deriveBits']
  )
  const bits = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      hash: 'SHA-256',
      salt: new TextEncoder().encode(saltHex),
      iterations: ITERATIONS
    },
    key,
    256
  )
  return toHex(bits)
}

export async function hashPassword(password) {
  const salt = toHex(crypto.getRandomValues(new Uint8Array(16)).buffer)
  return { salt, hash: await pbkdf2(password, salt) }
}

export async function verifyPassword(password, salt, expected) {
  return (await pbkdf2(password, salt)) === expected
}

// ---- 会话：KV sess:<token> -> username（30d TTL），tok:<username> -> token ----
export async function issueToken(kv, username) {
  const token = toHex(crypto.getRandomValues(new Uint8Array(32)).buffer)
  await kv.put(`sess:${token}`, username, { expirationTtl: 30 * 24 * 3600 })
  await kv.put(`tok:${username}`, token, { expirationTtl: 30 * 24 * 3600 })
  return token
}

export async function tokenUser(kv, token) {
  if (!token) return null
  return await kv.get(`sess:${token}`)
}

export async function dropToken(kv, username) {
  const t = await kv.get(`tok:${username}`)
  if (t) await kv.delete(`sess:${t}`)
  await kv.delete(`tok:${username}`)
}

// Bearer 头或 body.token 解析当前用户行
export async function currentUserRow(env, request, body = {}) {
  const auth = request.headers.get('Authorization') || ''
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : body.token
  const username = await tokenUser(env.UPSTASH_KV, token)
  if (!username) return null
  const row = await env.DB.prepare('SELECT * FROM users WHERE username = ?').bind(username).first()
  return row ? { row, token } : null
}

export const publicUser = row => ({
  uid: row.id,
  nickName: row.nickname,
  username: row.username,
  sex: row.sex,
  professional: row.professional,
  graduation: row.graduation,
  school: row.school,
  avatar: row.avatar,
  origin: row.origin
})
