// 生成 nitro 薄路由适配层：每个文件 import 原 functions/ handler + asPages 包装
import fs from 'node:fs'
import path from 'node:path'

const map = [
  ['api/admin/[...route].ts', 'api/admin/[[route]].js', 'onRequest'],
  ['api/ai/[...route].ts', 'api/ai/[[route]].js', 'onRequest'],
  ['api/comment/[...route].ts', 'api/comment/[[route]].js', 'onRequest'],
  ['api/comments/query.ts', 'api/comments/query.js', 'onRequest'],
  ['api/engagement/[...route].ts', 'api/engagement/[[route]].js', 'onRequest'],
  ['api/export/[...route].ts', 'api/export/[[route]].js', 'onRequest'],
  ['api/favorite/[...route].ts', 'api/favorite/[[route]].js', 'onRequest'],
  ['api/feedback/[...route].ts', 'api/feedback/[[route]].js', 'onRequest'],
  ['api/import/[...route].ts', 'api/import/[[route]].js', 'onRequest'],
  ['api/invite/[...route].ts', 'api/invite/[[route]].js', 'onRequest'],
  ['api/job/[...route].ts', 'api/job/[[route]].js', 'onRequest'],
  ['api/mianjing/[...route].ts', 'api/mianjing/[[route]].js', 'onRequest'],
  ['api/notification/[...route].ts', 'api/notification/[[route]].js', 'onRequest'],
  ['api/order/[...route].ts', 'api/order/[[route]].js', 'onRequest'],
  ['api/post/[...route].ts', 'api/post/[[route]].js', 'onRequest'],
  ['api/progress/[...route].ts', 'api/progress/[[route]].js', 'onRequest'],
  ['api/resume/[...route].ts', 'api/resume/[[route]].js', 'onRequest'],
  ['api/schools.ts', 'api/schools.js', 'onRequest'],
  ['api/share/[...route].ts', 'api/share/[[route]].js', 'onRequest'],
  ['api/template/hidden.ts', 'api/template/hidden.js', 'onRequest'],
  ['api/template/stats.ts', 'api/template/stats.js', 'onRequest'],
  ['api/translate.ts', 'api/translate.js', 'onRequest'],
  ['api/upload/[...route].get.ts', 'api/upload/[[route]].js', 'onRequestGet'],
  ['api/upload/[...route].post.ts', 'api/upload/[[route]].js', 'onRequestPost'],
  ['api/upload/[...route].options.ts', 'api/upload/[[route]].js', 'onRequestOptions'],
  ['routes/user/info.get.ts', 'user/[[route]].js', 'onRequest'],
  ['routes/user/[...route].post.ts', 'user/[[route]].js', 'onRequest'],
  ['routes/user/[...route].options.ts', 'user/[[route]].js', 'onRequest'],
  ['routes/export.post.ts', 'export.js', 'onRequestPost'],
  ['routes/export.options.ts', 'export.js', 'onRequestOptions'],
  ['routes/gitee.ts', 'gitee.js', 'onRequest'],
  ['routes/mcp.ts', 'mcp.js', 'onRequest'],
  ['routes/mcp/messages.ts', 'mcp/messages.js', 'onRequest']
]

const serverDir = new URL('./server/', import.meta.url).pathname
const functionsDir = new URL('../functions/', import.meta.url).pathname

for (const [nf, mod, handler] of map) {
  const out = path.join(serverDir, nf)
  fs.mkdirSync(path.dirname(out), { recursive: true })
  const rel = path
    .relative(path.dirname(out), functionsDir + mod)
    .replace(/\\/g, '/')
  const depth = nf.split('/').length - 1
  const utilRel = '../'.repeat(depth) + 'utils/pages'
  fs.writeFileSync(
    out,
    '// Pages Functions 移植：薄适配层，原文件零改动\n' +
      `import { ${handler} } from '${rel}'\n` +
      `import { asPages } from '${utilRel}'\n\n` +
      `export default asPages(${handler})\n`
  )
}
console.log('generated', map.length)
