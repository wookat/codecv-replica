// /gitee → []（stargazers 墙留空，不伪造数据）
import { json } from './_lib.js'

export function onRequest(context) {
  return json(context.request, [])
}
