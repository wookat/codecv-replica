// 生产是 SSR 直出东八区时间；本站客户端渲染需固定 +8 偏移，使任意时区的访客看到与生产一致的时间
const pad = (n: number) => String(n).padStart(2, '0')

export const fmtCN = (ts: number | string, full = false): string => {
  const d = new Date(+ts + 8 * 3600 * 1000)
  const date = `${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`
  const time = `${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}`
  return full
    ? `${d.getUTCFullYear()}-${date} ${time}:${pad(d.getUTCSeconds())}`
    : `${date} ${time}`
}

export const fmtCNDate = (ts: number | string): string => {
  const d = new Date(+ts + 8 * 3600 * 1000)
  return `${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`
}
