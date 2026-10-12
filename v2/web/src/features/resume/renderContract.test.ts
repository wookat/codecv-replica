// @vitest-environment jsdom
import { describe, expect, it } from 'vitest'
import { readFileSync, existsSync } from 'node:fs'
import { resolve } from 'node:path'
import { convertResumeDOM, fontMark } from '../../../../../src/lib/mth/render'
import { markdownToHTML } from '../../../../../src/lib/mth'
import { paperStyle, type TemplateSeed } from './renderContract'
import { skinHref } from './composer'
import catalog from '../templates/catalog.json'

const publicDir = resolve(process.cwd(), '../public')
const readSeed = (id: string): TemplateSeed =>
  JSON.parse(readFileSync(resolve(publicDir, `seeds/tpl/${id}.json`), 'utf8'))

describe('all 114 templates use the replica rendering contract', () => {
  it('keeps the full catalog', () => expect(Object.keys(catalog)).toHaveLength(114))
  for (const id of Object.keys(catalog)) {
    it(id, () => {
      const seed = readSeed(id)
      expect(existsSync(resolve(publicDir, skinHref(seed.slug || id).slice(1)))).toBe(true)
      const original = document.createElement('div')
      original.innerHTML = markdownToHTML(seed.content || '')
      const html = convertResumeDOM(seed.content || '')
      expect(html.querySelectorAll('h2')).toHaveLength(original.querySelectorAll('h2').length)
      const source = original.querySelector('.main-layout') || original
      const sectionCount = Array.from(source.children).filter(h => h.tagName === 'H2').length
      const target = html.querySelector('.main-layout') || html
      expect(target.querySelectorAll(':scope > .resume-module')).toHaveLength(sectionCount)
      expect(html.querySelectorAll('.head-layout')).toHaveLength(original.querySelectorAll('.head-layout').length)
      expect(html.querySelectorAll('.main-layout')).toHaveLength(original.querySelectorAll('.main-layout').length)
      expect(html.querySelectorAll('.flex-layout')).toHaveLength(original.querySelectorAll('.flex-layout').length)
      expect(paperStyle(seed)['--markdown-primary-color']).toBe(seed.primaryColor || '#000')
      expect(paperStyle(seed)['--markdown-primary-bg-color']).toBe(seed.primaryBgColor || '#333')
      expect(paperStyle(seed)['line-height']).toBe(`${seed.lineHeight || 25}px`)
    })
  }

  it('restores foreground marks and pills', () => {
    const html = convertResumeDOM('## !bg[教育背景](#ffdc63)\n!c[重点](#aabbcc)')
    expect(html.querySelector('.font-bg')?.textContent).toBe('教育背景')
    expect(html.querySelector('p span')?.getAttribute('style')).toBe('color:#aabbcc')
    expect(fontMark('ordinary')).toBe('ordinary')
  })

  it('does not place sections outside the main layout', () => {
    const html = convertResumeDOM('::: headStart\n# 姓名\n::: headEnd\n::: mainStart\n## 教育\n内容\n## 项目\n内容\n::: mainEnd')
    expect(html.querySelectorAll('.main-layout > .resume-module')).toHaveLength(2)
    expect(html.querySelector('.head-layout .resume-module')).toBeNull()
  })

  it('applies user overrides without losing foreground or default font', () => {
    const style = paperStyle(readSeed('14heading'), { color: '#0000ff', lineHeight: 1.4, fontSize: 16 })
    expect(style['--markdown-primary-bg-color']).toBe('#0000ff')
    expect(style['--markdown-primary-color']).toBe('#363434')
    expect(style['line-height']).toBe('1.4')
    expect(style['font-size']).toBe('16px')
    expect(style['font-family']).toContain('Noto Sans SC')
  })
})
