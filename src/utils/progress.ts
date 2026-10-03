/* 投递进度 — 未登录先落 localStorage（与线上一致的 pending-apply 行为），登录后由后端接管 */
export type ProgressStatus =
  | '待投递'
  | '已投递'
  | '筛选中'
  | '笔试'
  | '一面'
  | '二面'
  | '三面'
  | '四面'
  | 'HR面'
  | '终面'
  | 'Offer'
  | '流程终止'

export const PROGRESS_STATUSES: ProgressStatus[] = [
  '待投递',
  '已投递',
  '筛选中',
  '笔试',
  '一面',
  '二面',
  '三面',
  '四面',
  'HR面',
  '终面',
  'Offer',
  '流程终止'
]

export const PROGRESS_NEXT: ProgressStatus[] = PROGRESS_STATUSES.slice(1) as ProgressStatus[]

export function statusColor(s: ProgressStatus | string): string {
  if (!s) return '#909399'
  if (s === 'Offer') return '#67C23A'
  if (s === '流程终止') return '#F56C6C'
  if (s === '待投递' || s === '笔试') return '#E6A23C'
  if (s.endsWith('面')) return '#409EFF'
  return '#909399'
}

export interface ProgressRecord {
  _id: string
  status: ProgressStatus
  update_time: number
  snapshot?: JobSnapshot
}

export interface JobSnapshot {
  company: string
  title: string
  positions: string
  industry: string
  channel: string
  workLocation: string
  referralMethod: string
  deadline: string
}

const KEY = 'pending-apply'

interface PendingEntry {
  job_id: string
  status?: ProgressStatus
  update_time?: number
  snapshot?: JobSnapshot
}

function readAll(): PendingEntry[] {
  try {
    const raw = localStorage.getItem(KEY)
    const arr = raw ? JSON.parse(raw) : []
    return Array.isArray(arr) ? arr : []
  } catch {
    return []
  }
}

function writeAll(list: PendingEntry[]) {
  localStorage.setItem(KEY, JSON.stringify(list))
}

/** job_id -> ProgressRecord 映射，与线上 p.value 同构 */
export function progressMap(): Record<string, ProgressRecord> {
  const map: Record<string, ProgressRecord> = {}
  for (const e of readAll()) {
    if (!e.job_id) continue
    map[e.job_id] = {
      _id: e.job_id,
      status: e.status ?? '待投递',
      update_time: e.update_time ?? Date.now(),
      snapshot: e.snapshot
    }
  }
  return map
}

export function upsertProgress(jobId: string, status: ProgressStatus, snapshot?: JobSnapshot) {
  const list = readAll()
  const hit = list.find(e => e.job_id === jobId)
  if (hit) {
    hit.status = status
    hit.update_time = Date.now()
    if (snapshot) hit.snapshot = snapshot
  } else {
    list.push({ job_id: jobId, status, update_time: Date.now(), snapshot })
  }
  writeAll(list)
}

export function removeProgress(jobId: string) {
  writeAll(readAll().filter(e => e.job_id !== jobId))
}

export function hasProgress(jobId: string): boolean {
  return readAll().some(e => e.job_id === jobId)
}

/* 渠道色板（与线上 channel-Cg8PFnfg 一致） */
const CHANNEL_COLORS: Record<string, { bg: string; color: string; border: string }> = {
  校招: { bg: '#FDE2E2', color: '#E64A19', border: '#F5A9A9' },
  暑期实习: { bg: '#E2F0D9', color: '#558B2F', border: '#A5D6A7' },
  日常实习: { bg: '#D4EDFC', color: '#1565C0', border: '#90CAF9' },
  秋招: { bg: '#FFF3E0', color: '#E65100', border: '#FFCC80' },
  春招: { bg: '#F3E5F5', color: '#7B1FA2', border: '#CE93D8' },
  社招: { bg: '#E0F2F1', color: '#00695C', border: '#80CBC4' },
  内推: { bg: '#FFF8E1', color: '#F57F17', border: '#FFE082' },
  实习: { bg: '#E8F5E9', color: '#2E7D32', border: '#81C784' },
  招聘: { bg: '#E3F2FD', color: '#1565C0', border: '#64B5F6' }
}

const FALLBACK = [
  { bg: '#E3F2FD', color: '#1976D2', border: '#90CAF9' },
  { bg: '#FFF3E0', color: '#F57C00', border: '#FFCC80' },
  { bg: '#FCE4EC', color: '#C2185B', border: '#F48FB1' },
  { bg: '#E8F5E8', color: '#388E3C', border: '#A5D6A7' },
  { bg: '#F3E5F5', color: '#7B1FA2', border: '#CE93D8' }
]

export function channelStyle(name?: string) {
  if (!name) return { backgroundColor: '#F5F5F5', color: '#999', borderColor: '#E0E0E0' }
  const hit = CHANNEL_COLORS[name]
  const c = hit ?? FALLBACK[Math.abs(hash(name)) % FALLBACK.length]
  return { backgroundColor: c.bg, color: c.color, border: `1px solid ${c.border}` }
}

/* 工作地点色板（15 色，与线上一致） */
const LOC_PALETTE = [
  { bg: '#E3F2FD', color: '#1976D2' },
  { bg: '#FFF3E0', color: '#F57C00' },
  { bg: '#FCE4EC', color: '#C2185B' },
  { bg: '#E8F5E8', color: '#388E3C' },
  { bg: '#F3E5F5', color: '#7B1FA2' },
  { bg: '#FFF8E1', color: '#F9A825' },
  { bg: '#E0F2F1', color: '#00796B' },
  { bg: '#EFEBE9', color: '#5D4037' },
  { bg: '#E1F5FE', color: '#0277BD' },
  { bg: '#F1F8E9', color: '#689F38' },
  { bg: '#FDF2E9', color: '#E65100' },
  { bg: '#F3E5F5', color: '#8E24AA' },
  { bg: '#E8EAF6', color: '#3F51B5' },
  { bg: '#FFF3E0', color: '#FF8F00' },
  { bg: '#E0F7FA', color: '#00ACC1' }
]

function hash(s: string): number {
  let h = 0
  for (let i = 0; i < s.length; i++) {
    h = (h << 5) - h + s.charCodeAt(i)
    h = h & h
  }
  return h
}

export function locationStyle(name: string) {
  const c = LOC_PALETTE[Math.abs(hash(name)) % LOC_PALETTE.length]
  return { backgroundColor: c.bg, color: c.color }
}

export function splitTags(v?: string): string[] {
  if (!v || v === '-') return []
  return v
    .split(/[,、\s]+/)
    .map(t => t.trim())
    .filter(Boolean)
}
