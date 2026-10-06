// 轻量 md→html（AI 诊断结果渲染）：标题/列表/加粗/换行
export function md2html(md: string): string {
  const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  return md
    .split(/\n{2,}/)
    .map(block => {
      const b = esc(block.trim())
      if (!b) return ''
      if (/^#{1,6}\s/.test(b)) {
        const lv = (b.match(/^(#{1,6})/)?.[1] || '#').length
        return `<h${lv}>${b.replace(/^#{1,6}\s*/, '')}</h${lv}>`
      }
      const lines = b
        .split('\n')
        .map(l =>
          /^[-*•]\s+/.test(l)
            ? `<li>${l.replace(/^[-*•]\s+/, '')}</li>`
            : /^\d+\.\s+/.test(l)
            ? `<li>${l.replace(/^\d+\.\s+/, '')}</li>`
            : l
        )
      const html = lines
        .join('\n')
        .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
        .replace(/`([^`]+)`/g, '<code>$1</code>')
      return lines.some(l => l.startsWith('<li>'))
        ? `<ul>${lines.filter(l => l.startsWith('<li>')).join('')}</ul>${lines
            .filter(l => !l.startsWith('<li>'))
            .join('<br>')}`
        : `<p>${html.replace(/\n/g, '<br>')}</p>`
    })
    .join('')
}
