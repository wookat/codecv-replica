import { convertResumeDOM, fontMark } from '@/lib/mth/render'
import { getAvatarConfig } from '@/templates/config'
import { getLocalStorage } from '@/common/localstorage'

export { fontMark }

export function convertDOM(DOMStr: string) {
  return convertResumeDOM(DOMStr)
}

// 证件照覆盖层：尺寸沿用 common.css 的 img[alt*=个人头像] 规则，
// src 绝对化以便服务端导出环境（无站点 base URL）也能加载图片
const AVATAR_RADIUS: Record<string, string> = {
  square: '0',
  'round-square': '10px',
  circle: '50%',
  banner: '999px'
}

export function avatarOverlayHTML(type: string) {
  const av = getAvatarConfig(type)
  if (!av) return ''
  const src = /^(https?:|data:|blob:)/.test(av.url)
    ? av.url
    : `${location.origin}${av.url.startsWith('/') ? '' : '/'}${av.url}`
  const radius = `border-radius:${AVATAR_RADIUS[av.type || 'square'] ?? '0'};`
  const width = av.width ? `width:${av.width}px;` : ''
  return `<img alt="个人头像" class="cv-avatar-overlay" src="${src}" style="position:absolute;top:${av.top}px;left:${av.left}px;z-index:3;${width}${radius}">`
}

// 校徽覆盖层：用户上传的校徽图 绝对定位在纸面（位置持久化于 localStorage）
export function badgeOverlayHTML(type: string) {
  const raw = getLocalStorage(`badge_config-${type}`) as string | null
  if (!raw) return ''
  try {
    const cfg = JSON.parse(raw) as {
      url: string
      top: number
      left: number
      width?: number
      shape?: string
    }
    const src = /^(https?:|data:|blob:)/.test(cfg.url)
      ? cfg.url
      : `${location.origin}${cfg.url.startsWith('/') ? '' : '/'}${cfg.url}`
    // 校徽形状（生产同款）：长条形(square)/圆形(circle)
    const radius =
      cfg.shape === 'circle' ? 'border-radius:50%;aspect-ratio:1/1;object-fit:cover;' : ''
    return `<img alt="校徽" class="cv-badge-overlay" src="${src}" style="position:absolute;top:${
      cfg.top
    }px;left:${cfg.left}px;width:${cfg.width || 56}px;z-index:3;${radius}">`
  } catch {
    return ''
  }
}

export function allOverlaysHTML(type: string) {
  return avatarOverlayHTML(type) + badgeOverlayHTML(type)
}

// 覆盖层配置变更后即时刷新：替换现存覆盖层 DOM 节点并重新分页
export function refreshOverlays(type: string) {
  const html = allOverlaysHTML(type)
  document.querySelectorAll('.cv-avatar-overlay,.cv-badge-overlay').forEach(el => el.remove())
  if (html) {
    document
      .querySelectorAll('.reference-dom,.re-render .jufe')
      .forEach(host => host.insertAdjacentHTML('beforeend', html))
  }
}
