// 归一化渲染验收：mth(orig) vs mth(canon) 逐套比对
// 分类: identical（渲染一致）/ improved（修复了原就错误的渲染）/ regression（零容忍）
// 依赖: /tmp/mth-bundle.mjs（esbuild 打包的 mth 引擎）、/tmp/v2-norm.mjs
// 用法: node scripts/verify-render.mjs [单个文件名]
import { markdownToHTML } from '/tmp/mth-bundle.mjs'
import { normalizeMd } from '/tmp/v2-norm.mjs'
import { readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

const DIR = '/home/ubuntu/repos/codecv-replica/public/seeds/tpl'
const only = process.argv[2]
const files = readdirSync(DIR).filter(f => f.endsWith('.json') && (!only || f === only))
const norm = h => String(h).replace(/\s+/g, '').replace(/&nbsp;/g, '')
// 渲染改善的判定信号：orig HTML 里出现「方言脏写法的字面残留」
const signals = [
  /&lt;https?:\/\//,            // <url> 渲染成字面尖括号
  /<p>\*\s/,                    // `* ` 渲染成字面星号段
  /\\\*\\\*|\<i\>\\\*\<\/i\>/,  // ** 空格 ** 被转义的字面残迹
]
const report = { identical: [], improved: [], regression: [] }
for (const f of files) {
  const md = JSON.parse(readFileSync(join(DIR, f), 'utf8')).content || ''
  const canon = normalizeMd(md)
  const h0 = markdownToHTML(md), h2 = markdownToHTML(canon)
  if (norm(h0) === norm(h2)) report.identical.push(f)
  else if (signals.some(s => s.test(h0))) report.improved.push(f)
  else report.regression.push(f)
}
console.log(`identical=${report.identical.length} improved=${report.improved.length} regression=${report.regression.length}`)
if (report.improved.length) console.log('improved:', report.improved.join(', '))
if (report.regression.length) {
  console.log('REGRESSION:', report.regression.join(', '))
  writeFileSync('/tmp/render-regression.txt', report.regression.join('\n'))
}
