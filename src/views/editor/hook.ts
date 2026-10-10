import { onActivated, onDeactivated, onMounted, Ref, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useDebounceFn } from '@vueuse/core'

import { getLocalStorage } from '@/common/localstorage'
import { errorMessage, successMessage, warningMessage } from '@/common/message'
import {
  download,
  downloadOfBuffer,
  importCSS,
  isDev,
  queryDOM,
  skinLinkMap,
  useLoading
} from '@/utils'
import { ensureEmptyPreWhiteSpace, splitPage } from './components/tabbar/hook'
import useEditorStore from '@/store/modules/editor'
import { resolveTemplateType } from '@/templates/config'
import { allOverlaysHTML, convertDOM } from '@/utils/moduleCombine'
import { resumeExport, setExportCount, setTemplateCondition } from '@/api/modules/resume'
import { fetchUserInfo } from '@/api/modules/cloudResume'
import {
  CUSTOM_CSS_STYLE,
  CUSTOM_MARKDOWN_PRIMARY_COLOR,
  CUSTOM_MARKDOWN_PRIMARY_BG_COLOR,
  MARKDOWN_FONT,
  ADJUST_RESUME_MARGIN_TOP,
  AUTO_ONE_PAGE,
  LINE_HEIGHT,
  FONT_SIZE,
  PARA_SPACING,
  JUSTIFY_TEXT
} from './components/tabbar/hook'

export const get = getLocalStorage,
  styleAttrs = [
    CUSTOM_MARKDOWN_PRIMARY_COLOR,
    CUSTOM_MARKDOWN_PRIMARY_BG_COLOR,
    MARKDOWN_FONT,
    LINE_HEIGHT,
    FONT_SIZE,
    PARA_SPACING,
    JUSTIFY_TEXT,
    ADJUST_RESUME_MARGIN_TOP, // priority 3 (数字越大 优先级越低)
    AUTO_ONE_PAGE, // priority 2
    CUSTOM_CSS_STYLE // priority 1
  ]

export function useRenderHTML(resumeType: Ref<string>) {
  const renderDOM = ref<HTMLElement>(document.body)
  const editorStore = useEditorStore()

  onMounted(() => importCSS(resumeType.value))
  onActivated(() => {
    importCSS(resumeType.value)
    renderDOM.value.innerHTML =
      convertDOM(editorStore.MDContent).innerHTML + allOverlaysHTML(resumeType.value)
    setTimeout(() => splitPage(renderDOM.value), 100)
  })

  // splitPage 需等 DOM 布局稳定且开销大：防抖到输入停顿后再分页（原实现每次击键新建 throttle 实例等于没节流）
  const lazySplitPage = useDebounceFn(() => splitPage(renderDOM.value), 200)
  watch(
    () => editorStore.MDContent,
    v => {
      renderDOM.value.innerHTML = convertDOM(v).innerHTML + allOverlaysHTML(resumeType.value)
      lazySplitPage()
    }
  )
  // 刷新页面（这里是一个比较有问题的点）
  watch(
    () => resumeType.value,
    () => {
      location.reload()
    }
  )
  return {
    renderDOM
  }
}

