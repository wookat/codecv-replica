// 错别字/规范检查：常见简历错别字词典 + 通用规则
import { ref } from 'vue'
export interface ProofreadIssue {
  index: number // 在 md 中的字符偏移
  wrong: string
  right: string
  ctx: string // 上下文片段
  kind: 'typo' | 'format'
  msg: string
  severity?: 'high' | 'low' // 生产同款：仅 high 可批量修正
}

const TYPO_PAIRS: [string, string][] = [
  ['帐号', '账号'],
  ['登陆', '登录'],
  ['热忠', '热衷'],
  ['活拨', '活泼'],
  ['再接再励', '再接再厉'],
  ['一如继往', '一如既往'],
  ['默守成规', '墨守成规'],
  ['走头无路', '走投无路'],
  ['滥芋充数', '滥竽充数'],
  ['融汇贯通', '融会贯通'],
  ['百尺杆头', '百尺竿头'],
  ['名信片', '明信片'],
  ['杀戳', '杀戮'],
  ['松驰', '松弛'],
  ['家俱', '家具'],
  ['九洲', '九州'],
  ['严历', '严厉'],
  ['诚认', '承认'],
  ['辩别', '辨别'],
  ['既使', '即使'],
  ['按步就班', '按部就班'],
  ['重峦叠障', '重峦叠嶂'],
  ['甘败下风', '甘拜下风'],
  ['一愁莫展', '一筹莫展'],
  ['穿流不息', '川流不息'],
  ['精减', '精简'],
  ['渡假', '度假'],
  ['言简意骇', '言简意赅'],
  ['沤心沥血', '呕心沥血'],
  ['不落巢臼', '不落窠臼'],
  ['烩炙人口', '脍炙人口'],
  ['死皮癞脸', '死皮赖脸'],
  ['磬竹难书', '罄竹难书'],
  ['蛛丝蚂迹', '蛛丝马迹'],
  ['萎糜不振', '萎靡不振'],
  ['老声常谈', '老生常谈'],
  ['美仑美奂', '美轮美奂'],
  ['誓不两立', '势不两立'],
  ['探囊取物', '探囊取物'],
  ['其它', '其他'],
  ['做为', '作为'],
  ['必需', '必须'],
  ['按装', '安装'],
  ['兰色', '蓝色'],
  ['园满', '圆满'],
  ['亮像', '亮相'],
  ['名星', '明星'],
  ['坐阵', '坐镇'],
  ['粗旷', '粗犷']
]

const GENERIC_RULES: {
  re: RegExp
  msg: (m: RegExpExecArray) => string
  right?: (m: RegExpExecArray) => string
}[] = [
  {
    re: /(的的|了了|是是|在在|我我|你你|很很|好好)/g,
    msg: m => `检测到连续重复字「${m[1]}」`,
    right: m => m[1][0]
  },
  {
    re: /。。|，，|！！|？？|；；/g,
    msg: m => `检测到重复标点「${m[0]}」`,
    right: m => m[0][0]
  },
  {
    re: /1[3-9]\d{8}(?!\d)/g,
    msg: () => '手机号疑似只有 10 位（应为 11 位）'
  },
  {
    re: /\b[\w.-]+@(?!com|cn|net|org|edu|qq|163|gmail|foxmail|outlook|hotmail|aliyun|sina|126|yeah|zju|pku|tsinghua|fudan|sjtu|whu|hust|nju|xmu|tongji|buaa|hit|ustc|xjtu|seu|scut|tju|nankai|sysu|hnu|csu|dlut|nwpu|bnu|ecnu|swjtu|cqu|mail)\w+$/gim,
    msg: () => '邮箱后缀疑似拼写错误'
  },
  {
    re: /[\u4e00-\u9fa5][ ]{2,}[\u4e00-\u9fa5]/g,
    msg: () => '中文字符之间存在多余空格',
    right: m => m[0].replace(/ +/g, ' ')
  }
]

export function scanContent(md: string): ProofreadIssue[] {
  const issues: ProofreadIssue[] = []
  for (const [wrong, right] of TYPO_PAIRS) {
    let idx = md.indexOf(wrong)
    while (idx !== -1) {
      issues.push({
        index: idx,
        wrong,
        right,
        ctx: md.slice(Math.max(0, idx - 12), idx + wrong.length + 12).replace(/\n/g, ' '),
        kind: 'typo',
        msg: `「${wrong}」应为「${right}」`
      })
      idx = md.indexOf(wrong, idx + 1)
    }
  }
  for (const rule of GENERIC_RULES) {
    rule.re.lastIndex = 0
    let m: RegExpExecArray | null
    while ((m = rule.re.exec(md))) {
      issues.push({
        index: m.index,
        wrong: m[0],
        right: rule.right ? rule.right(m) : '',
        ctx: md.slice(Math.max(0, m.index - 12), m.index + m[0].length + 12).replace(/\n/g, ' '),
        kind: 'format',
        msg: rule.msg(m)
      })
    }
  }
  return issues.sort((a, b) => a.index - b.index)
}

// 编辑栏「智能检查」按钮 → 打开错别字抽屉的跨组件信号
export const proofreadBus = ref(0)
