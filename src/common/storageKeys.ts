/** 本地存储键统一管理：新增 key 先在这里登记，避免散落字符串 */
export const MD_CONTENT_PREFIX = 'markdown-content-'
/** 简历 md 内容键（值按 localstorage.ts 的 {value,expires} 包裹格式存储） */
export const mdContentKey = (type: string) => `${MD_CONTENT_PREFIX}${type}`
export const INVITE_KEY = 'INVITE'
export const TOKEN_KEY = 'TOKEN'
