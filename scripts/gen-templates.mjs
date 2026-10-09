#!/usr/bin/env node
// 从 scripts/seeds/codecv/{index.json,raw/*.json} + src/lib/codecv-src/skins/<type>.css.txt
// 生成 OSS 约定的 src/templates/modules/<type>/{index.ts,style.scss}，共 114 套。
// index.ts 对应 SubModule：{name,font,lineHeight,content,primaryColor,primaryBackground,img,hot}
// style.scss 为该 type 的官方皮肤（内含 @import "../../common.css"，解析到 src/templates/common.css）
// 与主仓 build-codecv-templates.mjs 同一口径的本地化：
//   - tcb CDN 图片 → /codecv-assets/（已 vendor 到 public/codecv-assets）
//   - 全文邮箱 → <slug>@example.com（占位脱敏）
//   - cover 封面图 → /covers/<slug>.webp（由 fetch-covers.mjs 下载）
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const SEED = resolve(root, 'scripts/seeds/codecv')
const SKINS = resolve(root, 'src/lib/codecv-src/skins')
const OUT = resolve(root, 'src/templates/modules')

const index = JSON.parse(readFileSync(resolve(SEED, 'index.json'), 'utf8'))
// 分类页卡片展示的生产 createTime（YYYY-MM-DD）
const CTIME_PATH = '/home/ubuntu/codecv-replica-data/seeds/template-ctime.json'
const ctime = existsSync(CTIME_PATH) ? JSON.parse(readFileSync(CTIME_PATH, 'utf8')) : {}
// 生产卡片展示名（基准名，不带“简历”后缀；从页面 HTML 反解）
const NAMES_PATH = '/home/ubuntu/codecv-replica-data/seeds/template-names.json'
const names = existsSync(NAMES_PATH) ? JSON.parse(readFileSync(NAMES_PATH, 'utf8')) : {}
const EMAIL_RE = /[\w.+-]+@[\w-]+(?:\.[\w-]+)+/g

const localize = (md, slug) =>
  md
    .replace(
      /https:\/\/636f-codecv-8gf1cv0db1056941-1300408620\.tcb\.qcloud\.la\/images\//g,
      '/codecv-assets/'
    )
    .replace(EMAIL_RE, `${slug}@example.com`)
    .replace(/[\u200B\uFEFF]/g, '')

let done = 0
const typeOrder = []
for (const entry of index) {
  const slug = entry.slug
  const raw = JSON.parse(readFileSync(resolve(SEED, 'raw', `${slug}.json`), 'utf8'))
  const type = raw.type
  if (!type) throw new Error(`${slug} 缺 type`)
  typeOrder.push(type)
  const skinPath = resolve(SKINS, `${type}.css.txt`)
  if (!existsSync(skinPath)) throw new Error(`缺皮肤：${type}`)

  const dir = resolve(OUT, type)
  rmSync(dir, { recursive: true, force: true })
  mkdirSync(dir, { recursive: true })

  const mod = {
    name: names[type] || entry.name,
    font: raw.font || '',
    lineHeight: Number(raw.lineHeight || 25),
    primaryColor: raw.primaryColor,
    primaryBackground: raw.primaryBgColor,
    img: `/covers/${slug}.webp`,
    hot: Number(raw.hot || 0),
    // OSS config.ts 会从目录名回填 type；此处保留扩展字段供模板详情/头像叠层用
    slug,
    description: raw.description || '',
    // 生产详情页“适用方向”用抓取的全量标签（含学校/关键词），index.json 的检索标签兜底
    tags: Array.isArray(raw.tags) && raw.tags.length ? raw.tags : entry.tags,
    level: entry.level,
    date: (() => {
      const ms = ctime[type] || entry.updateTime
      return ms ? new Date(ms).toISOString().slice(0, 10) : undefined
    })(),
    avatar: raw.avatar
      ? {
          url: `/codecv-assets/${String(raw.avatar.url).split('/').pop()}`,
          top: Number(raw.avatar.top),
          left: Number(raw.avatar.left),
          type: raw.avatar.type
        }
      : undefined
  }
  writeFileSync(
    resolve(dir, 'index.ts'),
    `// 由 scripts/gen-templates.mjs 生成——勿手改（源：scripts/seeds/codecv/raw/${slug}.json）\nexport default ${JSON.stringify(
      mod,
      null,
      2
    ).replace(/"([^"\\]+)":/g, '$1:')}\n`
  )
  // 正文 markdown 独立成 content.ts——config.ts 懒加载，不进首屏 meta bundle
  // prettier 引号口径：比较串内 ' 与 " 数量，选少转义的引号（平手取单引号）
  const mdStr = localize(raw.content.trim(), slug)
  const sq = (mdStr.match(/'/g) || []).length
  const dq = (mdStr.match(/"/g) || []).length
  const mdEmit =
    sq <= dq
      ? `'${JSON.stringify(mdStr).slice(1, -1).replace(/\\"/g, '"').replace(/'/g, "\\'")}'`
      : JSON.stringify(mdStr)
  writeFileSync(
    resolve(dir, 'content.ts'),
    `// 由 scripts/gen-templates.mjs 生成——勿手改（源：scripts/seeds/codecv/raw/${slug}.json）\nexport default ${mdEmit}\n`
  )
  writeFileSync(resolve(dir, 'style.scss'), readFileSync(skinPath, 'utf8'))
  done++
}
// 生产「综合排序」= index.json 数组序；生成静态顺序表供 config.ts 排序
writeFileSync(
  resolve(root, 'src/templates/order.ts'),
  `// 由 scripts/gen-templates.mjs 生成——勿手改（生产模板中心综合排序序）\nexport const TYPE_ORDER: string[] = [\n${typeOrder
    .map(t => `  '${t}'`)
    .join(',\n')}\n]\n`
)
console.log(`生成 ${done} 套模板模块 → src/templates/modules/<type>/`)
