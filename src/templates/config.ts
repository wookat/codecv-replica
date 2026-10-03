import { ref } from 'vue'

const initialCVState: Map<string, string[]> = new Map()

// 创作模板的默认配置
initialCVState.set('create', ['#333', '#333', '', '25'])

type Module = {
  default: SubModule
}

type SubModule = {
  type: string
  id: number
  name: string
  font?: string
  lineHeight?: number
  content: string
  primaryColor: string
  primaryBackground: string
  img: string
  hot?: number | string
  slug?: string
  description?: string
  tags?: string[]
  level?: string
  avatar?: string
}
export type TemplateType = SubModule

export const templates = ref<SubModule[]>([])

const moduleEntries = Object.entries(import.meta.glob('./modules/*/index.ts', { eager: true }))

for (const [path, curModule] of moduleEntries) {
  const content = (curModule as Module).default
  content.id = Math.ceil(Math.random() * 1000000000)
  content.type = path.split('/')[2]
  templates.value.push(content)
  initialCVState.set(content.type, [
    content.primaryColor,
    content.primaryBackground,
    content.font || '',
    String(content.lineHeight || 25)
  ])
}

const match = (module: SubModule) => {
  // 数字前缀决定排序权重；生产期命名（如 agent_development）无前缀，按 0 处理保持插入序
  const m = module.type.match(/^\d+/)
  return m ? +m[0] : 0
}
templates.value.sort((a, b) => match(b) - match(a))

export function getPrimaryBGColor(type: string) {
  return initialCVState.get(type)?.[1] ?? '#333'
}

export function getPrimaryColor(type: string) {
  return initialCVState.get(type)?.[0] ?? '#000'
}

export function getFontFamily(type: string) {
  return initialCVState.get(type)?.[2] ?? ''
}
