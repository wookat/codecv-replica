export interface IResumeConfig {
  content: string
  style: string
  link: string
  name: string
  type?: number
}

export async function resumeExport(data: IResumeConfig) {
  const res = await fetch(import.meta.env.VITE_EXPORT_URL as string, {
    method: 'POST',
    body: JSON.stringify(data)
    // headers: {
    //   'Content-Type': 'application/json'
    // }
  })
  return await res.json()
}

// 全站累计导出：对照生产 /api/export/queryCount|incCount（本地 KV 桩已废弃）
export function getExportCount() {
  return new Promise(resolve => {
    fetch('/api/export/queryCount')
      .then(response => response.json())
      .then(data => resolve(data.result))
      .catch(() => resolve('0'))
  })
}

export async function setExportCount() {
  fetch('/api/export/incCount', { method: 'POST', body: '{}' }).catch(() => undefined)
  return Promise.resolve('ok')
}

// 模板下载计数：对照生产 template/stats——以 export_events 聚合，不再走 Upstash
export async function getTemplateCondition() {
  const res = await fetch('/api/template/stats')
  return await res.json()
}

export async function setTemplateCondition(params: { name: string }) {
  fetch('/api/export/incCount', {
    method: 'POST',
    body: JSON.stringify({ type: params.name })
  }).catch(() => undefined)
  return Promise.resolve({ msg: 'ok', result: null })
}
// 获取 Gitee 仓库 star 数量
export function queryGiteeRepoStars() {
  return new Promise(resolve => {
    fetch(import.meta.env.VITE_GITEE_API_URL as string)
      .then(res => res.json())
      .then(data => {
        // 获取仓库 star 数量
        resolve(data)
      })
      .catch(() => resolve([]))
  })
}
