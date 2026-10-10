import useEditorStore from '@/store/modules/editor'
import { Ref, computed, nextTick, onActivated, onDeactivated, ref, watchEffect } from 'vue'
import { linkFlag, selectIcon } from './toolbar/hook'
import { clickedTarget } from '../../hook'
import { setClickedLinkText, setClickedLinkURL } from './toolbar/components/linkInput/hook'
import { getPickerFile } from '@/utils/uploader'
import { queryDOM } from '@/utils'
import { getLocalStorage, setLocalStorage } from '@/common/localstorage'

export function reactiveWritable(resumeType: string) {
  const editorStore = useEditorStore()
  editorStore.initMDContent(resumeType)
  const writable = computed(() => editorStore.writable)
  return {
    writable
  }
}

// 左右移动伸缩布局
export function useMoveLayout() {
  // 生产版左栏默认宽 500px（1440 视口下实测），可拖动伸缩；窄视口收敛到可用范围
  const fitWidth = () => Math.min(500, Math.max(280, window.innerWidth - 40))
  const left = ref(fitWidth())
  let flag = false

  const clamp = (v: number) => Math.min(Math.max(280, v), window.innerWidth - 24)
  function move(event: MouseEvent | TouchEvent) {
    if (!flag) return
    const x = 'touches' in event ? event.touches[0]?.clientX ?? 0 : event.clientX
    left.value = clamp(x - 15)
  }

  function down() {
    document.body.classList.add('no-select')
    flag = true
  }

  function up() {
    document.body.classList.remove('no-select')
    flag = false
  }

  function onResize() {
    left.value = clamp(left.value)
  }

  onActivated(() => {
    window.addEventListener('mouseup', up)
    window.addEventListener('mousemove', move)
    window.addEventListener('touchend', up)
    window.addEventListener('touchmove', move, { passive: true })
    window.addEventListener('resize', onResize)
  })

  onDeactivated(() => {
    window.removeEventListener('mouseup', up)
    window.removeEventListener('mousemove', move)
    window.removeEventListener('touchend', up)
    window.removeEventListener('touchmove', move)
    window.removeEventListener('resize', onResize)
  })
  return { left, down }
}

// 证件照/校徽覆盖层拖拽：预览纸面内按住图片拖动重新定位（生产同款）
// 位置持久化：头像 → avatar_pos-<type>（getAvatarConfig 读取覆盖），校徽 → badge_config-<type>
export function useOverlayDrag(resumeType: Ref<string>) {
  function down(e: MouseEvent) {
    const img = (e.target as HTMLElement).closest?.(
      '.cv-avatar-overlay,.cv-badge-overlay'
    ) as HTMLImageElement | null
    if (!img) return
    e.preventDefault()
    e.stopPropagation()
    // 纸面有缩放：位移按宿主元素实际缩放比换算
    const host = img.closest('.markdown-transform-html,.writable-edit-mode,.jufe') as HTMLElement
    const scale =
      host && host.offsetWidth ? host.getBoundingClientRect().width / host.offsetWidth : 1
    const rect = img.getBoundingClientRect()
    // 生产同款缩放：命中图右下角 14px 热区 → 拖宽（证件照/校徽均可缩放）
    const nearCorner =
      Math.abs(e.clientX - rect.right) <= 14 && Math.abs(e.clientY - rect.bottom) <= 14
    const sx = e.clientX,
      sy = e.clientY
    const bt = parseFloat(img.style.top) || 0,
      bl = parseFloat(img.style.left) || 0
    const bw = parseFloat(img.style.width) || img.offsetWidth || 0
    if (nearCorner && bw) {
      e.preventDefault()
      const moveR = (ev: MouseEvent) => {
        const w = Math.max(16, bw + (ev.clientX - sx) / (scale || 1))
        img.style.width = w + 'px'
        img.style.height = 'auto'
      }
      const upR = (ev: MouseEvent) => {
        window.removeEventListener('mousemove', moveR)
        window.removeEventListener('mouseup', upR)
        const w = Math.round(Math.max(16, bw + (ev.clientX - sx) / (scale || 1)))
        img.style.width = w + 'px'
        const isBadge = img.classList.contains('cv-badge-overlay')
        const cfgKey = isBadge
          ? `badge_config-${resumeType.value}`
          : `avatar-cfg-${resumeType.value}`
        const raw = getLocalStorage(cfgKey) as string | null
        if (!raw) return
        try {
          const cfg = JSON.parse(raw)
          cfg.width = w
          setLocalStorage(cfgKey, JSON.stringify(cfg))
        } catch {
          /* ignore */
        }
      }
      window.addEventListener('mousemove', moveR)
      window.addEventListener('mouseup', upR)
      return
    }
    const move = (ev: MouseEvent) => {
      img.style.top = bt + (ev.clientY - sy) / (scale || 1) + 'px'
      img.style.left = bl + (ev.clientX - sx) / (scale || 1) + 'px'
    }
    const up = (ev: MouseEvent) => {
      window.removeEventListener('mousemove', move)
      window.removeEventListener('mouseup', up)
      const top = Math.round(bt + (ev.clientY - sy) / (scale || 1))
      const left = Math.round(bl + (ev.clientX - sx) / (scale || 1))
      img.style.top = top + 'px'
      img.style.left = left + 'px'
      const isBadge = img.classList.contains('cv-badge-overlay')
      const cfgKey = isBadge ? `badge_config-${resumeType.value}` : `avatar-cfg-${resumeType.value}`
      const existing = getLocalStorage(cfgKey) as string | null
      if (existing) {
        try {
          const cfg = JSON.parse(existing)
          cfg.top = top
          cfg.left = left
          setLocalStorage(cfgKey, JSON.stringify(cfg))
          return
        } catch {
          /* ignore */
        }
      }
      if (!isBadge) {
        // 模板默认头像的拖拽位置走 avatar_pos 覆盖（getAvatarConfig 读取）
        setLocalStorage(`avatar_pos-${resumeType.value}`, JSON.stringify({ top, left }))
      }
    }
    window.addEventListener('mousemove', move)
    window.addEventListener('mouseup', up)
  }
  document.addEventListener('mousedown', down)
  onDeactivated(() => document.removeEventListener('mousedown', down))
}

export function injectWritableModeAvatarEvent(
  writable: Ref<boolean>,
  setAvatar: (path: string) => void
) {
  watchEffect(() => {
    if (!writable.value) return
    nextTick(() => {
      const node = queryDOM('.writable-edit-mode') as HTMLElement
      setTimeout(() => {
        const avatar = node.querySelector('img[alt*="个人头像"]')
        if (avatar) {
          avatar.addEventListener('click', async function () {
            const file = await getPickerFile({
              multiple: false,
              accept: 'image/png, image/jpeg,image/jpg, '
            })
            const reader = new FileReader()
            reader.readAsDataURL(file) // 暂时使用base64方案
            reader.onload = function (event) {
              setAvatar(event.target?.result as string)
            }
          })
        }

        injectWritableModeClickedReplace(node)
      })
    })
  })
}

export function injectWritableModeClickedReplace(parentNode: HTMLElement) {
  parentNode.addEventListener('click', (event: Event) => {
    const target = event.target as HTMLElement,
      className = target.className,
      tagName = target.tagName.toLocaleLowerCase()
    if (className.includes('iconfont')) {
      selectIcon.value = !selectIcon.value
      clickedTarget.value = target
    } else if (tagName === 'a') {
      linkFlag.value = !linkFlag.value
      setClickedLinkText(target)
      setClickedLinkURL(target)
      clickedTarget.value = target
    }
  })
}
