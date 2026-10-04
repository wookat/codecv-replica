import { markdownToHTML } from 'markdown-transform-html'
import { getAvatarConfig } from '@/templates/config'

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
function fontMark(html: string) {
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
export function avatarOverlayHTML(type: string) {
  const av = getAvatarConfig(type)
  if (!av) return ''
  const src = /^(https?:|data:|blob:)/.test(av.url)
    ? av.url
    : `${location.origin}${av.url.startsWith('/') ? '' : '/'}${av.url}`
  const radius = av.type === 'circle' ? 'border-radius:50%;' : ''
  return `<img alt="个人头像" class="cv-avatar-overlay" src="${src}" style="position:absolute;top:${av.top}px;left:${av.left}px;z-index:3;${radius}">`
}
