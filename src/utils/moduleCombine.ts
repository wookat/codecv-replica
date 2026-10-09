import { markdownToHTML } from 'markdown-transform-html'
import { getAvatarConfig } from '@/templates/config'
import { getLocalStorage } from '@/common/localstorage'

// 简历模块拆分 将每个子模块内容进行整合
function moduleCombine(DOMStr: string) {
  const fragment = document.createElement('div')
  fragment.innerHTML = DOMStr
  const hasMainLayout = fragment.querySelector('.main-layout')
  const searchStart = hasMainLayout || fragment
  const nodes = Array.from(searchStart.childNodes) as HTMLElement[]
  let container = null,
    // eslint-disable-next-line prefer-const
    result = document.createElement('div')

  for (const node of nodes) {
    if (node.nodeType === Node.TEXT_NODE) continue
    if (node.tagName.toLocaleLowerCase() === 'h2') {
      if (container) {
        result.appendChild(container)
      }
      container = document.createElement('div')
      container.className = 'resume-module'
      container.appendChild(node)
    } else {
      container ? container.appendChild(node) : result.appendChild(node)
    }
  }
  // 最后的也添加
  container && result.appendChild(container)
  if (hasMainLayout) {
    searchStart.parentNode?.replaceChild(result, searchStart)
    result.className = 'main-layout'
    result = fragment
  }
  return result
}

// CodeCV 生产方言：!c[文本](#颜色)=前景色、!bg[文本](#颜色)=背景色
// v1 解析器会先按超链接产出 `!c<a href=#hex>文本</a>`，这里还原为带色 span
const FONT_MARK = /!(bg|c)<a href=(#[0-9a-fA-F]{3,8})>([\s\S]*?)<\/a>/g
export function fontMark(html: string) {
  return html.replace(FONT_MARK, (_, kind, color, text) =>
    kind === 'bg'
      ? `<span class="font-bg" style="background:${color}">${text}</span>`
      : `<span style="color:${color}">${text}</span>`
  )
}

export function convertDOM(DOMStr: string) {
  return moduleCombine(fontMark(markdownToHTML(DOMStr)))
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
