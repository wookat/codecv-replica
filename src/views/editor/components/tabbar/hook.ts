import { getLocalStorage, removeLocalStorage, setLocalStorage } from '@/common/localstorage'
import { createStyle, query, removeHeadStyle, convert, createDIV } from '@/utils'
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

export function setStep(val: number | any) {
  step.value = val
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
  const fontOptions = [
    {
      value: 'Noto Serif SC',
      label: '思源宋体'
    },
    {
      value: 'Noto Sans SC',
      label: '思源黑体'
    },
    {
      value: 'Nunito',
      label: 'Nunito(英文)'
    }
  ]
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

// 行距（px 步进，作用于纸面文本行高）
export function useLineHeight(resumeType: string) {
  const cacheKey = LINE_HEIGHT + '-' + resumeType
  const match = ((get(cacheKey) as string) || '').match(/line-height:\s*([\d.]+)px/)
  const lineHeight = ref(match ? Number(match[1]) : 30)

  function apply(n: number) {
    lineHeight.value = n
    upsertPersistStyle(cacheKey, `.jufe * { line-height: ${n}px !important; }`)
    reSplit()
  }
  onActivated(() => restorePersistStyle(cacheKey))
  return { lineHeight, applyLineHeight: apply }
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

// 智能一页：逐级缩字号+行距直到装进一页
export function useOnePage(resumeType: string) {
  const cacheKey = AUTO_ONE_PAGE + '-' + resumeType,
    onePageApplied = ref(!!query(cacheKey) || !!get(cacheKey))

  function applyShrink(baseSize: number) {
    upsertPersistStyle(
      cacheKey,
      `.jufe { font-size: ${baseSize}px !important; } .jufe * { line-height: ${Math.round(
        baseSize * 1.7
      )}px !important; }`
    )
    reSplit()
  }

  function smartOnePage() {
    const renderCV = queryRenderCV()
    if (!renderCV) return
    if (pageSize.value <= 1) {
      onePageApplied.value = true
      return
    }
    const cur = parseFloat(getComputedStyle(renderCV).fontSize) || 15
    for (let size = cur - 0.5; size >= 10; size -= 0.5) {
      applyShrink(size)
      if (pageSize.value <= 1) {
        onePageApplied.value = true
        return
      }
    }
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

// 调节元素边距
export function useAdjust(resumeType: string) {
  const visible = ref(false)
  const properties = reactive<IElementProperty[]>([])
  const cacheKey = ADJUST_RESUME_MARGIN_TOP + '-' + resumeType
  interface IElementProperty {
    name: string
    marginTop: number
    marginBottom: number
    tagName: string
    className: string
  }

  function getProperties(element: HTMLElement): IElementProperty[] {
    const curProperties: IElementProperty[] = []
    const seenTags = new Set<string>() // 用于记录已经处理过的标签名
    const seenClassNames = new Set<string>() // 用于记录已经处理过的类名

    function helper(el: HTMLElement) {
      if (el !== element) {
        const computedStyle = window.getComputedStyle(el) // 获取计算后的样式
        const marginTop = parseInt(computedStyle.marginTop) // 获取 marginTop 值
        const marginBottom = parseInt(computedStyle.marginBottom)
        const tagName = el.tagName.toLowerCase() // 获取标签名，转换为小写
        const className = el.className.split(' ')[0] || '' // 获取类名，如果没有则用 'No Class' 代替
        const name = convert(className || tagName)

        // 判断标签名和类名是否已经处理过，如果没有，则将其加入结果数组，并添加到 seenTags 和 seenClassNames 集合中
        if (!seenTags.has(tagName) || !seenClassNames.has(className)) {
          curProperties.push({ tagName, name, marginBottom, marginTop, className })
          seenTags.add(tagName)
          seenClassNames.add(className)
        }
      }
      // 遍历当前元素的所有子节点，并递归调用该函数
      const children = el.children
      for (let i = 0; i < children.length; i++) helper(children[i] as HTMLElement)
    }

    helper(element) // 调用递归函数开始获取 marginTop 和 lineHeight 值
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
      const target = property.className ? `.${property.className}` : property.tagName
      cssText += `.jufe ${target} {margin-top: ${property.marginTop}px!important; margin-bottom: ${property.marginBottom}px!important;}`
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
