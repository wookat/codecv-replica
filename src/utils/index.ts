import { ElLoading } from 'element-plus'
import 'element-plus/es/components/loading/style/css'

export const wOpen = window.open

// 模板皮肤 css chunk 的 URL 映射：vite 构建后每套皮肤的 <link> href 带 hash，
// 通过动态 import 前后对比 <link> 集合来捕获，导出 PDF 时用确定性的皮肤地址
export const skinLinkMap: Record<string, string> = {}

export async function importCSS(name: string) {
  name = name.split('~')[0] // 实例键 → 模板皮肤目录
  const before = new Set(Array.from(document.querySelectorAll('link')).map(l => l.href))
  const res = await import(`../templates/modules/${name}/style.scss`)
  const added = Array.from(document.querySelectorAll('link')).find(l => !before.has(l.href))
  if (added) skinLinkMap[name] = added.href
  return res.default
}

// 在只读渲染页（cv/share/export）应用模板主题变量：主色/背景色/字体，
// 与编辑器 tabbar 的注入口径一致；用户在编辑器里自定义过的颜色优先
export async function applyTemplateTheme(type: string) {
  const { getPrimaryBGColor, getPrimaryColor, getFontFamily } = await import('../templates/config')
  const bg =
      localStorage.getItem(`custom-markdown-primary-bg-color-${type}`) || getPrimaryBGColor(type),
    color = localStorage.getItem(`custom-markdown-primary-color-${type}`) || getPrimaryColor(type),
    font = getFontFamily(type)
  let style = query('replica-template-theme')
  if (!style) {
    style = createStyle()
    style.setAttribute('replica-template-theme', 'true')
    document.head.appendChild(style)
  }
  let css = `:root { --markdown-primary-bg-color: ${bg}; --markdown-primary-color: ${color}; }`
  if (font)
    css += `.jufe * { font-family: ${font}, 'Noto Sans SC', 'Noto Serif SC', 'Nunito', sans-serif, serif; }`
  style.textContent = css
}

export function download(url: string, fileName: string) {
  const a = document.createElement('a')
  a.download = fileName
  a.href = url
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
}

export function downloadOfBuffer(buffer: Iterable<number>, fileName: string, type: string) {
  const blob = new Blob([new Uint8Array(buffer)], { type })
  const url = URL.createObjectURL(blob)
  download(url, fileName)
  URL.revokeObjectURL(url)
}

export function createText(text: string) {
  return document.createTextNode(text)
}

export function queryDOM(uni: string) {
  return document.querySelector(uni)
}

export function createStyle() {
  return document.createElement('style')
}

export function createDIV() {
  return document.createElement('div')
}

export function query(attr: string) {
  // attr 可能含 type~id 的 ~，属性选择器需 CSS.escape 转义
  return document.head.querySelector(`style[${CSS.escape(attr)}]`)
}

export function removeHeadStyle(attr: string) {
  query(attr)?.remove()
}

export function useLoading() {
  let loading: any = null
  function showLoading(text: string) {
    loading = ElLoading.service({
      lock: true,
      text,
      background: 'rgba(0, 0, 0, 0.7)'
    })
  }
  function closeLoading() {
    loading && loading.close()
  }
  return {
    showLoading,
    closeLoading
  }
}

export function scrollTo(targetTop = 0) {
  const documentBody: HTMLElement = document.documentElement || document.body
  // 计算gap
  let GAP = Math.abs(documentBody.scrollTop - targetTop) / 20,
    currentScrollTop = 0,
    preScrollTop = -1

  const _GAP = GAP

  function scrollHelper() {
    currentScrollTop = documentBody.scrollTop
    // 距离目标还有多远
    const currentDistance = currentScrollTop - targetTop
    // 1. 超过了最大最小值
    // 2. 刚好走完了
    if (preScrollTop == currentScrollTop || currentDistance == 0) {
      return
    }
    preScrollTop = currentScrollTop

    window.requestAnimationFrame(function () {
      GAP = currentDistance > 0 ? _GAP : -_GAP
      currentScrollTop -= GAP
      // 如果距离比较小那么直接定位即可
      if (Math.abs(currentDistance) < _GAP) {
        documentBody.scrollTop = targetTop
        return
      }
      documentBody.scrollTop = currentScrollTop
      Math.abs(currentDistance) > 0 && scrollHelper()
    })
  }
  scrollHelper()
}

export function calcOffsetTop(dom: HTMLElement) {
  let height = dom?.offsetTop,
    parent = dom?.offsetParent as HTMLElement
  while (parent !== null) {
    height += parent.offsetTop
    parent = parent.offsetParent as HTMLElement
  }
  return height
}

export function convert(target: string) {
  switch (target) {
    case 'h1':
      return '一级标题'
    case 'h2':
      return '二级标题'
    case 'h3':
      return '三级标题'
    case 'h4':
      return '四级标题'
    case 'h5':
      return '五级标题'
    case 'h6':
      return '六级标题'
    case 'strong':
      return '强调/加粗'
    case 'a':
      return '链接'
    case 'p':
      return '普通文本'
    case 'li':
      return '列表项'
    case 'ul':
      return '无序列表'
    case 'ol':
      return '有序列表'
    case 'resume-module':
      return '整个子模块'
    case 'single-code':
      return '代码框'
    case 'head-layout':
      return '个人信息栏'
    case 'main-layout':
      return '主体内容'
    case 'flex-layout':
      return '多列布局'
    case 'flex-layout-item':
      return '多列布局项'
    case 'iconfont':
      return '字体图标'
    case 'img':
      return '证件照/图片'
    case 'table':
      return '表格'
    case 'thead':
      return '表头'
    case 'tr':
      return '表行'
    case 'th':
      return '表头单元格'
    case 'tbody':
      return '表格主体'
    case 'td':
      return '表格数据单元格'
  }
  return target
}

export function getTagColor(index: number): any {
  const colors = ['danger', 'warning', 'success', 'info'],
    len = colors.length
  return colors[index % len]
}

export function isDev() {
  return import.meta.env.MODE === 'development'
}
