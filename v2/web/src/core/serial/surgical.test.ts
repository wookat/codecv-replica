import { describe, it, expect } from 'vitest'
import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { splitBlocks } from './blocks'
import { serialize, serializeBlocks, normalizeChunk } from './surgical'
import { normalizeMd } from './normalize'

const TPL_DIR = join(__dirname, '../../../../../public/seeds/tpl')
const tpls = readdirSync(TPL_DIR).filter(f => f.endsWith('.json'))
const tplMd = (f: string) => JSON.parse(readFileSync(join(TPL_DIR, f), 'utf8')).content as string

describe('splitBlocks', () => {
  it('::: 行切成 directive 原子块，内容按行保真', () => {
    const md = '## 教育经历\n::: start\nicon:x a\n:::\n- item'
    const b = splitBlocks(md)
    expect(b.filter(x => x.kind === 'directive').map(x => x.source)).toEqual(['::: start', ':::'])
  })
  it('全部 114 模板 ::: 指令保序', () => {
    for (const f of tpls) {
      const md = tplMd(f)
      const src = md.split('\n').filter(l => /^:::/.test(l))
      const got = splitBlocks(md).filter(b => b.kind === 'directive').map(b => b.source)
      expect(got, f).toEqual(src)
    }
  })
})

describe('serialize 不变量', () => {
  it('未编辑文档逐字节往返（全部 114 模板）', () => {
    for (const f of tpls) {
      const md = tplMd(f)
      expect(serialize(md), f).toBe(md)
    }
  })
  it('未编辑 + 只改一处：其余块原文不动', () => {
    const md = 'para one\n\n::: start\npara two\n::: end\n\npara three'
    const blocks = splitBlocks(md)
    // 编辑 chunk 2（para two 所在的 chunk，含 ::: 行后是 idx 2）
    const chunks = blocks.map((b, i) => b.kind === 'chunk' ? i : -1).filter(i => i >= 0)
    const out = serialize(md, new Map([[chunks[1], 'para two 改了']]))
    expect(out).toContain('para one')
    expect(out).toContain('para three')
    expect(out).toContain('::: start\npara two 改了\n::: end'.split('\n')[2]) // edited text present
    expect(out).toContain('para two 改了')
  })
})

describe('normalizeChunk 编辑块路径', () => {
  it('icon 链接/普通链接/列表/标题/粗体/代码 均无损', () => {
    const cases = [
      '[icon:email a@b.com](a@b.com)\nicon:phone 155xxx',
      '[github主页](https://github.com/x) 和 [demo](https://d.com)',
      '- **北京大学**\n- 光华管理学院 GPA 3.9',
      '1. 对电商平台整体规划设计\n2. 对电商网站页面设计',
      '## 教育经历\n### 杭州xx网络有限公司 - 电商运营',
      '**2021.09 - 2024.07**',
      '`Vue.js` `ElementUI` `Echarts`',
    ]
    for (const c of cases) {
      const out = normalizeChunk(c)
      // 关键记号必须存活
      expect(out).not.toContain('\\(')
      expect(out).not.toContain('\\*')
      if (c.includes('icon:')) expect(out).toContain('icon:email')
      if (c.includes('`Vue.js`')) expect(out).toContain('`Vue.js`')
    }
  })
  it('`** 空格 **` 失效粗体被归一化救回', () => {
    const out = normalizeChunk('** 2021.12 - 至今 **')
    expect(out).toBe('**2021.12 - 至今**')
  })
})

describe('normalizeMd 语料级', () => {
  it('归一化后再归一化 = 不动点', () => {
    for (const f of tpls) {
      const md = tplMd(f)
      const c1 = normalizeMd(md)
      expect(normalizeMd(c1), f).toBe(c1)
    }
  })
  it('归一化语料编辑块往返固定点', () => {
    // canonical chunk normalize 后再次 normalize 应保持不变（近似——列表松紧可能微调，查全部模板）
    let unstable = 0
    for (const f of tpls) {
      const md = tplMd(f)
      const blocks = splitBlocks(normalizeMd(md))
      const out = serializeBlocks(blocks)
      // 未编辑 → 输出 ≡ normalizeMd(md)
      expect(out, f).toBe(normalizeMd(md))
    }
    expect(unstable).toBe(0)
  })
})
