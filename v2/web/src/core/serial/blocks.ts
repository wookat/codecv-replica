// 文档块模型：markdown 文档 = 有序块序列
// - directive 块：以 `:::` 开头的皮肤布局指令行，原子保真，永不进 remark
// - chunk 块：::: 行之间的 markdown 内容区段
// 每个 chunk 带 editedText：编辑层写入用户改动；serialize 时
// 未编辑 chunk 回写 source 原文，编辑过的才走 remark 归一化。

export interface MdBlock {
  kind: 'directive' | 'chunk'
  /** 原始 md 源文本（该块的不变真身） */
  source: string
  /** 编辑层写入的当前文本；与 source 不同即视为已编辑 */
  editedText?: string
}

export function splitBlocks(md: string): MdBlock[] {
  const blocks: MdBlock[] = []
  let cur: string[] = []
  const flush = () => {
    if (cur.length) {
      blocks.push({ kind: 'chunk', source: cur.join('\n') })
      cur = []
    }
  }
  for (const line of md.split('\n')) {
    if (/^:::/.test(line)) {
      flush()
      blocks.push({ kind: 'directive', source: line })
    } else {
      cur.push(line)
    }
  }
  flush()
  return blocks
}
