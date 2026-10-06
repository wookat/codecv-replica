// admin 页面通用：分页表数据加载
import { onMounted, ref } from 'vue'

type Fetcher = (p: { page: number; pageSize: number; keyword?: string }) => Promise<any>

export function useAdminPage(fetcher: Fetcher, pageSize = 20) {
  const rows = ref<any[]>([])
  const total = ref(0)
  const page = ref(1)
  const keyword = ref('')
  const loading = ref(false)

  async function load() {
    loading.value = true
    try {
      const res = await fetcher({
        page: page.value,
        pageSize,
        keyword: keyword.value || undefined
      })
      if (res?.code === 200) {
        const d = res.data
        rows.value = d?.list ?? d ?? []
        total.value = d?.total ?? rows.value.length
      }
    } finally {
      loading.value = false
    }
  }
  function search() {
    page.value = 1
    load()
  }
  function changePage(p: number) {
    page.value = p
    load()
  }
  onMounted(load)
  return { rows, total, page, keyword, loading, load, search, changePage }
}

export const fmtTime = (ts?: number) =>
  ts ? new Date(ts).toLocaleString('zh-CN', { hour12: false, timeZone: 'Asia/Shanghai' }) : '-'
