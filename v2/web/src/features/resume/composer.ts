// 合成器：master selections → 简历 md（设计文档 §5.5，Phase 2 最简模型）
// 模板骨架保留 ::: headStart/mainStart 容器；各 section 下挂 variant.contentMd
import catalog from '../templates/catalog.json'

const SECTION_TITLE: Record<string, string> = {
  education: '教育背景', internship: '实习经历', project: '项目经历',
  award: '奖项荣誉', skill: '专业技能', selfeval: '自我评价', other: '其他',
}

export interface SelItem { itemId: string; variantId: string | null; ord: number; contentMd: string; section: string; title: string }

export function composeMd(opts: {
  title: string
  headLine?: string        // 头部信息块（姓名/联系方式 md，模板 headStart 内容）
  items: SelItem[]
}): string {
  const { title, headLine = '', items } = opts
  const sections = new Map<string, SelItem[]>()
  for (const it of [...items].sort((a, b) => a.ord - b.ord)) {
    const arr = sections.get(it.section) ?? []
    arr.push(it)
    sections.set(it.section, arr)
  }
  const parts: string[] = [`## ${title}`]
  if (headLine.trim()) {
    parts.push('::: start', headLine.trim(), '::: end')
  }
  for (const [sec, arr] of sections) {
    parts.push(`\n## ${SECTION_TITLE[sec] ?? sec}`)
    for (const it of arr) {
      // 每条目：::: start 标题 ::: 内容 ::: end 三段式（与模板例稿同构）
      const body = it.contentMd.trim()
      if (body.includes(':::')) {
        parts.push(body)              // variant 已自带容器骨架时原样使用
      } else {
        parts.push('::: start', `**${it.title}**`, ':::', body, '::: end')
      }
    }
  }
  return parts.join('\n')
}

export function skinHref(templateId: string): string {
  return `/css/style_${templateId.replace(/^cv-/, '')}.css`
}
export function templateMeta(id: string) {
  return (catalog as any)[id] ?? null
}
