// surgical-serializer：md 文档的外科手术式序列化器
// 规则（设计文档 §5.1）：
//   1. ::: 指令行 → 原子保序回写
//   2. 未编辑 chunk → 回写 source 原文（渲染逐字节一致）
//   3. 编辑过的 chunk → 先方言归一化，再 remark 归一化
// 不变量：全文未编辑时 serialize(md) ≡ md

import { unified } from 'unified'
import remarkParse from 'remark-parse'
import remarkStringify from 'remark-stringify'
import { splitBlocks, type MdBlock } from './blocks'
import { normalizeMd } from './normalize'

const proc = unified()
  .use(remarkParse)
  .use(remarkStringify, {
    bullet: '-',
    emphasis: '*',
    fences: true,
    listItemIndent: 'one',
    tightDefinitions: true,
    resourceLink: true,
  })

export function normalizeChunk(chunk: string): string {
  const out = String(proc.processSync(normalizeMd(chunk)))
  return out.replace(/\n+$/, '')
}

export function serializeBlocks(blocks: MdBlock[]): string {
  const parts: string[] = []
  for (const b of blocks) {
    if (b.kind === 'directive') {
      parts.push(b.source)
      continue
    }
    if (b.editedText === undefined || b.editedText === b.source) {
      // 未编辑或内容未变 → 原文回写（含纯空白块——它们是原布局的一部分）
      parts.push(b.source)
    } else {
      const norm = normalizeChunk(b.editedText)
      if (norm) parts.push(norm)
    }
  }
  return parts.join('\n')
}

/** 文档级序列化：编辑器把 blocks 的 editedText 写好后调此函数 */
export function serialize(md: string, edited?: Map<number, string>): string {
  const blocks = splitBlocks(md)
  if (edited) {
    blocks.forEach((b, i) => {
      const t = edited.get(i)
      if (t !== undefined && b.kind === 'chunk') b.editedText = t
    })
  }
  return serializeBlocks(blocks)
}
