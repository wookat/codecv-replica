import { getLocalStorage, removeLocalStorage, setLocalStorage } from '@/common/localstorage'
import { createStyle, query, removeHeadStyle, createDIV } from '@/utils'
import { getFontFamily, getPrimaryBGColor, getPrimaryColor } from '@/templates/config'
import { onActivated, onMounted, reactive, ref } from 'vue'

const get = getLocalStorage,
  set = setLocalStorage
export const CUSTOM_CSS_STYLE = 'custom-css-style',
  CUSTOM_MARKDOWN_PRIMARY_COLOR = 'custom-markdown-primary-color',
  CUSTOM_MARKDOWN_PRIMARY_BG_COLOR = 'custom_markdown_primary_bg_color',
  MARKDOWN_FONT = 'markdown-font',
  ADJUST_RESUME_MARGIN_TOP = 'ADJUST_RESUME_MARGIN_TOP',
  AUTO_ONE_PAGE = 'auto-one-page',
  WHITE_SPACE = 'white-space',
  LINE_HEIGHT = 'Line_Height',
  FONT_SIZE = 'font_size',
  PARA_SPACING = 'para_spacing',
  JUSTIFY_TEXT = 'justify_text',
  BADGE_CONFIG = 'badge_config',
  A4_HEIGHT = 1123,
  SELF_HEIGHT = -1234

export const renderCV = ref<HTMLElement>()
export const step = ref<number>(90)
export const pageSize = ref<number>(1)
// 用户手动调过缩放后，容器自适应缩放便不再接管
export const stepTouched = ref(false)

export function setStep(val: number | any) {
  stepTouched.value = true
  step.value = val
}

const A4_CSS_PX = 794

export function fitStepToWidth(availWidth: number) {
  if (stepTouched.value || !availWidth) return
  const fit = Math.floor((((availWidth - 24) / A4_CSS_PX) * 100) / 10) * 10
  step.value = Math.min(100, Math.max(30, fit))
}

function queryRenderCV() {
  return <HTMLElement>document.querySelector('.reference-dom')
}

export function useAvatar(emits: any) {
  async function setAvatar(event: any) {
    const file = event.target.files[0]
    const reader = new FileReader()
    reader.readAsDataURL(file) // 暂时用base64处理 后期换cdn
    reader.onload = function (event) {
      emits('upload-avatar', event.target?.result)
    }
  }

  return {
    setAvatar
  }
}

export function useCustomCSS(resumeType: string) {
  const cssDialog = ref(false),
    cacheKey = CUSTOM_CSS_STYLE + '-' + resumeType
  const cssText = ref(get(cacheKey) ? (get(cacheKey) as string) : '')

  function toggleDialog() {
    cssDialog.value = !cssDialog.value
  }

  function setStyle() {
    cssDialog.value = false
    let style = query(cacheKey)

    const cssValue = cssText.value.trim(),
      isAppend = style
    if (!cssText.value) {
      return
    }
    if (!style) {
      style = createStyle()
      style.setAttribute(cacheKey, 'true')
    }
    style.textContent = cssValue
    !isAppend && document.head?.appendChild(style)
    set(cacheKey, cssValue)
  }

  function removeStyle() {
    cssDialog.value = false
    removeHeadStyle(cacheKey)
    removeLocalStorage(cacheKey)
    cssText.value = ''
  }

  onActivated(() => !query(cacheKey) && setTimeout(setStyle, 50))

  return {
    cssDialog,
    cssText,
    toggleDialog,
    setStyle,
    removeStyle
  }
}

export function usePrimaryBGColor(resumeType: string) {
  const cacheKey = CUSTOM_MARKDOWN_PRIMARY_BG_COLOR + '-' + resumeType,
    initialColor = getPrimaryBGColor(resumeType)
  const primaryColor = ref(get(cacheKey) ? (get(cacheKey) as string) : initialColor)

  function setPrimaryColor(color: string | null) {
    if (!color) {
      primaryColor.value = initialColor
      color = initialColor
    }
    let style = query(cacheKey)
    const append = style
    if (!style) {
      style = createStyle()
      style.setAttribute(cacheKey, 'true')
    }
    style.textContent = `:root { --markdown-primary-bg-color: ${color}; }`
    !append && document.head.appendChild(style)
    set(cacheKey, color)
  }

  onActivated(() => !query(cacheKey) && setPrimaryColor(primaryColor.value))

  return {
    primaryColor,
    setPrimaryColor
  }
}

