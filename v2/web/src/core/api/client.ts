// 单一数据层 API client —— 所有模块只经这里读写（设计文档：单 DataStore）
const BASE = '/api/v2'

async function req<T>(path: string, init?: RequestInit): Promise<T> {
  const token = localStorage.getItem('v2:token')
  const res = await fetch(BASE + path, {
    ...init,
    headers: {
      'content-type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...init?.headers,
    },
  })
  if (!res.ok) throw new Error(`${res.status} ${await res.text()}`)
  return res.json()
}

export const api = {
  login: (username: string, password: string) =>
    req<{ token: string; username: string }>('/auth/login', { method: 'POST', body: JSON.stringify({ username, password }) }),
  register: (username: string, password: string, inviter?: string) =>
    req<{ token: string; username: string }>('/auth/register', { method: 'POST', body: JSON.stringify({ username, password, inviter }) }),
  masters: () => req<any[]>('/master'),
  createMaster: (name: string) => req<any>('/master', { method: 'POST', body: JSON.stringify({ name }) }),
  invites: () => req<any>('/invites'),
  progressList: () => req<any[]>('/progress'),
  addProgress: (b: any) => req<any>('/progress', { method: 'POST', body: JSON.stringify(b) }),
  updateProgress: (id: number, b: any) => req<any>(`/progress/${id}`, { method: 'PATCH', body: JSON.stringify(b) }),
  delProgress: (id: number) => req<any>(`/progress/${id}`, { method: 'DELETE' }),
  gallery: () => req<any[]>('/gallery'),
  posts: () => req<any[]>('/posts'),
  post: (id: string) => req<any>(`/posts/${id}`),
  commentPost: (id: string, content: string) => req<any>(`/posts/${id}/comments`, { method: 'POST', body: JSON.stringify({ content }) }),
  likePost: (id: string) => req<any>(`/posts/${id}/like`, { method: 'POST' }),
  mianjing: () => req<any[]>('/mianjing'),
  submitMianjing: (b: any) => req<any>('/mianjing', { method: 'POST', body: JSON.stringify(b) }),
  adminEvents: () => req<any[]>('/admin/events'),
  adminStats: () => req<any>('/admin/stats'),
  adminUsers: () => req<any[]>('/admin/users'),
  adminUpdateUser: (id: number, b: any) => req<any>(`/admin/users/${id}`, { method: 'PATCH', body: JSON.stringify(b) }),
  adminOrders: () => req<any[]>('/admin/orders'),
  adminMakeRedeem: (days: number, count: number) => req<{ codes: string[] }>('/admin/redeem', { method: 'POST', body: JSON.stringify({ days, count }) }),
  me: () => req<any>('/me'),
  orders: () => req<any[]>('/orders'),
  createOrder: (plan: string) => req<any>('/orders', { method: 'POST', body: JSON.stringify({ plan }) }),
  payOrder: (no: string) => req<any>(`/orders/${no}/pay`, { method: 'POST' }),
  redeem: (code: string) => req<any>('/redeem', { method: 'POST', body: JSON.stringify({ code }) }),
  favorites: () => req<string[]>('/favorites'),
  setFavorite: (tplId: string, on: boolean) => req<any>('/favorites', { method: 'PUT', body: JSON.stringify({ tplId, on }) }),
  migrateV1: () => req<{ migrated: number; total: number }>('/migrate/v1', { method: 'POST' }),
  masterChat: (messages: any[]) => req<any>('/master/chat', { method: 'POST', body: JSON.stringify({ messages }) }),
  jdGap: (masterId: string, jd: string) => req<any>('/jd/gap', { method: 'POST', body: JSON.stringify({ masterId, jd }) }),
  jdSelect: (masterId: string, jd: string) => req<any>('/jd/select', { method: 'POST', body: JSON.stringify({ masterId, jd }) }),
  me: () => req<any>('/me'),
  ai: (action: string, text: string, jd?: string) =>
    req<{ text: string }>('/ai', { method: 'POST', body: JSON.stringify({ action, text, jd }) }),
  importMaster: (b: { name?: string; filename: string; data: string }) =>
    req<any>('/master/import', { method: 'POST', body: JSON.stringify(b) }),
  items: (masterId: string) => req<any[]>(`/master/${masterId}/items`),
  createItem: (masterId: string, b: { section: string; title: string; sort?: number }) =>
    req<any>(`/master/${masterId}/items`, { method: 'POST', body: JSON.stringify(b) }),
  variants: (itemId: string) => req<any[]>(`/items/${itemId}/variants`),
  createVariant: (itemId: string, b: { label: string; contentMd: string }) =>
    req<any>(`/items/${itemId}/variants`, { method: 'POST', body: JSON.stringify(b) }),
  resumes: () => req<any[]>('/resumes'),
  resume: (id: string) => req<any>(`/resumes/${id}`),
  createResume: (b: { masterId?: string; templateId: string; title?: string; targetJd?: string }) =>
    req<any>('/resumes', { method: 'POST', body: JSON.stringify(b) }),
  updateResume: (id: string, b: { title?: string; contentMd?: string; templateId?: string; targetJd?: string }) =>
    req<any>(`/resumes/${id}`, { method: 'PATCH', body: JSON.stringify(b) }),
  deleteResume: (id: string) => req<any>(`/resumes/${id}`, { method: 'DELETE' }),
  saveExtras: (id: string, map: Record<string, string>) =>
    req<any>(`/resumes/${id}/extras`, { method: 'PUT', body: JSON.stringify(map) }),
  saveSelections: (id: string, list: { itemId: string; variantId?: string | null; ord: number }[]) =>
    req<any>(`/resumes/${id}/selections`, { method: 'PUT', body: JSON.stringify(list) }),
}
