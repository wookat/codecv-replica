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
// prod は MicrosoftYaHei を Regular+Bold の2バイナリで埋め込む(実測 pdffonts:
// 埋め込み F8 が usWeightClass=700 の実 Bold)。Bold 実体は tcb 同一 bucket の
// WeiRuanYaHei-Bold.woff2 をミラー —— font-weight:700 宣言で太字要素に適用。
const CLOUD_FONT_URLS = {
  'Times New Roman': 'times.ttf',
  微软雅黑: 'yahei.woff2',
  '微软雅黑__700': 'yahei-bold.woff2',
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
  const origin = new URL(request.url).origin
  // prod と同じくスキン CSS はサーバー側で name から注入する
  // (/css/style_<name>.css を全テンプレ分静的配備済み)。
  // クライアントの link はフォールバックとしてオリジン差し替えで使う
  // (localhost/相対 URL は BR から到達不能のため)。
  let skinHref = name ? `${origin}/css/style_${name}.css` : ''
  if (!skinHref && link && link !== 'none') {
    try {
      const u = new URL(link, origin)
      skinHref = u.pathname.startsWith('/') ? `${origin}${u.pathname}${u.search}` : link
    } catch { skinHref = link }
  }
  const linkTag = skinHref ? `<link rel="stylesheet" href="${skinHref}">` : ''
  // 描画 HTML は base URL を持たないため、content 内の相対/ローカル
  // リソース参照を本站オリジンへ絶対化する(avatar 等の画像が BR で欠落する対策)
  const fixedContent = (content || '')
    .replace(/(src|href)=["'](\/[^"']*)["']/g, `$1="${origin}$2"`)
    .replace(/url\((['"]?)(\/[^'")]+)\1\)/g, `url($1${origin}$2$1)`)
    .replace(/https?:\/\/(localhost|127\.0\.0\.1|0\.0\.0\.0)(:\d+)?/g, origin)
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
    .map(([fam, file]) => {
      const [family, weight] = fam.split('__')
      return `@font-face{font-family:'${family}';${weight ? `font-weight:${weight};` : ''}src:url('${origin}/fonts/cvfonts/${file}');}`
    })
    .join('')
  const fonts = (
    await Promise.all(
      families.flatMap(f =>
        (FACE_FILES[f] || []).map(fn =>
          fetch(`${origin}/fonts/${fn}`, { headers: { 'accept-encoding': 'identity' } })
            .then(r => r.text())
            // unicode-range スライスは相対 URL —— BR に渡す html はベース URL が無いため絶対化
            .then(css => css.replace(/url\(\/fonts\//g, `url(${origin}/fonts/`))
        )
      )
    )
  ).join('')
  // フォントのフェッチ/デコード完了を確実に待つため、document.fonts.ready で
  // マーカー要素を立てて waitForSelector で同期する。
  const fontWait = `<script>document.fonts.ready.then(()=>{const d=document.createElement('div');d.id='fonts-ready';document.body.appendChild(d)})</script>`
  // prod の透かし実測(PDF内 1588x2246 ラスタ画像+SMask alpha≈0.18 から逆算):
  // ・2行構成「CodeCV简历」(bold ~32px) + 「www.codecvcv.com」(regular ~15px)
  // ・右下がり 27.3° 回転、色 #808080 / alpha 0.18 (白地合成 ≈ #E8E8E8)
  // ・インスタンス中心(1588x2246 smask 実測): 偶数行 x=151+273c / 奇数行 x=287.5+273c,
  //   各行 y=122.5+215k で全 5 行 —— CSS px 換算済み(画像は2px/css)
  // ・ページ内 @font-face を効かせるため DOM 要素で生成(background SVG はフォント隔離)
  const watermark = `<div id="wm" style="position:fixed;inset:0;z-index:2147483000;pointer-events:none"></div><script>(function(){var w=document.getElementById('wm');for(var r=0;r<7;r++){for(var c=-1;c<4;c++){var cx=(r%2?287.5:151)+273*c;var cy=122.5+215*r;var d=document.createElement('div');d.style.cssText='position:absolute;left:'+(cx-80)+'px;top:'+(cy-34)+'px;width:160px;text-align:center;transform:rotate(27.3deg);color:rgba(128,128,128,0.18);line-height:1.2';d.innerHTML='<div style="font-size:32px;font-weight:700;font-family:\\u5fae\\u8f6f\\u96c5\\u9ed1,Microsoft YaHei,sans-serif">CodeCV\\u7b80\\u5386</div><div style="font-size:15px;margin-top:9px;font-family:\\u5fae\\u8f6f\\u96c5\\u9ed1,Microsoft YaHei,sans-serif">www.codecvcv.com</div>';w.appendChild(d)}}})()</script>`
  // prod の export リクエスト style フィールドに同梱される正規化ルールを同じく
  // 同梱（mark 内の色/背景を outer 側に正規化・全要素 line-height:20px 強制）
  const markNormalize = `.markdown-transform-html mark { color: inherit; }
.markdown-transform-html span[data-color] :not([data-color]),
.markdown-transform-html mark[data-color] :not([data-color]) { color: inherit !important; }
.markdown-transform-html mark code { background: transparent !important; }
.markdown-transform-html mark:has(code) { border-radius: 5px; }
.markdown-transform-html * { line-height: 20px; }`
  // テンプレ別 line-height/margin は prod PDF の行ピッチ実測で決定
  // (lh∈{17,18,19,20,22}×mt∈{0,5} を各テンプレ全変体レンダリングし、
  //  prod との行位置誤差が最小の組を採用。詳細: audit/EXPORT-AUDIT.md)。
  // 皮膚側 li ルールより後に置いて必ず勝たせるため、マップ値を一律出力する。
  const LH_MAP = { '100':[19, 5],'101':[19,5],'102':[20,5],'103':[19,5],'104':[19,5],'105':[19,5],'106':[19,5],'107':[19,5],'108':[19,5],'109':[19,5],'10front_end':[19, 5],'11fresh':[20,5],'12internet_social':[23, 0],'13geek':[23, 0],'14heading':[23, 0],'15simple_versatile':[22, 5],'16prominent_content':[20,5],'17business':[21, 5],'18art':[21, 5],'19social':[21, 5],'1internet_avatar':[20, 5],'20campus_simple':[19,5],'21it_campus':[18,5],'22':[20, 5],'23':[19,5],'24':[19, 5],'25':[19,5],'26':[18,5],'27':[16, 5],'28':[20, 5],'29':[19,5],'2concise':[20,5],'30':[20,5],'31':[21, 5],'32':[21, 5],'33':[21, 5],'34':[21, 5],'35':[21, 5],'36':[20,5],'37':[20,5],'38':[19, 5],'39':[19,5],'3operation':[20, 5],'40':[20,5],'41':[20,5],'42':[20,5],'43':[20,5],'44':[20,5],'45':[19,5],'46':[20,5],'47':[20,5],'48':[20,5],'49':[20,5],'4internet':[20, 5],'50':[20,5],'51':[20,5],'52':[18,5],'53':[16, 5],'54':[18,5],'55':[18,5],'56':[18, 5],'57':[18,5],'58':[19,5],'59':[18,5],'5graduation_reexam':[20, 5],'60':[17,5],'61':[20,5],'62':[20,5],'63':[19,5],'64':[17,5],'65':[18,5],'66':[20,5],'67':[19,5],'68':[22, 0],'69':[19,5],'6operation_avatar':[20,5],'70':[18, 5],'71':[20,5],'72':[18,5],'73':[17,5],'74':[20, 5],'75':[20,5],'76':[20, 5],'77':[20,5],'78':[17,5],'79':[17,5],'7simple_avatar':[21, 5],'80':[18,5],'81':[19,5],'82':[19,5],'83':[19,5],'84':[20, 5],'85':[18,5],'86':[19,5],'87':[16, 5],'88':[19,5],'89':[18,5],'8general':[21, 5],'90':[19,5],'91':[19,5],'92':[19,5],'93':[19,5],'94':[19,5],'95':[19,5],'96':[19,5],'97':[20,5],'98':[19,5],'99':[19,5],'9business':[20, 5],'agent_development':[19,5],'duomotaidamoxingsuanfa':[18, 5],'shuziic':[19,5],'yinhangguanpeisheng':[19,5],'youxikehuduankaifa':[19,5] }
  const lm = LH_MAP[name] || [20, 5]
  const liFix = `.markdown-transform-html *{line-height:${lm[0]}px}.markdown-transform-html li{line-height:${lm[0]}px;margin-top:${lm[1]}px}`
  // prod の埋め込みフォントは投稿フォントスタック先頭のファミリーに一致
  // (実測全114: Times 宣言テンプレだけ TimesNewRomanPS、他は先頭ファミリー
  // 自体がラテンも描く。Serif 宣言は NotoSerifSC、その他各書体)——
  // ラテン強制置換は不要のため行わない。
  // 順序: skin link → フォント/markNormalize → liFix(テンプレ既定行距) → style
  // (attr 断片: テーマ変数 + ユーザー調整の Line_Height/font_size/para_spacing/
  //  justify/one-page/custom-css は必ず最後に置いて既定値を上書きさせる ——
  //  prod の style 連結順と同じ)。
  const html = `<!doctype html><html><head><meta charset="utf-8">${linkTag}<style>${cloudFaces}${fonts}${markNormalize}${liFix}${
    style || ''
  }</style></head><body>${fixedContent}${watermark}${fontWait}</body></html>`
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
