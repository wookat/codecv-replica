import { markdownToHTML } from './index'

export function fontMark(html: string): string {
  return html.replace(
    /!(bg|c)<a href=(#[0-9a-fA-F]{3,8})>([\s\S]*?)<\/a>/g,
    (_, kind, color, text) => kind === 'bg'
      ? `<span class="font-bg" style="background:${color}">${text}</span>`
      : `<span style="color:${color}">${text}</span>`
  )
}

export function convertResumeDOM(markdown: string, owner: Document = document): HTMLDivElement {
  const fragment = owner.createElement('div')
  fragment.innerHTML = fontMark(markdownToHTML(markdown))
  const main = fragment.querySelector('.main-layout')
  const source = main || fragment
  const result = owner.createElement('div')
  let module: HTMLDivElement | null = null
  for (const child of Array.from(source.childNodes)) {
    if (child.nodeType !== 1) continue
    const node = child as HTMLElement
    if (node.tagName === 'H2') {
      if (module) result.appendChild(module)
      module = owner.createElement('div')
      module.className = 'resume-module'
      module.appendChild(node)
    } else {
      (module || result).appendChild(node)
    }
  }
  if (module) result.appendChild(module)
  if (main) {
    result.className = 'main-layout'
    main.replaceWith(result)
    return fragment
  }
  return result
}
