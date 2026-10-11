import {
  columnSpec,
  isHeadLayoutStart,
  isMultColumn,
  isMultColumnEnd,
  isMultColumnStart
} from '../../utils/index'
import parseHeadLayout from './parseHeadLayout'
import { ITransformOptions, markdownToHTML } from './parseToHTML'

function specStyle(spec: { width?: number; align?: string }) {
  const parts: string[] = []
  if (spec.width != null) parts.push(`width:${spec.width}%`)
  if (spec.align) parts.push(`text-align:${spec.align}`)
  return parts.length ? ` style="${parts.join(';')}"` : ''
}

export default function parseLayout(
  templates: string[],
  i: number,
  templateLength: number,
  options: ITransformOptions
) {
  let resultStr = `<div class=flex-layout>`,
    tmpS = ''
  let pending = columnSpec(templates[i])
  const item = (spec: { width?: number; align?: string }) =>
    `<div class=flex-layout-item${specStyle(spec)}>${markdownToHTML(tmpS, {
      ...options,
      xss: false
    })}</div>`
  ++i
  while (i < templateLength && !isMultColumnEnd(templates[i])) {
    if (isMultColumnStart(templates[i])) {
      const { result, startIdx } = parseLayout(templates, i, templateLength, options)
      tmpS += result
      i = startIdx
    } else if (isHeadLayoutStart(templates[i])) {
      const { result, startIdx } = parseHeadLayout(templates, i, templateLength, options)
      tmpS += result
      i = startIdx
    } else if (isMultColumn(templates[i])) {
      resultStr += item(pending)
      tmpS = ''
      pending = columnSpec(templates[i])
    } else {
      tmpS += templates[i].trim() ? '\n' + templates[i] + '\n' : ''
    }
    i++
  }
  resultStr += item(pending)
  resultStr += `</div>`
  return { result: resultStr, startIdx: i }
}
