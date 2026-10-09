import { getLocalStorage } from '@/common/localstorage'
import { TOKEN } from '@/store/modules/user'
import { errorMessage } from '../common/message'

interface IUploadOptions {
  multiple: boolean
  accept: string
}
export function getPickerFile(options: IUploadOptions) {
  const fileInput = document.createElement('input')
  fileInput.setAttribute('type', 'file')
  fileInput.setAttribute('accept', options.accept)
  fileInput.style.cssText = 'position: absolute; left: -9999px; top: -9999px; opacity: 0'
  fileInput.multiple = options.multiple
  const promise = new Promise<File>(function (resolve) {
    fileInput.addEventListener('change', async function (event) {
      document.body.removeChild(fileInput)
      try {
        const files = (event.target as HTMLInputElement).files as FileList
        resolve(files[0])
      } catch (e) {
        errorMessage(<string>e)
      }
    })
  })
  document.body.appendChild(fileInput)
  fileInput.click()
  return promise
}

const IMAGE_ACCEPT = '.png,.jpg,.jpeg,.webp'

// 选图 → 上传 /api/upload（KV）；未登录或上传失败时回落 dataURL。返回 null 表示用户取消
export async function pickAndUploadImage(accept = IMAGE_ACCEPT): Promise<string | null> {
  const file = await getPickerFile({ multiple: false, accept })
  if (!file) return null
  const token = (getLocalStorage(TOKEN) as string) || ''
  try {
    const fd = new FormData()
    fd.append('file', file)
    const res = await fetch('/api/upload', {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      body: fd
    })
    if (res.ok) {
      const data = await res.json()
      if (data.code === 200 && data.url) return data.url as string
    }
  } catch {
    /* fall back to dataURL */
  }
  return await new Promise<string>((resolve, reject) => {
    const fr = new FileReader()
    fr.onload = () => resolve(String(fr.result))
    fr.onerror = reject
    fr.readAsDataURL(file)
  })
}
