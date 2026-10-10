import { createApp, h } from 'vue'
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

// prod 同款 croppie 裁剪：裁剪确认后返回 Blob，取消返回 null
function cropFile(file: File): Promise<Blob | null> {
  return new Promise(resolve => {
    const host = document.createElement('div')
    document.body.appendChild(host)
    const url = URL.createObjectURL(file)
    import('@/components/ImageCropper.vue').then(({ default: Cropper }) => {
      const cleanup = (blob: Blob | null) => {
        app.unmount()
        host.remove()
        URL.revokeObjectURL(url)
        resolve(blob)
      }
      const app = createApp({
        render: () =>
          h(Cropper, {
            src: url,
            onDone: (b: Blob) => cleanup(b),
            onCancel: () => cleanup(null)
          })
      })
      app.mount(host)
    })
  })
}

function fileToDataURL(file: File | Blob): Promise<string> {
  return new Promise<string>((resolve, reject) => {
    const fr = new FileReader()
    fr.onload = () => resolve(String(fr.result))
    fr.onerror = reject
    fr.readAsDataURL(file)
  })
}

// 选图 → 上传 /api/upload（KV）；未登录或上传失败时回落 dataURL。返回 null 表示用户取消
// opts.crop=true 时先弹裁剪层（证件照/头像等需要构图的场景）
export async function pickAndUploadImage(
  accept = IMAGE_ACCEPT,
  opts?: { crop?: boolean; viewport?: { width: number; height: number } }
): Promise<string | null> {
  const picked = await getPickerFile({ multiple: false, accept })
  if (!picked) return null
  let file: File | Blob = picked
  let fileName = picked.name
  if (opts?.crop) {
    const blob = await cropFile(picked)
    if (!blob) return null
    file = blob
    fileName = picked.name.replace(/\.[^.]+$/, '') + '.png'
  }
  const token = (getLocalStorage(TOKEN) as string) || ''
  try {
    const fd = new FormData()
    fd.append('file', file, fileName)
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
  return await fileToDataURL(file)
}
