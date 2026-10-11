import { matchSuperLink } from '../../utils/index'

export function parseSuperLink(s: string) {
  let result = ''
  while (matchSuperLink.test(s)) {
    const altStartIdx = s.indexOf('[')
    const prefix = s.slice(0, altStartIdx)
    result += prefix
    s = s.slice(altStartIdx + 1)
    const altEndIdx = s.indexOf('](')
    const alt = s.slice(0, altEndIdx)
    s = s.slice(altEndIdx + 2)
    const linkEnd = s.indexOf(')')
    const link = s.slice(0, linkEnd)
    s = s.slice(linkEnd + 1)
    result += `<a href=${link}>${alt}</a>`
  }
  return result + s
}
