// 方言归一化：把模板/用户 md 里的「脏写法」修成规范 CommonMark
// 规则均来自实测：原写法在 mth 下本来渲染错误（归为修复），或视觉无效（归为剥离）。
// 每条规则必须保证 mth 渲染「不变或更好」——Phase 0 逐套验证。

function normalizeLineOnce(line: string): string {
  // `** 空格text空格 **` 不是合法 strong（CommonMark），mth 宽容解析渲染加粗；
  // 收成 `**text**` 后两端渲染一致，且不再被 remark 转义。
  // 捕获域禁止跨 `**` 标记，否则会把相邻合法粗体吞进同一个 span；
  // `**x **`（仅闭合前空格）同样是畸形，单独收一条。
  line = line.replace(/\*\* +((?:(?!\*\*).)+?) +\*\*/g, '**$1**')
  line = line.replace(/\*\*((?:(?!\*\*).)+?) +\*\*/g, '**$1**')
  line = line.replace(/\*\* +((?:(?!\*\*).)+?)\*\*/g, '**$1**')
  // 行尾 &nbsp;/空格 任意交错序列视觉无效，一次剥净
  line = line.replace(/(?:&nbsp;|\s)+$/, '')
  // `<url>` 自动链接 mth 不识别（渲染为字面尖括号）→ 显式链接（渲染修复）
  line = line.replace(/<(https?:\/\/[^>\s]+)>/g, '[$1]($1)')
  // `* ` 无序列表项 mth 不识别（渲染为字面星号）→ `- `（渲染修复）
  line = line.replace(/^(\s*)\* +/, '$1- ')
  // `:::` 指令永远顶格（114 模板全量验证）；PM 序列化可能把它缩进进列表项——拉回顶格
  line = line.replace(/^\s+(:::.*)$/, '$1')
  return line
}

export function normalizeLine(line: string): string {
  // 整行只有 &nbsp; 的是有意占位空段（mth 渲染为 <p>&nbsp;</p> 间距），保留
  if (/^\s*(?:&nbsp;\s*)+$/.test(line)) return line
  // 规则间可能互相喂出新畸形（如剥 &nbsp; 后露出 ` **`），循环收敛到不动点
  let prev = line
  for (let i = 0; i < 5; i++) {
    const next = normalizeLineOnce(prev)
    if (next === prev) break
    prev = next
  }
  return prev
}

export function normalizeMd(md: string): string {
  return md.split('\n').map(normalizeLine).join('\n')
}
