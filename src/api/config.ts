import { ofetch } from 'ofetch'

import { Tip } from '@/common/tip'
import { errorMessage } from '@/common/message'
import { getLocalStorage } from '@/common/localstorage'

const service = ofetch.create({
  baseURL: (import.meta.env.VITE_BASE_URL as string) || undefined,
  timeout: 5000,
  credentials: 'include',
  onRequest({ options }) {
    const token = getLocalStorage('TOKEN') as string
    if (token) {
      const headers = new Headers(options.headers)
      headers.set('Authorization', `Bearer ${token}`)
      options.headers = headers
    }
  },
  onResponseError({ response }) {
    const d = response._data
    // 后端错误体形如 {code,message}——只弹一次服务端文案，不能 [object Object]
    errorMessage(
      typeof d === 'object' && d !== null ? d.message || response.statusText : d || response.statusText
    )
  }
})

// get method
// HTTP 错误（带 response）已由 onResponseError 报过——这里只兜真网络失败，避免双 toast
function networkFail(err: any) {
  if (!err?.response) errorMessage(Tip.NETWORK_ERROR)
  return Promise.reject(err)
}
// get method
export function get(url: string, params: any = {}) {
  return service(url, { method: 'GET', query: params }).catch(networkFail)
}
// post method
export function post(url: string, data: any = {}) {
  return service(url, { method: 'POST', body: data }).catch(networkFail)
}
