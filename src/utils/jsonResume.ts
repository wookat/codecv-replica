// JSON Resume (https://jsonresume.org) -> CodeCV markdown 方言转换
interface JrWork {
  name?: string
  position?: string
  startDate?: string
  endDate?: string
  summary?: string
  highlights?: string[]
}
interface JrEdu {
  institution?: string
  area?: string
  studyType?: string
  startDate?: string
  endDate?: string
  score?: string
}
interface JrSkill {
  name?: string
  level?: string
  keywords?: string[]
}
interface JrProject {
  name?: string
  description?: string
  highlights?: string[]
  url?: string
}
interface JrAward {
  title?: string
  date?: string
  awarder?: string
}
interface JsonResume {
  basics?: {
    name?: string
    label?: string
    email?: string
    phone?: string
    url?: string
    location?: { city?: string }
    summary?: string
  }
  work?: JrWork[]
  education?: JrEdu[]
  skills?: JrSkill[]
  projects?: JrProject[]
  awards?: JrAward[]
  volunteer?: JrWork[]
}

const yr = (d?: string) => (d ? d.slice(0, 7).replace('-', '.') : '')
const span = (s?: string, e?: string) => (s ? `${yr(s)}-${e ? yr(e) : '至今'}` : '')

export function isJsonResume(text: string): boolean {
  try {
    const j = JSON.parse(text)
    return !!j && typeof j === 'object' && (!!j.basics || !!j.work || !!j.education)
  } catch {
    return false
  }
}

export function jsonResumeToMd(j: JsonResume): string {
  const b = j.basics ?? {}
  const out: string[] = []
  out.push(`# ${b.name || '未命名简历'}`)
  const contact = [b.phone, b.email, b.location?.city, b.url].filter(Boolean).join(' ｜ ')
  if (contact) out.push(contact)
  out.push('')
  if (b.label || b.summary) {
    out.push('## 求职意向')
    out.push(b.label ? `**意向岗位**：${b.label}` : '')
    if (b.summary) out.push(b.summary)
    out.push('')
  }
  if (j.education?.length) {
    out.push('## 教育经历')
    for (const e of j.education) {
      out.push(
        `**${e.institution || ''}** ｜ ${[e.studyType, e.area]
          .filter(Boolean)
          .join(' · ')} ｜ ${span(e.startDate, e.endDate)}`
      )
      if (e.score) out.push(`- GPA/成绩：${e.score}`)
      out.push('')
    }
  }
  if (j.work?.length) {
    out.push('## 工作经历')
    for (const w of j.work) {
      out.push(`**${w.name || ''}** ｜ ${w.position || ''} ｜ ${span(w.startDate, w.endDate)}`)
      if (w.summary) out.push(w.summary)
      for (const h of w.highlights ?? []) out.push(`- ${h}`)
      out.push('')
    }
  }
  if (j.volunteer?.length) {
    out.push('## 志愿经历')
    for (const w of j.volunteer) {
      out.push(`**${w.name || ''}** ｜ ${w.position || ''} ｜ ${span(w.startDate, w.endDate)}`)
      if (w.summary) out.push(w.summary)
      out.push('')
    }
  }
  if (j.projects?.length) {
    out.push('## 项目经历')
    for (const p of j.projects) {
      out.push(`**${p.name || ''}**${p.url ? ` ｜ ${p.url}` : ''}`)
      if (p.description) out.push(p.description)
      for (const h of p.highlights ?? []) out.push(`- ${h}`)
      out.push('')
    }
  }
  if (j.skills?.length) {
    out.push('## 技能特长')
    for (const s of j.skills) {
      const kw = (s.keywords ?? []).join('、')
      out.push(`- **${s.name || ''}**${s.level ? `（${s.level}）` : ''}${kw ? `：${kw}` : ''}`)
    }
    out.push('')
  }
  if (j.awards?.length) {
    out.push('## 荣誉奖项')
    for (const a of j.awards)
      out.push(
        `- ${a.title || ''}${a.awarder ? `（${a.awarder}）` : ''}${a.date ? ` ${yr(a.date)}` : ''}`
      )
    out.push('')
  }
  return (
    out
      .join('\n')
      .replace(/\n{3,}/g, '\n\n')
      .trim() + '\n'
  )
}
