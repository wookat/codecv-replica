import { post } from '../config'
import axios from 'axios'

/* ===== 校招岗位 ===== */
export interface JobQuery {
  batch?: string
  channel?: string
  title?: string
  company?: string
  workLocation?: string
  industry?: string
  positions?: string
  current: number
  pageSize: number
}

export interface JobItem {
  _id: string
  createTime: number
  updateTime: number
  company: string
  title: string
  workLocation: string
  industry: string
  positions: string
  channel: string
  referralMethod: string
  deadline?: string
  remarks?: string
  graduationYear?: number
  [k: string]: unknown
}

export function jobPage(query: JobQuery) {
  return post('/api/job/page', query) as Promise<{
    code: number
    data: JobItem[]
    total: number
    message: string
  }>
}

export function jobToday() {
  return post('/api/job/today', {}) as Promise<{ code: number; data: number; message: string }>
}

/* ===== 面经（GET 协议，与线上一致） ===== */
export interface MianjingItem {
  _id: string
  companySlug: string
  companyName: string
  positionSlug: string
  positionName: string
  grade: string | number
  batch: string
  round: string
  result: string
  title: string
  summary: string
  contentMd?: string
  questionCount?: string | number
  topicSlug?: string
  topicName?: string
  viewCount?: number
  likeCount?: number
  favCount?: number
  commentCount?: number
  publishTime?: number
  companyLogo?: string
  author?: { uid?: string; nickName?: string; avatar?: string; school?: string; major?: string }
  related?: { _id: string; title: string; viewCount?: number }[]
  [k: string]: unknown
}

export interface MianjingCompany {
  _id: string
  slug: string
  name: string
  aliases: string[]
  industry: string
  heat: number
  logo: string
}

export interface MianjingPosition {
  _id: string
  slug: string
  name: string
  category: string
  heat: number
}

async function getJson(path: string) {
  const base = (import.meta.env.VITE_BASE_URL as string) || ''
  const res = await axios.get(base + path)
  return res.data
}

export function mianjingList(
  query: Record<string, unknown> & { page?: number; current?: number; pageSize: number }
) {
  const { current, page, pageSize, ...rest } = query
  const params = new URLSearchParams()
  params.set('page', String(page ?? current ?? 1))
  params.set('pageSize', String(pageSize))
  Object.entries(rest).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== '') params.set(k, String(v))
  })
  return getJson(`/api/mianjing/list?${params}`) as Promise<{
    code: number
    data: MianjingItem[]
    total: number
    message: string
  }>
}

export function mianjingMeta(
  ep: 'companies' | 'positions' | 'topics' | 'stats' | 'company-facets' | 'topic-facets'
) {
  return getJson(`/api/mianjing/${ep}`) as Promise<{ code: number; data: any; message: string }>
}

export function mianjingDetail(id: string) {
  return getJson(`/api/mianjing/detail?id=${encodeURIComponent(id)}`) as Promise<{
    code: number
    data: MianjingItem
    message: string
  }>
}

/* ===== 求职攻略文章 ===== */
export interface PostItem {
  _id: string
  title: string
  description: string
  cover: string
  tags: string[]
  viewNum: number
  create_time: number
  content?: string
}

export function postPage(query: { current: number; pageSize: number; [k: string]: unknown }) {
  return post('/api/post/page', query) as Promise<{
    code: number
    data: PostItem[]
    total: number
    message: string
  }>
}

export function postDetail(id: string) {
  return getJson(`/api/post/detail?id=${encodeURIComponent(id)}`) as Promise<{
    code: number
    data: PostItem & { contentMd?: string }
    message: string
  }>
}
