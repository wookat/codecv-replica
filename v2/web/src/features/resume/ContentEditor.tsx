// 内容模式编辑器：Milkdown(ProseMirror) 所见即所得视图
// 回写不用引擎整文序列化——基准块按 remark mdast 顶层子节点切源（与 PM children 1:1 对齐），
// 逐节点序列化与源块比对，未变化块原样回写，守住 surgical 不变量
import { useEffect, useRef } from 'react'
import { Editor, rootCtx, defaultValueCtx, serializerCtx } from '@milkdown/kit/core'
import { commonmark } from '@milkdown/kit/preset/commonmark'
import { gfm } from '@milkdown/kit/preset/gfm'
import { history } from '@milkdown/kit/plugin/history'
import { listener, listenerCtx } from '@milkdown/kit/plugin/listener'
import type { Node as PMNode } from '@milkdown/kit/prose/model'
import '@milkdown/kit/prose/view/style/prosemirror.css'
import { splitBlocks } from '../../core/serial/blocks'
import { normalizeMd } from '../../core/serial/normalize'

const norm = (s: string) => s.replace(/\s+/g, ' ').trim()

// ::: 指令行的原子壳：入编辑器前包成 ```cvdir 围栏（PM 里是独立 code 节点，不能被段落吞并），
// 序列化后剥回 ::: 行。根治「打字污染指令行/指令被并进相邻段落」。
const CV_DIR = 'cvdir'
const wrapDirectives = (md: string) =>
  md.split('\n').map(l => (/^\s*:::/.test(l) ? `\n\`\`\`${CV_DIR}\n${l.trim()}\n\`\`\`\n` : l)).join('\n')
const unwrapDirectives = (ser: string) =>
  ser.replace(/^```cvdir\n([\s\S]*?)\n```$/gm, (_m, body: string) => body.trim())

// 外科回写：PM doc → 逐节点序列化 → normalizeMd → 按 ::: 切块与源块顺序比对
// 内容相等的块回写源原文（surgical 不变量）；不等的（真编辑过）保留序列化结果。
// 不依赖索引对齐——插入/删除/合并节点都不会漂。
function writeback(source: string, serializeAll: () => string): string {
  const ser = normalizeMd(unwrapDirectives(serializeAll()))
  const serBlocks = splitBlocks(ser)
  const srcBlocks = splitBlocks(source)
  const out: string[] = []
  let si = 0
  for (const sb of serBlocks) {
    if (sb.kind === 'directive') { out.push(sb.source); continue }
    let hit = -1
    for (let j = si; j < srcBlocks.length; j++) {
      if (srcBlocks[j].kind === 'chunk' && norm(normalizeMd(srcBlocks[j].source)) === norm(sb.source)) { hit = j; break }
    }
    if (hit >= 0) { out.push(srcBlocks[hit].source); si = hit + 1 }
    else out.push(sb.source)
  }
  return out.join('\n')
}

export default function ContentEditor({ md, onMd }: { md: string; onMd: (md: string) => void }) {
  const host = useRef<HTMLDivElement>(null)
  const lastOut = useRef('')
  const sourceRef = useRef('')
  const editorRef = useRef<Editor | null>(null)

  useEffect(() => {
    if (md === lastOut.current) return // 自己写出的 md 回流，不重建
    sourceRef.current = md
    let destroyed = false
    Editor.make()
      .config(ctx => {
        ctx.set(rootCtx, host.current!)
        ctx.set(defaultValueCtx, wrapDirectives(md))
        ctx.get(listenerCtx).updated((ctx2, doc) => {
          if (destroyed) return
          const schema = doc.type.schema
          const ser = (n: PMNode) =>
            ctx2.get(serializerCtx)(schema.topNodeType.create(null, [n]))
          const out = writeback(sourceRef.current, () => doc.children.map(ser).join('\n\n'))
          // 本轮输出成为下一轮的比对基准
          sourceRef.current = out
          lastOut.current = out
          onMd(out)
        })
      })
      .use(commonmark).use(gfm).use(history).use(listener)
      .create()
      .then(ed => { if (destroyed) ed.destroy(); else editorRef.current = ed })
    return () => { destroyed = true; editorRef.current?.destroy(); editorRef.current = null }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [md])

  return <div ref={host} className="content-editor h-full overflow-auto p-3 text-sm [&_.ProseMirror]:outline-none" />
}
