// POST /export {content,style,link,name,type:0|1} —— 服务端渲染 PDF/截图
// 经 Cloudflare Browser Rendering REST（需 Pages 环境变量 CF_ACCOUNT_ID + BR_API_TOKEN）；
// 未配置时 503（与本地 dev.mjs 缺浏览器行为一致）。
import { json } from './_lib.js'

export const onRequestOptions = context => json(context.request, {})

// フォント提供方式の変遷（実測ベース）:
// 1. 外部 woff2 URL 参照 —— BR の Chromium がデコードまで待たず適用されない（×）
// 2. addStyleTag(url|content) —— CF BR が黙殺（×）
// 3. data-URI @font-face の inline <style> —— これのみ確実に適用される（採用）
// face 別ファイルに切り出し、テンプレが参照するファミリーだけ inline する。
const FACE_FILES = {
  'Noto Sans SC': ['face-noto-sans-sc-400.css', 'face-noto-sans-sc-700.css'],
  'Noto Serif SC': ['face-noto-serif-sc-400.css', 'face-noto-serif-sc-700.css'],
  Nunito: ['face-nunito-400.css', 'face-nunito-700.css'],
  // prod の Latin 数字は TimesNewRomanPS —— メトリック互換の無償代替 Tinos を同姓で供給
  'Times New Roman': ['face-times-new-roman-400.css', 'face-times-new-roman-700.css'],
  // @font-face 本体と ~200 個の .icon-* クラス規則の2ファイル
  iconfont: ['face-iconfont-400.css', 'face-iconfont.css']
}

export async function onRequestPost(context) {
  const { request, env } = context
  const { content, style, link, type } = await request.json()
  const isPdf = Number(type) === 0
  if (!env.CF_ACCOUNT_ID || !env.BR_API_TOKEN) {
    return json(request, { msg: 'export service unavailable' }, 503)
  }
  const linkTag = link && link !== 'none' ? `<link rel="stylesheet" href="${link}">` : ''
  const origin = new URL(request.url).origin
  // .jufe の font-family が Noto Sans SC/Noto Serif SC/Nunito を指すため、
  // レンダ側にもフォントを届けないとフォールバック書体で折返し位置がずれる。
  // googleapis は CF BR から到達不可のため本站自ホストの css を link で渡す。
  const scan = `${content || ''}${style || ''}${link || ''}`.toLowerCase()
  const families = ['Noto Sans SC', 'iconfont', 'Nunito', 'Times New Roman']
  if (scan.includes('noto-serif-sc') || scan.includes('noto serif sc')) {
    families.push('Noto Serif SC')
  }
  const fonts = (
    await Promise.all(
      families.flatMap(f =>
        (FACE_FILES[f] || []).map(fn =>
          fetch(`${origin}/fonts/${fn}`, { headers: { 'accept-encoding': 'identity' } }).then(r =>
            r.text()
          )
        )
      )
    )
  ).join('')
  // フォントのフェッチ/デコード完了を確実に待つため、document.fonts.ready で
  // マーカー要素を立てて waitForSelector で同期する。
  const fontWait = `<script>document.fonts.ready.then(()=>{const d=document.createElement('div');d.id='fonts-ready';document.body.appendChild(d)})</script>`
  // prod PDF は全ページに斜めタイルの薄グレー透かし（「CodeCV简历 www.codecvcv.com」、
  // 有償解除機能）が入る。こちらは本站ドメインで同型を複製 —— position:fixed は印刷時
  // 全ページに繰り返し描画されるためタイル層1枚で済む。
  const wmSvg = `data:image/svg+xml,${encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="340" height="220"><text x="170" y="110" font-size="17" fill="rgba(0,0,0,0.07)" transform="rotate(-30 170 110)" text-anchor="middle" font-family="sans-serif">CodeCV简历  codecv.zalize.com</text></svg>`
  )}`
  const watermark = `<div style="position:fixed;inset:0;z-index:2147483000;pointer-events:none;background-image:url('${wmSvg}');background-repeat:repeat"></div>`
  // prod の export リクエスト style フィールドに同梱される正規化ルールを同じく
  // 同梱（mark 内の色/背景を outer 側に正規化・全要素 line-height:20px 強制）
  const markNormalize = `.markdown-transform-html mark { color: inherit; }
.markdown-transform-html span[data-color] :not([data-color]),
.markdown-transform-html mark[data-color] :not([data-color]) { color: inherit !important; }
.markdown-transform-html mark code { background: transparent !important; }
.markdown-transform-html mark:has(code) { border-radius: 5px; }
.markdown-transform-html * { line-height: 20px; }`
  // prod PDF ではラテン文字が TimesNewRomanPS(セリフ)で描かれるテンプレは
  // 'Noto Sans SC'/'Noto Serif SC' 指定のものに限る(実測: Nunito は Nunito、
  // 微软雅黑/阿里普惠/PingFang/FZKai は各フォント、Times 指定は Times のまま)。
  // 先頭ファミリが Noto Sans/Serif SC(または未指定=既定 Noto)のときだけ
  // 'Times New Roman' をスタック先頭に差して prod と同じ serif-Latin に揃える。
  const stackMatch = (style || '').match(/\.jufe \*\s*\{[^}]*font-family:\s*([^;]+);/)
  const callerStack = (stackMatch?.[1] || '').trim()
  const firstFamily = callerStack.split(',')[0].replace(/['"]/g, '').trim()
  const needsTimes =
    callerStack === '' || firstFamily === 'Noto Sans SC' || firstFamily === 'Noto Serif SC'
  const latinSerif = needsTimes
    ? `.jufe * { font-family: 'Times New Roman', ${
        callerStack || `'Noto Sans SC', 'Noto Serif SC', 'Nunito', sans-serif, serif`
      }; }`
    : ''
  const html = `<!doctype html><html><head><meta charset="utf-8">${linkTag}<style>${fonts}${markNormalize}${
    style || ''
  }${latinSerif}</style></head><body>${content}${watermark}${fontWait}</body></html>`
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
    return json(request, isPdf ? { pdf: { data: [...buf] } } : { picture: { data: [...buf] } })
  } catch (e) {
    return json(request, { msg: String(e?.message || e) }, 503)
  }
}
