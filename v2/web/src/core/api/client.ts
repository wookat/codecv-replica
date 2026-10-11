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
  masters: () => req<any[]>('/master'),
  createMaster: (name: string) => req<any>('/master', { method: 'POST', body: JSON.stringify({ name }) }),
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
  saveSelections: (id: string, list: { itemId: string; variantId?: string | null; ord: number }[]) =>
    req<any>(`/resumes/${id}/selections`, { method: 'PUT', body: JSON.stringify(list) }),
}