// todo: 回跳后颜色显示的问题，后续考虑接入后端解决
export function usePrimaryColor(resumeType: string) {
  const cacheKey = CUSTOM_MARKDOWN_PRIMARY_COLOR + '-' + resumeType,
    initialColor = getPrimaryColor(resumeType),
    color = ref(get(cacheKey) ? (get(cacheKey) as string) : initialColor)

  function setColor(value: string | null) {
    if (!value) {
      color.value = initialColor
      value = initialColor
    }
    let styleDOM = query(cacheKey)
    const isAppend = styleDOM

    if (!styleDOM) {
      styleDOM = createStyle()
      styleDOM.setAttribute(cacheKey, 'true')
    }
    styleDOM.textContent = `:root { --markdown-primary-color: ${value} }`
    !isAppend && document.head.appendChild(styleDOM)
    set(cacheKey, value)
  }

  onActivated(() => !query(cacheKey) && setColor(color.value))

  return {
    color,
    setColor
  }
}

// 自定义字体
export function useCustomFont(resumeType: string) {
  const cacheKey = MARKDOWN_FONT + '-' + resumeType
  // prod と同じ選択肢構成: ビルトイン3書体 + クラウド14書体(prod useCustomFont の
  // fontOptions と同一順)。クラウド書体は /fonts/cvfonts/ の実バイナリを @font-face で登録。
  const cloudFonts: Record<string, string> = {
    'Times New Roman': 'times.ttf',
    PingFangSC: 'pingfang.woff2',
    微软雅黑: 'yahei.woff2',
    'FZKai-Z03S': 'fzkai.ttf',
    'FZXiaoBiaoSong-B05S': 'xbs.ttf',
    仿宋_GB2312: 'fangsong.ttf',
    阿里巴巴普惠体: 'puhuiti.ttf',
    阿里妈妈数黑体: 'shuheiti.woff2',
    'Alimama DongFangDaKai': 'dongfang.woff2',
    钉钉进步体: 'dingtalk.ttf',
    TBMCYXT: 'tbmc.woff2',
    仓耳舒圆体: 'shuyuan.woff2',
    仓耳渔阳体: 'yuyang.ttf',
    庞门正道细线体: 'pmzd.ttf'
  }
  const freeFonts = [
    { value: 'Noto Serif SC', label: '思源宋体' },
    { value: 'Noto Sans SC', label: '思源黑体' },
    { value: 'Nunito', label: 'Nunito' }
  ]
  const proFonts = [
    { value: 'Times New Roman', label: 'Times New Roman' },
    { value: 'PingFangSC', label: '苹果方正' },
    { value: '微软雅黑', label: '微软雅黑' },
    { value: 'FZKai-Z03S', label: '方正楷体' },
    { value: 'FZXiaoBiaoSong-B05S', label: '方正小标宋简' },
    { value: '仿宋_GB2312', label: '仿宋_GB2312' },
    { value: '阿里巴巴普惠体', label: '阿里巴巴普惠体' },
    { value: '阿里妈妈数黑体', label: '阿里妈妈数黑体' },
    { value: 'Alimama DongFangDaKai', label: '阿里妈妈东方大楷' },
    { value: '钉钉进步体', label: '钉钉进步体' },
    { value: 'TBMCYXT', label: '淘宝买菜体' },
    { value: '仓耳舒圆体', label: '仓耳舒圆体' },
    { value: '仓耳渔阳体', label: '仓耳渔阳体' },
    { value: '庞门正道细线体', label: '庞门正道细线体' }
  ]
  const fontOptions = [...freeFonts, ...proFonts]
  function registerCloudFonts() {
    if (document.head.querySelector('style[data-cloud-fonts]')) return
    const s = createStyle()
    s.setAttribute('data-cloud-fonts', 'true')
    s.textContent = Object.entries(cloudFonts)
      .map(
        ([fam, file]) => `@font-face { font-family: '${fam}'; src: url('/fonts/cvfonts/${file}'); }`
      )
      .join('\n')
    document.head.appendChild(s)
  }
  registerCloudFonts()
  const font = ref(
    get(cacheKey) ? (get(cacheKey) as string) : getFontFamily(resumeType) || fontOptions[0].value
  )

  function setFont(fontFamily: string | null, first?: boolean) {
    let style = query(cacheKey)
    const isAppend = style
    if (!style) {
      style = createStyle()
      style.setAttribute(cacheKey, 'true')
    }

    style.textContent = `.jufe * { font-family: ${fontFamily}, 'Noto Sans SC', 'Noto Serif SC', 'Nunito', sans-serif, serif; }`
    !isAppend && document.head.appendChild(style)
    set(cacheKey, fontFamily)
    const renderCV = queryRenderCV()
    ensureEmptyPreWhiteSpace(renderCV)
    !first && splitPage(renderCV)
  }

  onActivated(() => setFont(font.value, true))

  return {
    fontOptions,
    font,
    setFont
  }
}

