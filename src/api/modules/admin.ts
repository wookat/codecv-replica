// 后台管理 API（/api/admin/*），全部需 admin 账号
import { getLocalStorage } from '@/common/localstorage'

const TOKEN_KEY = 'TOKEN'
const token = () => (getLocalStorage(TOKEN_KEY) as string) || ''

export const adGet = async (url: string) => {
  const res = await fetch(url, { headers: { Authorization: `Bearer ${token()}` } })
  return res.json()
}
export const adPost = async (url: string, body: object = {}) => {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token()}` },
    body: JSON.stringify(body)
  })
  return res.json()
}

const qs = (p: Record<string, unknown>) =>
  '?' +
  Object.entries(p)
    .filter(([, v]) => v !== undefined && v !== '')
    .map(([k, v]) => `${k}=${encodeURIComponent(String(v))}`)
    .join('&')

export const admin = {
  identity: () => adGet('/api/admin/identity'),
  statistics: () => adGet('/api/admin/statistics'),
  userPage: (p: { page?: number; pageSize?: number; keyword?: string }) =>
    adGet(`/api/admin/user/page${qs(p)}`),
  userGet: (id: number | string) => adGet(`/api/admin/user/get?id=${id}`),
  userEdit: (f: object) => adPost('/api/admin/user/edit', f),
  userBan: (id: number | string, reason: string) => adPost('/api/admin/user/ban', { id, reason }),
  userUnban: (id: number | string) => adPost('/api/admin/user/unban', { id }),
  userDelete: (id: number | string) => adPost('/api/admin/user/delete', { id }),
  resumePage: (p: { page?: number; pageSize?: number; keyword?: string }) =>
    adGet(`/api/admin/resume/page${qs(p)}`),
  resumeGet: (id: number | string) => adGet(`/api/admin/resume/get?id=${id}`),
  resumeStyle: (id: number | string) => adGet(`/api/admin/resume/style?id=${id}`),
  resumeAdd: (f: object) => adPost('/api/admin/resume/add', f),
  resumeEdit: (f: object) => adPost('/api/admin/resume/edit', f),
  resumeReview: (id: number | string, status: string) =>
    adPost('/api/admin/resume/review', { id, status }),
  resumeDelete: (id: number | string) => adPost('/api/admin/resume/delete', { id }),
  templatePage: (p: { page?: number; pageSize?: number; keyword?: string }) =>
    adGet(`/api/admin/template/page${qs(p)}`),
  templateDelete: (type: string) => adPost('/api/admin/template/delete', { type }),
  historyPage: (p: { page?: number; pageSize?: number }) =>
    adGet(`/api/admin/history/page${qs(p)}`),
  historyGet: (id: number | string) => adGet(`/api/admin/history/get?id=${id}`),
  historyRestore: (id: number | string) => adPost('/api/admin/history/restore', { id }),
  historyDelete: (id: number | string) => adPost('/api/admin/history/delete', { id }),
  postPage: (p: { page?: number; pageSize?: number; keyword?: string }) =>
    adGet(`/api/admin/post/page${qs(p)}`),
  postAdd: (f: object) => adPost('/api/admin/post/add', f),
  postEdit: (f: object) => adPost('/api/admin/post/edit', f),
  postDelete: (id: string) => adPost('/api/admin/post/delete', { _id: id }),
  mianjingPage: (p: { page?: number; pageSize?: number; keyword?: string; status?: string }) =>
    adGet(`/api/admin/mianjing/page${qs(p)}`),
  mianjingGet: (id: number | string) => adGet(`/api/admin/mianjing/get?id=${id}`),
  mianjingSave: (f: object) => adPost('/api/admin/mianjing/save', f),
  mianjingReview: (id: number | string, status: string) =>
    adPost('/api/admin/mianjing/review', { id, status }),
  mianjingComments: (p: { page?: number; pageSize?: number; doc?: string }) =>
    adGet(`/api/admin/mianjing/comments${qs(p)}`),
  commentDelete: (id: number) => adPost('/api/admin/comment/delete', { id }),
  mianjingDict: () => adGet('/api/admin/mianjing/dict'),
  mianjingSaveDict: (f: object) => adPost('/api/admin/mianjing/save-dict', f),
  mianjingUploadLogo: (slug: string, dataUrl: string) =>
    adPost('/api/admin/mianjing/upload-logo', { slug, dataUrl }),
  mianjingSeasons: () => adGet('/api/admin/mianjing/activity/seasons'),
  mianjingSettle: (id: number | string) => adPost('/api/admin/mianjing/activity/settle', { id }),
  orderPage: (p: { page?: number; pageSize?: number }) => adGet(`/api/admin/order/page${qs(p)}`),
  progressPage: (p: { page?: number; pageSize?: number }) =>
    adGet(`/api/admin/progress/page${qs(p)}`),
  invitePage: (p: { page?: number; pageSize?: number }) => adGet(`/api/admin/invite/page${qs(p)}`),
  adSpaces: () => adGet('/api/admin/advertiseSpace/query'),
  adSpaceSave: (f: object) => adPost('/api/admin/advertiseSpace/save', f),
  adSpaceDelete: (code: string) => adPost('/api/admin/advertiseSpace/delete', { code }),
  adQuery: (space?: string) => adGet(`/api/admin/advertise/query${space ? `?space=${space}` : ''}`),
  adSave: (f: object) => adPost('/api/admin/advertise/save', f),
  adDelete: (id: number | string) => adPost('/api/admin/advertise/delete', { id }),
  exportStats: () => adGet('/api/admin/export/stats'),
  exportEvents: (p: { page?: number; pageSize?: number }) =>
    adGet(`/api/admin/export/events${qs(p)}`),
  proofreadStats: () => adGet('/api/admin/proofread/stats'),
  proofreadEvents: (p: { page?: number; pageSize?: number }) =>
    adGet(`/api/admin/proofread/events${qs(p)}`),
  vipCodePage: (p: { page?: number; pageSize?: number }) =>
    adGet(`/api/admin/vipCode/page${qs(p)}`),
  vipCodeAll: () => adGet('/api/admin/vipCode/all'),
  vipCodeAdd: (f: { count?: number; days?: number }) => adPost('/api/admin/vipCode/add', f),
  vipCodeDelete: (code: string) => adPost('/api/admin/vipCode/delete', { code }),
  topicSave: (f: object) => adPost('/api/admin/topic/save', f),
  topicUploadCover: (id: number | string, dataUrl: string) =>
    adPost('/api/admin/topic/upload-cover', { id, dataUrl })
}
