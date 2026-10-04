// POST /export {content,style,link,name,type:0|1} —— 服务端渲染 PDF/截图
// 经 Cloudflare Browser Rendering REST（需 Pages 环境变量 CF_ACCOUNT_ID + BR_API_TOKEN）；
// 未配置时 503（与本地 dev.mjs 缺浏览器行为一致）。
import { json } from './_lib.js'

export const onRequestOptions = context => json(context.request, {})

// フォントを本站 origin から self-fetch し base64 data-URI 化して addStyleTag に内包する。
// html パラメータ経路では外部フォント取得が print に間に合わない（WenQuanYi フォールバック観測）
// ため、フェッチ不要の inline 化で確実に適用させる。cold-start 時のみ取得・モジュールキャッシュ。
let fontCssCache = null
async function fontCss(origin) {
  if (fontCssCache) return fontCssCache
  const css = await (await fetch(`${origin}/fonts/resume-fonts.css`)).text()
  const urls = [...css.matchAll(/url\('([^']+)'\)/g)].map(m => m[1])
  const bufs = await Promise.all(
    urls.map(async u => new Uint8Array(await (await fetch(new URL(u, origin))).arrayBuffer()))
  )
  let out = css
  urls.forEach((u, i) => {
    let bin = ''
    const bytes = bufs[i]
    for (let j = 0; j < bytes.length; j += 0x8000) {
      bin += String.fromCharCode.apply(null, bytes.subarray(j, j + 0x8000))
    }
    out = out.replace(u, `data:font/woff2;base64,${btoa(bin)}`)
  })
  fontCssCache = out
  return out
}

export async function onRequestPost(context) {
  const { request, env } = context
  const { content, style, link, type } = await request.json()
  const isPdf = Number(type) === 0
  if (!env.CF_ACCOUNT_ID || !env.BR_API_TOKEN) {
    return json(request, { msg: 'export service unavailable' }, 503)
  }
  const linkTag = link && link !== 'none' ? `<link rel="stylesheet" href="${link}">` : ''
  const iconfont = `<link rel="stylesheet" href="${
    new URL(request.url).origin
  }/fonts/iconfont.css">`
  // .jufe の font-family が Noto Sans SC/Noto Serif SC/Nunito を指すため、
  // レンダ側にもフォントを届けないとフォールバック書体で折返し位置がずれる。
  // googleapis は CF BR から到達不可。本站自ホストを公式推奨の addStyleTag で注入する
  const origin = new URL(request.url).origin
  const html = `<!doctype html><html><head><meta charset="utf-8">${iconfont}${linkTag}<style>${
    style || ''
  }</style></head><body>${content}</body></html>`
  const endpoint = isPdf ? 'pdf' : 'screenshot'
  const fonts = await fontCss(origin)
  const body = isPdf
    ? {
        html,
        addStyleTag: [{ content: fonts }],
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
        addStyleTag: [{ content: fonts }],
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
    return json(request, isPdf ? { pdf: { data: [...buf] } } : { picture: { data: [...buf] } })
  } catch (e) {
    return json(request, { msg: String(e?.message || e) }, 503)
  }
}