/* 一键重置 */
export function restResumeContent(resumeType: string) {
  localStorage.removeItem(`${CUSTOM_CSS_STYLE}-${resumeType}`)
  localStorage.removeItem(`${CUSTOM_MARKDOWN_PRIMARY_COLOR}-${resumeType}`)
  localStorage.removeItem(`${CUSTOM_MARKDOWN_PRIMARY_BG_COLOR}-${resumeType}`)
  localStorage.removeItem(`${MARKDOWN_FONT}-${resumeType}`)
  localStorage.removeItem(`${AUTO_ONE_PAGE}-${resumeType}`)
  localStorage.removeItem(`${ADJUST_RESUME_MARGIN_TOP}-${resumeType}`)
  localStorage.removeItem(`${LINE_HEIGHT}-${resumeType}`)
  localStorage.removeItem(`${FONT_SIZE}-${resumeType}`)
  localStorage.removeItem(`${PARA_SPACING}-${resumeType}`)
  localStorage.removeItem(`${JUSTIFY_TEXT}-${resumeType}`)
  localStorage.removeItem(`${BADGE_CONFIG}-${resumeType}`)
  localStorage.removeItem(`page_margin-${resumeType}`)
  localStorage.removeItem(`markdown-content-${resumeType}`)
  location.reload()
}

function upsertPersistStyle(cacheKey: string, css: string) {
  let styleDOM = query(cacheKey)
  const isAppend = styleDOM
  if (!styleDOM) {
    styleDOM = createStyle()
    styleDOM.setAttribute(cacheKey, 'true')
  }
  styleDOM.textContent = css
  !isAppend && document.head.appendChild(styleDOM)
  set(cacheKey, css)
}

function restorePersistStyle(cacheKey: string) {
  const css = (get(cacheKey) as string) || ''
  css && upsertPersistStyle(cacheKey, css)
}

function reSplit() {
  const renderCV = queryRenderCV()
  renderCV && splitPage(renderCV)
}

// 行距（生产同款下拉选择 10-39px，写 .markdown-transform-html *{line-height:Npx}）
export function useLineHeight(resumeType: string) {
  const cacheKey = LINE_HEIGHT + '-' + resumeType
  const match = ((get(cacheKey) as string) || '').match(/line-height:\s*([\d.]+)px/)
  const lineHeight = ref(match ? Number(match[1]) : 15)
  const lineHeightOptions = Array.from({ length: 30 }, (_, i) => ({
    value: i + 10,
    label: i + 10 + 'px'
  }))

  function apply(n: number) {
    lineHeight.value = n
    upsertPersistStyle(cacheKey, `.markdown-transform-html * { line-height: ${n}px; }`)
    reSplit()
  }
  onActivated(() => restorePersistStyle(cacheKey))
  return { lineHeight, lineHeightOptions, applyLineHeight: apply }
}

// 页边距（生产同款两个步进器：上下页边距默认30 / 左右页边距默认50，写 .jufe{padding:V H}）
export function usePageMargin(resumeType: string) {
  const cacheKey = 'page_margin' + '-' + resumeType
  const stored = ((get(cacheKey) as string) || '').match(/padding:\s*([\d.]+)px\s*([\d.]+)px/)
  const pageMarginTB = ref(stored ? Number(stored[1]) : 30)
  const pageMarginLR = ref(stored ? Number(stored[2]) : 50)

  function apply() {
    upsertPersistStyle(
      cacheKey,
      `/* SET_PADDING_START */\n.jufe { padding: ${pageMarginTB.value}px ${pageMarginLR.value}px; }\n/* SET_PADDING_END */`
    )
    reSplit()
  }
  onActivated(() => restorePersistStyle(cacheKey))
  return { pageMarginTB, pageMarginLR, applyPageMargin: apply }
}

