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
  'Noto Sans SC': [
    'face-noto-sans-sc-400.css',
    'face-noto-sans-sc-500.css',
    'face-noto-sans-sc-700.css'
  ],
  'Noto Serif SC': ['face-noto-serif-sc-400.css', 'face-noto-serif-sc-700.css'],
  Nunito: [
    'face-nunito-400.css',
    'face-nunito-500.css',
    'face-nunito-700.css',
    'face-nunito-800.css',
    'face-nunito-900.css',
    'face-nunito-500i.css'
  ],
  // prod の Latin 数字は TimesNewRomanPS —— Regular は実バイナリ times.ttf、
  // Bold/Italic は Tinos(TimesNewRomanPS-BoldMT/ItalicMT 相当)を同姓で供給
  'Times New Roman': ['face-times-new-roman-700.css', 'face-times-new-roman-italic.css'],
  // @font-face 本体と ~200 個の .icon-* クラス規則の2ファイル
  iconfont: ['face-iconfont-400.css', 'face-iconfont.css']
}
// prod のプロプライエタリ書体 —— prod 自身が tcb CDN で公開配信している実バイナリを
// 本站 /fonts/cvfonts/ にミラー(pdffonts で内部名の一致を検証済み: MicrosoftYaHei /
// PingFangSC / AlibabaPuHuiTi_2_55_Regular / FZKTJW--GB1-0 / TimesNewRomanPSMT)。
// data-URI だと数 MB あるため URL src の @font-face で宣言(使用ファミリーだけ実 DL)。
const CLOUD_FONT_URLS = {
  'Times New Roman': 'times.ttf',
  微软雅黑: 'yahei.woff2',
  PingFangSC: 'pingfang.woff2',
  阿里巴巴普惠体: 'puhuiti.ttf',
  'FZKai-Z03S': 'fzkai.ttf',
  'FZXiaoBiaoSong-B05S': 'xbs.ttf',
  仿宋_GB2312: 'fangsong.ttf',
  阿里妈妈数黑体: 'shuheiti.woff2',
  'Alimama DongFangDaKai': 'dongfang.woff2',
  钉钉进步体: 'dingtalk.ttf',
  TBMCYXT: 'tbmc.woff2',
  仓耳舒圆体: 'shuyuan.woff2',
  仓耳渔阳体: 'yuyang.ttf',
  庞门正道细线体: 'pmzd.ttf'
}

export async function onRequestPost(context) {
  const { request, env } = context
  const { content, style, link, name, type } = await request.json()
  const isPdf = Number(type) === 0
  if (!env.CF_ACCOUNT_ID || !env.BR_API_TOKEN) {
    return json(request, { msg: 'export service unavailable' }, 503)
  }
  const linkTag = link && link !== 'none' ? `<link rel="stylesheet" href="${link}">` : ''
  const origin = new URL(request.url).origin
  // .jufe の font-family が Noto Sans SC/Noto Serif SC/Nunito を指すため、
  // レンダ側にもフォントを届けないとフォールバック書体で折返し位置がずれる。
  // googleapis は CF BR から到達不可のため本站自ホストの css を link で渡す。
  const scan = `${content || ''}${style || ''}${link || ''}`
  const families = ['Noto Sans SC', 'iconfont', 'Nunito', 'Times New Roman']
  if (/noto[- ]serif[- ]sc/i.test(scan)) {
    families.push('Noto Serif SC')
  }
  // URL src の @font-face は未使用フェイスを DL しないため全量宣言しても安い
  const cloudFaces = Object.entries(CLOUD_FONT_URLS)
    .map(
      ([fam, file]) =>
        `@font-face{font-family:'${fam}';src:url('${origin}/fonts/cvfonts/${file}');}`
    )
    .join('')
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
  // prod エクスポートの li 間隔はテンプレ固有(実測: 全114 PDF の行ピッチで分類)。
  // ・91 テンプレ: margin-top:5px → ピッチ 25px(18.7pt) — 既定(common.css :where ルール)のまま
  // ・23 テンプレ: margin 実質0 → ピッチ 20px(15.0pt)
  // ・6 テンプレ: li 行高 22px → ピッチ 22px(16.5pt)
  const LI_MARGIN0 = new Set(
    '17business 18art 19social 23 25 27 2concise 37 53 5graduation_reexam 70 71 72 74 75 76 77 87 9business duomotaidamoxingsuanfa shuziic youxikehuduankaifa'.split(
      ' '
    )
  )
  const LI_LH22 = new Set('21it_campus 60 64 73 78 79'.split(' '))
  // 23px 群: PingFangSC/PuHuiTi 系(実測 17.2pt) / 24px 群: Noto 一部(18.0pt)
  const LI_MT3 = new Set('26 56 57 59 85 89'.split(' '))
  const LI_MT4 = new Set('67 81 98 99 agent_development'.split(' '))
  const liFix = LI_LH22.has(name)
    ? `.markdown-transform-html li{line-height:22px;margin-top:0}`
    : LI_MARGIN0.has(name)
    ? `.markdown-transform-html li{margin-top:0}`
    : LI_MT3.has(name)
    ? `.markdown-transform-html li{margin-top:3px}`
    : LI_MT4.has(name)
    ? `.markdown-transform-html li{margin-top:4px}`
    : ''
  // prod の埋め込みフォントは投稿フォントスタック先頭のファミリーに一致
  // (実測全114: Times 宣言テンプレだけ TimesNewRomanPS、他は先頭ファミリー
  // 自体がラテンも描く。Serif 宣言は NotoSerifSC、その他各書体)——
  // ラテン強制置換は不要のため行わない。
  const html = `<!doctype html><html><head><meta charset="utf-8">${linkTag}<style>${cloudFaces}${fonts}${markNormalize}${
    style || ''
  }${liFix}</style></head><body>${content}${watermark}${fontWait}</body></html>`
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
