// Pages Functions 移植：薄适配层，原文件零改动
import { onRequestPost } from '../../../../functions/api/upload/[[route]].js'
import { asPages } from '../../utils/pages'

export default asPages(onRequestPost)
