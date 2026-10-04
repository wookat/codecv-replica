import { ref } from 'vue'
import { TYPE_ORDER } from './order'

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
  date?: string
  avatar?: string | { url: string; top: number; left: number; type?: string }
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

// 「综合排序」与生产一致：index.json 数组序（非热度/数字前缀序）
const ORDER = new Map(TYPE_ORDER.map((t, i) => [t, i]))
templates.value.sort((a, b) => (ORDER.get(a.type) ?? 9999) - (ORDER.get(b.type) ?? 9999))

export function getPrimaryBGColor(type: string) {
  return initialCVState.get(type)?.[1] ?? '#333'
}

export function getPrimaryColor(type: string) {
  return initialCVState.get(type)?.[0] ?? '#000'
}

export function getFontFamily(type: string) {
  return initialCVState.get(type)?.[2] ?? ''
}
