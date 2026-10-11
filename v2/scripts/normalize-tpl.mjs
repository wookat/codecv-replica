// 模板语料归一化：public/seeds/tpl/*.json → v2/web/public/seeds/tpl/*.json
// 原 prod 模板不动（v1 冻结）；v2 语料是归一化副本。
// 用法: node scripts/normalize-tpl.mjs
import { readdirSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { join } from 'node:path'
import { normalizeMd } from '../web/src/core/serial/normalize.ts'

const SRC = new URL('../../public/seeds/tpl/', import.meta.url).pathname
const DST = new URL('../web/public/seeds/tpl/', import.meta.url).pathname
mkdirSync(DST, { recursive: true })

let changed = 0
for (const f of readdirSync(SRC).filter(x => x.endsWith('.json'))) {
  const doc = JSON.parse(readFileSync(join(SRC, f), 'utf8'))
  const canon = normalizeMd(doc.content || '')
  if (canon !== doc.content) changed++
  writeFileSync(join(DST, f), JSON.stringify({ ...doc, content: canon }))
}
console.log(`归一化完成: ${changed} 套有改动 / ${readdirSync(DST).length} 套总数 → ${DST}`)
