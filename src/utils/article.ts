import MarkdownIt from 'markdown-it'
import taskLists from 'markdown-it-task-lists'

const md: MarkdownIt = new MarkdownIt({ html: true, linkify: true, breaks: false }).use(taskLists)

// 与生产一致：h2/h3 生成锚点 id + 可点击锚链
md.core.ruler.push('mj-anchors', (state: any) => {
  let h = 0
  state.tokens.forEach((t: any) => {
    if (t.type === 'heading_open') {
      t.attrSet('id', `mj-h-${h++}`)
    }
  })
})

export function renderArticle(src: string): string {
  return md.render(src || '')
}

export interface TocItem {
  id: string
  text: string
  level: number
}

export function extractToc(src: string): TocItem[] {
  const tokens = md.parse(src || '', {})
  const toc: TocItem[] = []
  let h = 0
  tokens.forEach((t: any, i: number) => {
    if (t.type === 'heading_open' && (t.tag === 'h2' || t.tag === 'h3')) {
      const inline = tokens[i + 1]
      toc.push({ id: `mj-h-${h}`, text: inline?.content ?? '', level: +t.tag.slice(1) })
    }
    if (t.type === 'heading_open') h++
  })
  return toc
}

/** 公司 logo 颜色（与线上 logoColor 哈希一致：按 slug 取板） */
const LOGO_COLORS = [
  '#d97706',
  '#65a30d',
  '#2563eb',
  '#7c3aed',
  '#db2777',
  '#0891b2',
  '#dc2626',
  '#059669',
  '#ca8a04',
  '#9333ea'
]

export function logoColor(slug: string): string {
  let h = 0
  for (let i = 0; i < slug.length; i++) {
    h = (h << 5) - h + slug.charCodeAt(i)
    h = h & h
  }
  return LOGO_COLORS[Math.abs(h) % LOGO_COLORS.length]
}

/** tcb 资源地址 → 本地缓存路径（镜像目录结构到 public/ 同名目录） */
export function localAsset(url?: string): string {
  if (!url) return ''
  const i = url.indexOf('tcb.qcloud.la/')
  if (i >= 0) {
    const rel = url.slice(i + 'tcb.qcloud.la/'.length).split('?')[0]
    if (rel) return `/${rel}`
  }
  return url
}
