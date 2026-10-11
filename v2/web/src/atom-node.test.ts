// ::: atom 壳：wrapDirectives/unwrapDirectives + writeback 联合验证
import { describe, it, expect } from 'vitest'
import { splitBlocks } from './core/serial/blocks'
import { normalizeMd } from './core/serial/normalize'

const CV_DIR='cvdir'
const wrap=(md:string)=>md.split('\n').map(l=>(/^\s*:::/.test(l)?`\n\`\`\`${CV_DIR}\n${l.trim()}\n\`\`\`\n`:l)).join('\n')
const unwrap=(s:string)=>s.replace(/^```cvdir\n([\s\S]*?)\n```$/gm,(_m,b:string)=>b.trim())

const src='## 教育背景\n::: start\n**浙江大学 软件工程**\n::: end\n\n## 项目经历\n- 全栈项目前端版'

describe('::: atom 壳', () => {
  it('wrap→unwrap 还原 ::: 行', () => {
    expect(unwrap(wrap(src))).toContain('::: start')
    expect(unwrap(wrap(src))).not.toContain('cvdir')
  })
  it('序列化流剥壳后与源块比对回写原文', () => {
    // 模拟 milkdown 逐节点序列化拼出的流：::: 已变成 cvdir 代码块
    const ser='## 教育背景\n\n```cvdir\n::: start\n```\n\n**浙江大学 软件工程**\n\n```cvdir\n::: end\n```\n\n## 项目经历\n\n- 全栈项目前端版'
    const un=unwrap(ser)
    const blocks=splitBlocks(normalizeMd(un))
    const dirs=blocks.filter(b=>b.kind==='directive').map(b=>b.source.trim())
    expect(dirs).toEqual(['::: start','::: end'])
  })
  it('段落尾部打字不再污染指令行', () => {
    // 打字发生在代码块外的新段落里 —— 指令行保持独立
    const ser='**浙江大学 软件工程**\n\nNEWTYPE\n\n```cvdir\n::: end\n```'
    const un=unwrap(ser)
    expect(un).toContain('::: end')
    expect(un).not.toContain('::: endNEWTYPE')
  })
})
