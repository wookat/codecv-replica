// POST /export {content,style,link,name,type:0|1} —— 服务端渲染 PDF/截图
// 经 Cloudflare Browser Rendering REST（需 Pages 环境变量 CF_ACCOUNT_ID + BR_API_TOKEN）；
// 未配置时 503（与本地 dev.mjs 缺浏览器行为一致）。
import { json } from './_lib.js'

export const onRequestOptions = context => json(context.request, {})

// フォントを本站 origin から self-fetch し base64 data-URI 化して <style> に内包する。
// html パラメータ経路では外部フォント取得が print に間に合わない（WenQuanYi フォールバック観測）
// ため、フェッチ不要の inline 化で確実に適用させる。
// BR は ~5MB 超のインライン <style> を黙殺する実測があるため、テンプレが参照しない
// ファミリー（Serif 等）は送らない：ほぼ全テンプレは Sans のみで ~3.3MB に収まる。
const fontCssCache = new Map()
async function fontCss(origin, families) {
  const key = families.join(',')
  if (fontCssCache.has(key)) return fontCssCache.get(key)
  // 構築時に data-URI 焼き込み済みの export-fonts.css（実行時 btoa を排除）
  const css = await (await fetch(`${origin}/fonts/export-fonts.css`)).text()
  // @font-face ブロックを family 名で選別
  const blocks = css.match(/@font-face\s*{[^}]+}|(?!@font-face)[^@]+/g) || []
  const kept = blocks.filter(b => {
    const m = b.match(/font-family:\s*'([^']+)'/)
    if (!m) return true // クラス規則等非 @font-face は全て残す
    return families.includes(m[1])
  })
  const out = kept.join('\n')
  const result = { css: out, dbgHeads: '' }
  fontCssCache.set(key, result) // キャッシュヒットも miss と同じ形で返す
  return result
}

export async function onRequestPost(context) {
  const { request, env } = context
  const { content, style, link, type } = await request.json()
  const isPdf = Number(type) === 0
  if (!env.CF_ACCOUNT_ID || !env.BR_API_TOKEN) {
    return json(request, { msg: 'export service unavailable' }, 503)
  }
  const linkTag = link && link !== 'none' ? `<link rel="stylesheet" href="${link}">` : ''
  // iconfont.css の @font-face も外部 woff2 参照のためブラウザ側で取れない
  // （.iconfont クラス规则自体は fontCss 経由で data-URI 化した @font-face が効く）
  const iconfont = ''
  // .jufe の font-family が Noto Sans SC/Noto Serif SC/Nunito を指すため、
  // レンダ側にもフォントを届けないとフォールバック書体で折返し位置がずれる。
  // googleapis は CF BR から到達不可。本站自ホストのフォントを data-URI 内联化して使う
  const origin = new URL(request.url).origin
  // @font-face は <style> 内の data-URI でのみ BR に適用される実測あり（addStyleTag の大きな
  // content は黙殺される）。サイト側 style と同じ <style> ブロックへ前置する。
  // 参照されるファミリーだけ内联する（iconfont/Nunito は小さいので常時同梱）
  const scan = `${content || ''}${style || ''}${link || ''}`.toLowerCase()
  const families = ['Noto Sans SC', 'iconfont', 'Nunito']
  if (scan.includes('noto-serif-sc') || scan.includes('noto serif sc')) {
    families.push('Noto Serif SC')
  }
  const { css: fonts, dbgHeads } = await fontCss(origin, families)
  // data-URI フォントはネットワーク待機に数えられず、print がデコード完了を待たず
  // フォールバック書体で出る競合がある。document.fonts.ready のマーカーを
  // waitForSelector で待たせて確定させる。
  const fontWait = `<script>document.fonts.ready.then(()=>{const d=document.createElement('div');d.id='fonts-ready';document.body.appendChild(d)})</script>`
  const html = `<!doctype html><html><head><meta charset="utf-8">${iconfont}${linkTag}<style>${fonts}${
    style || ''
  }</style></head><body>${content}${fontWait}</body></html>`
  const endpoint = isPdf ? 'pdf' : 'screenshot'
  const body = isPdf
    ? {
        html,
        waitForSelector: { selector: '#fonts-ready', timeout: 10000 },
        pdfOptions: {
          // width/height は CF BR では無視され Letter に落ちるため format 指定が必須（小文字のみ受理）
          format: 'a4',
          printBackground: true,
          margin: { top: 0, right: 0, bottom: 0, left: 0 }
        },
        gotoOptions: { waitUntil: 'networkidle0' }
      }
    : {
        html,
        waitForSelector: { selector: '#fonts-ready', timeout: 10000 },
        screenshotOptions: { fullPage: false },
        viewport: { width: 794, height: 1123 },
        gotoOptions: { waitUntil: 'networkidle0' }
      }
  try {
    const r = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${env.CF_ACCOUNT_ID}/browser-rendering/${endpoint}`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${env.BR_API_TOKEN}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
      }
    )
    if (!r.ok) return json(request, { msg: `browser-rendering ${r.status}` }, 503)
    const buf = new Uint8Array(await r.arrayBuffer())
    return json(
      request,
      Object.assign(
        { fontsLen: fonts.length, dbgHeads },
        isPdf ? { pdf: { data: [...buf] } } : { picture: { data: [...buf] } }
      )
    )
  } catch (e) {
    return json(request, { msg: String(e?.message || e) }, 503)
  }
}
