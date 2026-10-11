// 服务端简历 md 合成：与 web/src/features/resume/composer.ts 同构（保持同步！）
// selections → section 分组 → ::: start 标题 ::: 内容 ::: end 三段式
export const SECTION_TITLE: Record<string, string> = {
  education: '教育背景', internship: '实习经历', project: '项目经历',
  award: '奖项荣誉', skill: '专业技能', selfeval: '自我评价', other: '其他',
}

export function composeResumeMd(opts: {
  title: string
  headLine?: string
  items: { section: string; title: string; contentMd: string }[]
}): string {
  const { title, headLine = '', items } = opts
  const sections = new Map<string, typeof items>()
  for (const it of items) {
    const arr = sections.get(it.section) ?? []
    arr.push(it)
    sections.set(it.section, arr)
  }
  const parts: string[] = [`## ${title}`]
  if (headLine.trim()) parts.push('::: start', headLine.trim(), '::: end')
  for (const [sec, arr] of sections) {
    parts.push(`\n## ${SECTION_TITLE[sec] ?? sec}`)
    for (const it of arr) {
      const body = it.contentMd.trim()
      if (body.includes(':::')) parts.push(body)
      else parts.push('::: start', `**${it.title}**`, ':::', body, '::: end')
    }
  }
  return parts.join('\n')
}
