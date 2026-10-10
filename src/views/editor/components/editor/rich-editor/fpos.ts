import { computePosition, flip, offset, shift } from '@floating-ui/dom'
import type { Placement, ReferenceElement, VirtualElement } from '@floating-ui/dom'
import { nextTick } from 'vue'

export interface FloatState {
  visible: boolean
  top: number
  left: number
}

export function rectEl(r: {
  top: number
  left: number
  right?: number
  bottom?: number
  width?: number
  height?: number
}): VirtualElement {
  const left = r.left
  const top = r.top
  const right = r.right ?? (r.width != null ? left + r.width : left)
  const bottom = r.bottom ?? (r.height != null ? top + r.height : top)
  return {
    getBoundingClientRect: () =>
      ({
        x: left,
        y: top,
        left,
        top,
        right,
        bottom,
        width: right - left,
        height: bottom - top
      } as DOMRect)
  }
}

/** 对已挂载元素计算落点（不入挂载流程，调用方自取 {top,left}） */
export async function posOf(
  ref: ReferenceElement | VirtualElement,
  el: HTMLElement | null | undefined,
  opts: { placement?: Placement; offset?: number } = {}
): Promise<{ top: number; left: number } | null> {
  if (!el) return null
  const { placement = 'bottom-start', offset: off = 8 } = opts
  const { x, y } = await computePosition(ref, el, {
    placement,
    middleware: [offset(off), flip({ padding: 8 }), shift({ padding: 8 })]
  })
  return { top: Math.round(y), left: Math.round(x) }
}

/**
 * 挂载后以 floating-ui 精确定位固定菜单（flip 下方放不下翻上方 + shift 防出屏）。
 * state 先置屏外坐标，渲染后量取真实菜单尺寸再落位。
 */
export async function placeMenu(
  state: FloatState,
  floating: () => HTMLElement | null | undefined,
  ref: ReferenceElement | VirtualElement,
  opts: { placement?: Placement; offset?: number } = {}
): Promise<void> {
  const { placement = 'bottom-start', offset: off = 8 } = opts
  state.top = -9999
  state.left = -9999
  state.visible = true
  await nextTick()
  const el = floating()
  if (!el || !state.visible) return
  const { x, y } = await computePosition(ref, el, {
    placement,
    middleware: [offset(off), flip({ padding: 8 }), shift({ padding: 8 })]
  })
  if (!state.visible) return
  state.top = Math.round(y)
  state.left = Math.round(x)
}