// 段距（px 步进，作用于段落/列表上下外边距）
export function useParaSpacing(resumeType: string) {
  const cacheKey = PARA_SPACING + '-' + resumeType
  const match = ((get(cacheKey) as string) || '').match(/margin-top:\s*([\d.]+)px/)
  const paraSpacing = ref(match ? Number(match[1]) : 10)

  function apply(n: number) {
    paraSpacing.value = n
    upsertPersistStyle(
      cacheKey,
      `.jufe p, .jufe li, .jufe blockquote { margin-top: ${n}px !important; margin-bottom: ${n}px !important; }`
    )
    reSplit()
  }
  onActivated(() => restorePersistStyle(cacheKey))
  return { paraSpacing, applyParaSpacing: apply }
}

// 字号（作用于纸面基准字号）
export function useFontSize(resumeType: string) {
  const cacheKey = FONT_SIZE + '-' + resumeType
  const match = ((get(cacheKey) as string) || '').match(/font-size:\s*([\d.]+)px/)
  const fontSize = ref(match ? Number(match[1]) : 15)
  const fontSizeOptions = [13, 14, 15, 16, 17, 18, 20].map(v => ({
    value: v,
    label: v + 'px'
  }))

  function apply(n: number) {
    fontSize.value = n
    upsertPersistStyle(cacheKey, `.jufe { font-size: ${n}px !important; }`)
    reSplit()
  }
  onActivated(() => restorePersistStyle(cacheKey))
  return { fontSize, fontSizeOptions, applyFontSize: apply }
}

// 两端对齐
export function useJustify(resumeType: string) {
  const cacheKey = JUSTIFY_TEXT + '-' + resumeType
  const justified = ref(Boolean(get(cacheKey)))

  function toggleJustify() {
    justified.value = !justified.value
    if (justified.value) {
      upsertPersistStyle(
        cacheKey,
        '.jufe p, .jufe li, .jufe blockquote { text-align: justify !important; }'
      )
    } else {
      upsertPersistStyle(cacheKey, '')
      set(cacheKey, '')
      removeLocalStorage(cacheKey)
    }
  }
  onActivated(() => restorePersistStyle(cacheKey))
  return { justified, toggleJustify }
}

