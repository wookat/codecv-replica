import FontFaceObserver from 'fontfaceobserver'

// prod useCustomFont 同款：等 webfont 实际可用（swap 兜底字体期间测量会偏）
const cache = new Map<string, Promise<boolean>>()

export function loadFont(family: string, timeout = 5000): Promise<boolean> {
  const key = family.trim().replace(/^['"]|['"]$/g, '')
  if (!key) return Promise.resolve(false)
  let p = cache.get(key)
  if (!p) {
    p = new FontFaceObserver(key)
      .load(null, timeout)
      .then(() => true)
      .catch(() => false)
    cache.set(key, p)
  }
  return p
}
