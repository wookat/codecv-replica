import { ref } from 'vue'
import { TYPE_ORDER } from './order'
import { getLocalStorage } from '@/common/localstorage'

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

// URL 里的模板标识宽容解析：支持 type（agent_development）、slug（cv-agent-development）、
// 以及 slug 去掉 cv- 前缀（agent-development），统一回落到真实 type
export function resolveTemplateType(param: string): string {
  if (!param) return param
  param = param.split('~')[0] // 简历副本实例键 agent_development~m5x → 模板 agent_development
  const hit = templates.value.find(
    t =>
      t.type === param ||
      t.slug === param ||
      t.slug === `cv-${param}` ||
      t.type === param.replace(/-/g, '_')
  )
  return hit?.type ?? param
}

export type AvatarConfig = {
  url: string
  top: number
  left: number
  type?: string
  width?: number
}

// 生产数据把证件照作为模板层配置（url/top/left）下发，不属于 md 内容
export function getAvatarConfig(type: string): AvatarConfig | null {
  const base = type.split('~')[0]
  const av = templates.value.find(t => t.type === base)?.avatar
  // 用户上传的证件照配置（对照生产 cv.avatar {url,top,left,type}）——无模板默认也可生效
  try {
    const upRaw = getLocalStorage(`avatar-cfg-${type}`) as string | null
    if (upRaw) {
      const up = JSON.parse(upRaw)
      const cfg: AvatarConfig =
        typeof av === 'string'
          ? { url: av, top: 30, left: 660, type: 'square' }
          : { url: '', top: 30, left: 660, ...(av || {}) }
      Object.assign(cfg, {
        url: up.url || cfg.url,
        top: up.top ?? cfg.top ?? 30,
        left: up.left ?? cfg.left ?? 660,
        width: up.width ?? cfg.width,
        type: up.shape || cfg.type || 'square'
      })
      return cfg.url ? cfg : null
    }
  } catch {
    /* ignore */
  }
  if (!av) return null
  const cfg: AvatarConfig =
    typeof av === 'string' ? { url: av, top: 30, left: 660, type: 'square' } : { ...av }
  // 用户在编辑器内拖拽头像后持久化于 localStorage，叠加覆盖模板默认坐标
  try {
    const raw = getLocalStorage(`avatar_pos-${type}`) as string | null
    const pos = raw ? JSON.parse(raw) : null
    if (pos && typeof pos.top === 'number' && typeof pos.left === 'number') {
      cfg.top = pos.top
      cfg.left = pos.left
    }
  } catch {
    /* ignore */
  }
  return cfg
}

export function getPrimaryBGColor(type: string) {
  return initialCVState.get(type)?.[1] ?? '#333'
}

export function getPrimaryColor(type: string) {
  return initialCVState.get(type)?.[0] ?? '#000'
}

export function getFontFamily(type: string) {
  return initialCVState.get(type)?.[2] ?? ''
}