export function useResumeType() {
  const route = useRoute()
  // 实例键 = 解析后的模板 type + 保留 `~副本后缀`（内容/配置按实例隔离）
  const resolveKey = (v: unknown) => {
    if (!v) return '10front_end'
    const s = String(v)
    const [base, suffix] = s.split('~')
    return resolveTemplateType(base) + (suffix ? `~${suffix}` : '')
  }
  const resumeType = ref(resolveKey(route.query.type))
  onActivated(() => {
    resumeType.value = resolveKey(route.query.type)
  })
  return {
    resumeType
  }
}
// 导出简历｜markdown内容
export function useDownLoad(type: Ref<string>) {
  const editorStore = useEditorStore(),
    { showLoading, closeLoading } = useLoading()
  // 导出前处理PDF中的样式
  const exportPreHandler = async () => {
    const html = queryDOM('.jufe') as HTMLElement,
      htmlStyles = getComputedStyle(html)
    const resumeBgColor = `html,body { background: ${htmlStyles.getPropertyValue(
      'background'
    )}; font-size:${htmlStyles.getPropertyValue('font-size')}; }`
    const resetStyle = ` * { margin: 0; padding: 0; box-sizing: border-box; }`
    // 获取简历模板的样式
    let style = '',
      linkURL = 'none'
    if (isDev()) {
      // 生产环境使用动态导入 生产环境使用link的方式引入（解决生产default属性不暴露的问题）
      style = await importCSS(type.value)
    } else {
      // 先确保当前模板皮肤 chunk 已加载，再从映射取该模板确切的皮肤地址
      //（直接抓第一个 /css/style 链接会误中 iconfont 公共 chunk）
      await importCSS(type.value)
      linkURL =
        skinLinkMap[type.value] ||
        (document.querySelector('link[href*="/css/style"]') as HTMLLinkElement)?.href ||
        'none'
    }
    // 处理自定义生成的样式
    for (const attr of styleAttrs) {
      const styleContent = document.head.querySelector(
        `style[${CSS.escape(`${attr}-${type.value}`)}]`
      )?.textContent
      if (!styleContent) continue
      style += styleContent
    }
    style = resetStyle + resumeBgColor + style
    return { style, link: linkURL, content: html }
  }
  // 导出PDF & 图片 & Word
  const downloadDynamic = async (kind: 'pdf' | 'png' | 'docx', fileName?: string) => {
    const { content: html, style, link } = await exportPreHandler()
    const content = html.cloneNode(true) as HTMLElement
    // 相对路径的图片在远端无站点 base URL 的环境下无法加载，导出前统一绝对化
    content.querySelectorAll('img').forEach(img => {
      const src = img.getAttribute('src')
      if (src && !/^(https?:|data:|blob:)/.test(src)) img.src = new URL(src, location.origin).href
    })
    kind !== 'pdf' && ensureEmptyPreWhiteSpace(content)
    showLoading('正在导出请耐心等待...')
    try {
      const resData = await resumeExport({
        content: content.outerHTML,
        style,
        link,
        name: type.value,
        type: kind === 'pdf' ? 0 : kind === 'png' ? 1 : 2
      })
      const buffer =
        kind === 'pdf'
          ? resData.pdf.data
          : kind === 'png'
          ? resData.picture.data
          : resData.docx.data
      const ext = kind === 'pdf' ? '.pdf' : kind === 'png' ? '.png' : '.docx'
      const fileType =
        kind === 'pdf'
          ? 'application/pdf'
          : kind === 'png'
          ? 'image/png'
          : 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      downloadOfBuffer(buffer, (fileName || document.title) + ext, fileType)
      successMessage('导出成功～')
    } catch (e: any) {
      const errorMsg =
        e.message == 'Failed to fetch'
          ? '国内导出易出错 请重新尝试 有条件的打开梯子后重试或使用备用导出'
          : '导出出错 请先尝试备用导出方案'
      errorMessage(errorMsg)
    }
    closeLoading()
  }

  // PDF(备用)：生产同款原地 window.print——克隆预览 DOM 进 .codecv-print-only 覆盖层，
  // 移除编辑控件/数据属性，注入皮肤样式+水印栅格，@media print 只显示该层
  const downloadNative = async () => {
    const dom = queryDOM('.re-render .reference-dom') || queryDOM('.jufe')
    if (!dom) return
    const clone = (dom as HTMLElement).cloneNode(true) as HTMLElement
    clone
      .querySelectorAll('.resume-module .down,.resume-module .up,.remove-module')
      .forEach(el => el.remove())
    // 剥掉编辑态数据属性 + 绝对化图片路径
    const stripAttrs = (root: HTMLElement) => {
      for (const el of [root, ...Array.from(root.querySelectorAll<HTMLElement>('*'))]) {
        el.removeAttribute('data-md-line')
        for (const a of Array.from(el.attributes))
          if (a.name.startsWith('data-v-')) el.removeAttribute(a.name)
      }
    }
    stripAttrs(clone)
    clone.querySelectorAll('img').forEach(img => {
      const src = img.getAttribute('src')
      if (src && !/^(https?:|data:|blob:)/.test(src)) img.src = new URL(src, location.origin).href
    })

    // 打印层：克隆 + 皮肤样式 + 水印栅格（prod 同构 /codecv-assets/wm-raster.png）
    // 「移除水印」会员权益：有效会员导出跳过水印注入
    const { style, link } = await exportPreHandler()
    const info = await fetchUserInfo()
    const noWatermark =
      Number((info as { member_expires?: number } | null)?.member_expires || 0) > Date.now()
    const wrap = document.createElement('div')
    wrap.className = 'codecv-print-only'
    const linkTag = link !== 'none' ? `<link rel="stylesheet" href="${link}">` : ''
    wrap.innerHTML = `${linkTag}<style>${style}
.codecv-print-only .jufe{width:210mm;min-height:295mm;margin:0 auto;position:relative;}</style>`
    wrap.appendChild(clone)
    if (!noWatermark) {
      const wm = document.createElement('img')
      wm.src = `${location.origin}/codecv-assets/wm-raster.png`
      wm.style.cssText =
        'position:fixed;left:0;top:0;width:794px;height:1123px;z-index:2147483000;pointer-events:none'
      wrap.appendChild(wm)
    }
    document.body.appendChild(wrap)
    const cleanup = () => {
      window.removeEventListener('afterprint', cleanup)
      wrap.remove()
    }
    window.addEventListener('afterprint', cleanup)
    setExportCount()
    setTemplateCondition({ name: type.value })
    setTimeout(() => {
      window.print()
      setTimeout(cleanup, 1000) // 个别浏览器不触发 afterprint 的兜底
    }, 60)
  }

  const downloadMD = () => {
    const blob = new Blob([editorStore.MDContent])
    const url = URL.createObjectURL(blob)
    download(url, document.title + '.md')
    URL.revokeObjectURL(url)
    successMessage('导出成功~')
  }
  return {
    downloadMD,
    downloadDynamic,
    downloadNative
  }
}