// 智能一页：生产同款算法——按系数逐级压缩各元素 margin-top 直到装进一页
export function useOnePage(resumeType: string) {
  const cacheKey = AUTO_ONE_PAGE + '-' + resumeType,
    onePageApplied = ref(!!query(cacheKey) || !!get(cacheKey))

  function smartOnePage() {
    const renderCV = queryRenderCV()
    if (!renderCV) return
    if (pageSize.value <= 1) {
      onePageApplied.value = true
      return
    }
    // 采集各元素当前 margin-top 基线
    const sels = ['p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'li', 'ul', 'ol', 'blockquote']
    const base = sels.map(sel => {
      const el = renderCV.querySelector(sel)
      const mt = el ? parseFloat(getComputedStyle(el).marginTop) || 0 : 0
      return { sel, mt }
    })
    for (let k = 0.95; k >= -0.5; k -= 0.05) {
      const css = base
        .filter(b => b.mt)
        .map(b => `.jufe ${b.sel} { margin-top: ${(b.mt * k).toFixed(4)}px!important; }`)
        .join(' ')
      upsertPersistStyle(cacheKey, css)
      reSplit()
      if (pageSize.value <= 1) {
        onePageApplied.value = true
        return
      }
    }
    onePageApplied.value = true
  }

  function toggleOnePage() {
    if (onePageApplied.value) {
      upsertPersistStyle(cacheKey, '')
      set(cacheKey, '')
      removeLocalStorage(cacheKey)
      onePageApplied.value = false
      reSplit()
      return
    }
    smartOnePage()
  }
  onActivated(() => restorePersistStyle(cacheKey))
  return { smartOnePage, toggleOnePage, onePageApplied }
}

// 校徽：上传图片叠加到头部区域 可拖拽定位
export function useBadge(resumeType: string) {
  const cacheKey = BADGE_CONFIG + '-' + resumeType

  async function setBadge(event: Event) {
    const file = (event.target as HTMLInputElement).files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.readAsDataURL(file)
    reader.onload = function (e) {
      set(cacheKey, JSON.stringify({ url: e.target?.result as string, top: 10, left: 10 }))
      reSplit()
      location.reload()
    }
  }

  // 拖拽重定位：预览是 scale 渲染，位移要除以缩放系数
  let dragBound = false
  function bindDrag() {
    if (dragBound) return
    dragBound = true
    let dragging: HTMLElement | null = null
    let startX = 0,
      startY = 0,
      baseTop = 0,
      baseLeft = 0
    document.addEventListener('mousedown', e => {
      const t = e.target as HTMLElement
      if (!t.classList?.contains('cv-badge-overlay')) return
      dragging = t
      startX = e.clientX
      startY = e.clientY
      baseTop = parseFloat(t.style.top) || 0
      baseLeft = parseFloat(t.style.left) || 0
      e.preventDefault()
    })
    document.addEventListener('mousemove', e => {
      if (!dragging) return
      const scale = step.value / 100 || 1
      const top = baseTop + (e.clientY - startY) / scale
      const left = baseLeft + (e.clientX - startX) / scale
      dragging.style.top = top + 'px'
      dragging.style.left = left + 'px'
      document.querySelectorAll('img.cv-badge-overlay').forEach(el => {
        ;(el as HTMLElement).style.top = top + 'px'
        ;(el as HTMLElement).style.left = left + 'px'
      })
    })
    document.addEventListener('mouseup', e => {
      if (!dragging) return
      const scale = step.value / 100 || 1
      const top = Math.round(baseTop + (e.clientY - startY) / scale)
      const left = Math.round(baseLeft + (e.clientX - startX) / scale)
      dragging = null
      const raw = get(cacheKey) as string | null
      if (!raw) return
      try {
        const cfg = JSON.parse(raw)
        cfg.top = top
        cfg.left = left
        set(cacheKey, JSON.stringify(cfg))
      } catch {
        /* ignore */
      }
    })
  }
  onActivated(bindDrag)
  return { setBadge }
}

// 调节元素边距/字号（生产同款固定语义行：只显示简历模板中已经使用的元素）
export function useAdjust(resumeType: string) {
  const visible = ref(false)
  const properties = reactive<IElementProperty[]>([])
  const cacheKey = ADJUST_RESUME_MARGIN_TOP + '-' + resumeType
  interface IElementProperty {
    name: string
    selector: string
    marginTop: number
    marginBottom: number
    fontSize: number
  }

  // 生产弹层的语义元素表（按出现顺序）
  const SEMANTIC_ELEMENTS: Array<[string, string]> = [
    ['一级标题', 'h1'],
    ['二级标题', 'h2'],
    ['三级标题', 'h3'],
    ['四级标题', 'h4'],
    ['五级标题', 'h5'],
    ['六级标题', 'h6'],
    ['简历模块', '.resume-module'],
    ['左右布局', '.flex-layout'],
    ['左右布局项', '.flex-layout-item'],
    ['链接', 'a'],
    ['粗体', 'strong'],
    ['正文', 'p'],
    ['列表项', 'li'],
    ['无序列表', 'ul'],
    ['有序列表', 'ol'],
    ['引用', 'blockquote'],
    ['分割线', 'hr']
  ]

  function getProperties(element: HTMLElement): IElementProperty[] {
    const curProperties: IElementProperty[] = []
    for (const [name, selector] of SEMANTIC_ELEMENTS) {
      const el = element.querySelector(selector) as HTMLElement | null
      if (!el) continue
      const cs = window.getComputedStyle(el)
      curProperties.push({
        name,
        selector,
        marginTop: Math.round(parseFloat(cs.marginTop) || 0),
        marginBottom: Math.round(parseFloat(cs.marginBottom) || 0),
        fontSize: Math.round(parseFloat(cs.fontSize) || 13)
      })
    }
    return curProperties
  }

  function adjustMargin() {
    setVisible()
    // 获取dom元素
    const targetElement = queryRenderCV()
    const curProperties = getProperties(targetElement)
    properties.length = 0
    properties.push(...curProperties)
  }

  function confirmAdjustment() {
    setVisible()
    let styleDOM = query(cacheKey),
      cssText = ''
    const isAppend = styleDOM

    if (!styleDOM) {
      styleDOM = createStyle()
      styleDOM.setAttribute(cacheKey, 'true')
    }
    for (const property of properties) {
      cssText += `.jufe ${property.selector} {margin-top: ${property.marginTop}px!important; margin-bottom: ${property.marginBottom}px!important; font-size: ${property.fontSize}px!important;}`
    }
    styleDOM.textContent = cssText
    priorityInsert(isAppend, styleDOM)
    set(cacheKey, cssText)
    const renderCV = queryRenderCV()
    ensureEmptyPreWhiteSpace(renderCV)
    splitPage(renderCV)
  }

  function priorityInsert(isAppend: Element | null, styleDOM: Element) {
    if (!isAppend) {
      // 插入到自动一页css前面 因为调整的优先级是最低的
      const autoOnePage = query(AUTO_ONE_PAGE + '-' + resumeType)
      const customCSS = query(CUSTOM_CSS_STYLE + '-' + resumeType)
      if (autoOnePage || customCSS) {
        const siblingStyle = autoOnePage || customCSS
        document.head.insertBefore(styleDOM, siblingStyle)
      } else {
        // 如果没有的话直接追加到head中
        document.head.appendChild(styleDOM)
      }
    }
  }

  function setVisible() {
    visible.value = !visible.value
  }
  // 进入页面读取历史样式 并初始化CSS
  function initAdjustCSS() {
    const adjustCSS = (get(cacheKey) as string) || ''
    if (!adjustCSS) return
    let styleDOM = query(cacheKey)
    const isAppend = styleDOM
    if (!styleDOM) {
      styleDOM = createStyle()
      styleDOM.setAttribute(cacheKey, 'true')
    }
    styleDOM.textContent = adjustCSS
    priorityInsert(isAppend, styleDOM)
  }
  // 如果页面中没有用户调整了的样式 那么就需要去初始化
  onActivated(() => !query(cacheKey) && initAdjustCSS())
  return { adjustMargin, visible, confirmAdjustment, properties }
}

// 跟随滚动
export function useFollowRoll() {
  const followRoll = ref(false)
  let destory: null | (() => void) = null
  function scrollHandler() {
    if (!followRoll.value) return null
    const wem = document.querySelector('.writable-edit-mode') as HTMLElement
    const cs = document.querySelector('.cm-scroller') as HTMLElement
    const render = document.querySelector('.markdown-render') as HTMLElement
    // const reallRenderHeight = document.querySelector('.jufe') as HTMLElement
    function wemcb() {
      if (followRoll.value) {
        render.scrollTop = render.scrollHeight * (wem.scrollTop / wem.scrollHeight)
      }
    }

    function cscb() {
      if (followRoll.value) {
        render.scrollTop = render.scrollHeight * (cs.scrollTop / cs.scrollHeight)
      }
    }

    cs?.addEventListener('scroll', cscb)
    wem?.addEventListener('scroll', wemcb)

    return () => {
      wem?.removeEventListener('scroll', wemcb)
      cs?.removeEventListener('scroll', cscb)
    }
  }
  function setFollowRoll() {
    destory && destory()
    destory = scrollHandler()
  }
  onMounted(setFollowRoll)
  return {
    followRoll,
    setFollowRoll
  }
}

// 分割视图
export function splitPage(renderCV: HTMLElement) {
  let page = 0,
    realHeight = 0
  const target = renderCV.clientHeight,
    reRender = document.querySelector('.re-render') as HTMLElement
  reRender.innerHTML = ''

  while (target - realHeight > 0) {
    const wrapper = createDIV(),
      resumeNode = renderCV.cloneNode(true) as HTMLElement
    wrapper.classList.add('jufe-wrapper-page')
    // 创建里面的内容 最小化高度
    const realRenderHeight = Math.min(target - realHeight, A4_HEIGHT)
    const wrapperItem = createDIV()
    wrapperItem.classList.add('jufe-wrapper-page-item')
    wrapperItem.style.height = realRenderHeight + 'px'

    resumeNode.style.position = 'absolute'
    resumeNode.style.top = -page * A4_HEIGHT + 'px'
    resumeNode.style.left = 0 + 'px'

    wrapperItem.appendChild(resumeNode)
    wrapper.appendChild(wrapperItem)

    realHeight += A4_HEIGHT
    page++
    reRender?.appendChild(wrapper)
  }
  pageSize.value = page
}

// 确保处理之前将之前的空元素删除 否则在多页情况下多次调用会多次生成空白占位符
export function ensureEmptyPreWhiteSpace(renderCV: HTMLElement) {
  const children = Array.from(renderCV.children) as HTMLElement[]
  for (const child of children) {
    if (child.getAttribute(WHITE_SPACE)) renderCV.removeChild(child)
    else {
      ensureEmptyPreWhiteSpace(child)
    }
  }
}
