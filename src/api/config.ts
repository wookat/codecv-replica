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
    errorMessage(response._data ?? response.statusText)
  }
})

// get method
export function get(url: string, params: any = {}) {
  return service(url, { method: 'GET', query: params }).catch(err => {
    errorMessage(Tip.NETWORK_ERROR)
    return Promise.reject(err)
  })
}
// post method
export function post(url: string, data: any = {}) {
  return service(url, { method: 'POST', body: data }).catch(err => {
    errorMessage(Tip.NETWORK_ERROR)
    return Promise.reject(err)
  })
}