export function useImportMD(resumeType: string) {
  function importMD(file: File) {
    const { writable } = useEditorStore()
    if (writable) {
      return warningMessage('请先切换到Markdown模式')
    }
    const reader = new FileReader(),
      { setMDContent } = useEditorStore()
    reader.readAsText(file, 'utf-8')
    reader.onload = function (event) {
      successMessage('导入成功~')
      setMDContent((event.target?.result as string) || '', resumeType)
    }
    reader.onerror = function () {
      errorMessage('导入失败!')
    }
  }
  return {
    importMD
  }
}

export function useAvatar(resumeType: string) {
  const matchAvatarSlot = /!\[个人头像\]\(.*\)/
  function setAvatar(path: string) {
    const { MDContent, setMDContent } = useEditorStore()
    if (!matchAvatarSlot.test(MDContent)) {
      warningMessage('上传前请确保你想上传的位置在编辑器中存在 ![个人头像](...) 此关键字')
      return
    }
    const newContent = MDContent.replace(matchAvatarSlot, `![个人头像](${path})`)
    setMDContent(newContent, resumeType)
    successMessage('头像上传成功，如果你想修改为网络图片，你可直接修改对应的链接！')
    // 可能还需要处理可编辑模式中的头像
    const writableDOM = document.querySelector('.writable-edit-mode')
    if (writableDOM) {
      const avatar: HTMLImageElement | null = writableDOM.querySelector('img[alt*=个人头像]')
      avatar && (avatar.src = path)
    }
  }
  return {
    setAvatar
  }
}

export const clickedTarget = ref<HTMLElement | null>()

export function ensureResetClickedTarget() {
  clickedTarget.value = null
}

// 备用导出按钮
export function useShowExport() {
  const showExport = ref(false)

  function setShowExport() {
    const scrollTop = document.body.getBoundingClientRect().top
    if (Math.abs(scrollTop) > 50 && window.innerWidth > 600) {
      showExport.value = true
    } else {
      showExport.value = false
    }
  }

  const onScroll = useDebounceFn(setShowExport, 400)

  onActivated(() => {
    document.addEventListener('scroll', onScroll)
  })

  onDeactivated(() => {
    document.removeEventListener('scroll', onScroll)
  })
  return {
    showExport
  }
}
