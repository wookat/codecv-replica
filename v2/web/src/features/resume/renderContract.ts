import { convertResumeDOM } from '../../../../../src/lib/mth/render'

export type PaperOptions = {
  zoom?: number
  fontSize?: number
  lineHeight?: number
  color?: string
  showPages?: boolean
  fontFamily?: string
}

export type TemplateSeed = {
  slug?: string
  content?: string
  primaryColor?: string
  primaryBgColor?: string
  font?: string
  lineHeight?: number
  avatar?: { top: number; left: number; type?: string; url?: string; width?: number } | null
}

export const PAPER_RESET = `
:host{display:block;color:#000;font-family:'Noto Sans SC',sans-serif;font-size:16px;line-height:normal}
*{margin:0;padding:0;box-sizing:border-box}
.markdown-transform-html{--A4_width:794px;--A4_height:1123px;--icon_height:1.3rem;--super-link:#4572e3;min-height:1123px}
`

export function paperStyle(seed: TemplateSeed, opts: PaperOptions = {}): Record<string, string> {
  return {
    '--markdown-primary-color': seed.primaryColor || '#000',
    '--markdown-primary-bg-color': opts.color || seed.primaryBgColor || '#333',
    'font-family': opts.fontFamily || `"${seed.font || 'Noto Serif SC'}", 'Noto Sans SC', serif`,
    ...(opts.fontSize ? { 'font-size': `${opts.fontSize}px` } : {}),
    'line-height': opts.lineHeight ? String(opts.lineHeight) : `${seed.lineHeight || 25}px`,
  }
}

export function applyPaperStyle(paper: HTMLElement, seed: TemplateSeed, opts: PaperOptions = {}) {
  paper.removeAttribute('style')
  for (const [name, value] of Object.entries(paperStyle(seed, opts))) paper.style.setProperty(name, value)
}

export const FONT_STYLESHEETS = ['/fonts/resume-fonts.css', '/fonts/iconfont.css']

export function createResumePaper(markdown: string, seed: TemplateSeed = {}, opts: PaperOptions = {}, photo = '', owner: Document = document): HTMLDivElement {
  const paper = owner.createElement('div')
  paper.className = 'markdown-transform-html jufe'
  paper.innerHTML = convertResumeDOM(markdown, owner).innerHTML
  applyPaperStyle(paper, seed, opts)
  if (seed.avatar && (photo || seed.avatar.url)) {
    const avatar = owner.createElement('img')
    avatar.alt = '个人头像'
    avatar.src = photo || seed.avatar.url || ''
    const radii: Record<string, string> = { circle: '50%', square: '0', 'round-square': '10px', banner: '999px' }
    avatar.style.cssText = `position:absolute;top:${seed.avatar.top}px;left:${seed.avatar.left}px;z-index:3;border-radius:${radii[seed.avatar.type || 'square'] || '0'}`
    if (seed.avatar.width) avatar.style.width = `${seed.avatar.width}px`
    paper.appendChild(avatar)
  }
  return paper
}
