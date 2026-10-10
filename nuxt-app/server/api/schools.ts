// Pages Functions 移植：薄适配层，原文件零改动
import { onRequest } from '../../../functions/api/schools.js'
import { asPages } from '../utils/pages'

export default asPages(onRequest)
