/* 模板分类（生产抓取 membership，勿手改） */
export interface TplCategory {
  slug: string
  name: string
  group: string
  cards: string[]
}

export const TEMPLATE_CATEGORIES: TplCategory[] = [
  {
    slug: 'daxuesheng',
    name: '大学生简历模板',
    group: '热门',
    cards: ['32', '71', '73', '75', '74', '72']
  },
  {
    slug: 'yingjiesheng',
    name: '应届生简历模板',
    group: '热门',
    cards: [
      '44',
      '32',
      '31',
      '71',
      '73',
      'agent_development',
      '76',
      '75',
      '80',
      '77',
      '74',
      '72',
      'yinhangguanpeisheng',
      'duomotaidamoxingsuanfa',
      'shuziic',
      'youxikehuduankaifa',
      '79'
    ]
  },
  {
    slug: 'qiuzhi',
    name: '求职简历模板',
    group: '热门',
    cards: ['31']
  },
  {
    slug: 'liuxue',
    name: '留学简历模板',
    group: '热门',
    cards: []
  },
  {
    slug: 'qinghuadaxue',
    name: '清华大学',
    group: '学校',
    cards: ['29', '36', '105']
  },
  {
    slug: 'beijingdaxue',
    name: '北京大学',
    group: '学校',
    cards: ['56', '109']
  },
  {
    slug: 'fudandaxue',
    name: '复旦大学',
    group: '学校',
    cards: ['72']
  },
  {
    slug: 'shanghaijiaotongdaxue',
    name: '上海交通大学',
    group: '学校',
    cards: ['45', '79']
  },
  {
    slug: 'zhejiangdaxue',
    name: '浙江大学',
    group: '学校',
    cards: ['74']
  },
  {
    slug: 'wuhandaxue',
    name: '武汉大学',
    group: '学校',
    cards: ['88', '87']
  },
  {
    slug: 'zhongshandaxue',
    name: '中山大学',
    group: '学校',
    cards: ['80']
  },
  {
    slug: 'hulianwang',
    name: '互联网',
    group: '行业',
    cards: [
      '1internet_avatar',
      '43',
      '38',
      '44',
      '15simple_versatile',
      '35',
      '34',
      '39',
      '46',
      '28',
      '8general',
      '10front_end',
      '11fresh',
      '20campus_simple',
      '37',
      '6operation_avatar',
      '24',
      '17business',
      '36',
      '52',
      '4internet',
      '71',
      '12internet_social',
      '19social',
      '73',
      '23',
      '3operation',
      '75',
      '80',
      '74',
      '72'
    ]
  },
  {
    slug: 'jinrong',
    name: '金融',
    group: '行业',
    cards: ['52', '51', 'yinhangguanpeisheng', '78', '79']
  },
  {
    slug: 'zixun',
    name: '咨询',
    group: '行业',
    cards: ['68', '91']
  },
  {
    slug: 'yinhang',
    name: '银行',
    group: '行业',
    cards: ['yinhangguanpeisheng']
  },
  {
    slug: 'wenhuachuanmei',
    name: '文化/传媒',
    group: '行业',
    cards: ['102']
  },
  {
    slug: 'fangdichan',
    name: '房地产',
    group: '行业',
    cards: ['103']
  },
  {
    slug: 'dianzishangwu',
    name: '电子商务',
    group: '行业',
    cards: ['104']
  },
  {
    slug: 'tongxin',
    name: '通信',
    group: '行业',
    cards: ['83']
  },
  {
    slug: 'youxi',
    name: '游戏',
    group: '行业',
    cards: ['youxikehuduankaifa']
  },
  {
    slug: 'zhizaoye',
    name: '制造业',
    group: '行业',
    cards: ['105']
  },
  {
    slug: 'chanpinjingli',
    name: '产品经理简历模板',
    group: '职位',
    cards: ['18art', '72']
  },
  {
    slug: 'chengxuyuan',
    name: '程序员简历模板',
    group: '职位',
    cards: ['61', '46', '23', 'agent_development', '13geek', '25']
  },
  {
    slug: 'agentkaifa',
    name: 'Agent开发',
    group: '职位',
    cards: ['61', 'agent_development']
  },
  {
    slug: 'yunying',
    name: '运营简历模板',
    group: '职位',
    cards: [
      '45',
      '43',
      '38',
      '44',
      '41',
      '39',
      '46',
      '28',
      '40',
      '42',
      '6operation_avatar',
      '9business',
      '57',
      '14heading',
      '3operation',
      '7simple_avatar',
      '75',
      '84',
      '104',
      '102'
    ]
  },
  {
    slug: 'xingzheng',
    name: '行政简历模板',
    group: '职位',
    cards: ['49']
  },
  {
    slug: 'ruanjiangongcheng',
    name: '软件工程',
    group: '专业',
    cards: ['61', '80']
  },
  {
    slug: 'gongshangguanli',
    name: '工商管理',
    group: '专业',
    cards: ['18art']
  },
  {
    slug: 'jinrongxue',
    name: '金融学',
    group: '专业',
    cards: ['78']
  },
  {
    slug: 'jisuanjikexue',
    name: '计算机科学与技术',
    group: '专业',
    cards: ['55', '58', '60']
  },
  {
    slug: 'jingjixue',
    name: '经济学',
    group: '专业',
    cards: ['81', '78']
  },
  {
    slug: 'chuanboxue',
    name: '传播学',
    group: '专业',
    cards: ['84']
  },
  {
    slug: 'shichangyingxiao',
    name: '市场营销',
    group: '专业',
    cards: ['93']
  },
  {
    slug: 'kuaijixue',
    name: '会计学',
    group: '专业',
    cards: ['81']
  },
  {
    slug: 'shixisheng',
    name: '实习生简历模板',
    group: '热门',
    cards: ['29', '20campus_simple', '16prominent_content', '36', '75']
  },
  {
    slug: 'yingwen',
    name: '英文简历模板',
    group: '热门',
    cards: ['24', '53', '23', '25']
  },
  {
    slug: 'shuqishixi',
    name: '暑期实习',
    group: '热门',
    cards: ['61', '73']
  },
  {
    slug: 'xiaozhao',
    name: '校招简历',
    group: '热门',
    cards: [
      '45',
      '1internet_avatar',
      '43',
      '48',
      '38',
      '44',
      '55',
      '27',
      '35',
      '41',
      '33',
      '34',
      '39',
      '46',
      '42',
      '32',
      '8general',
      '10front_end',
      '31',
      '29',
      '11fresh',
      '60',
      '20campus_simple',
      '37',
      '22',
      '24',
      '47',
      '17business',
      '36',
      '30',
      '52',
      '49',
      '4internet',
      '54',
      '21it_campus',
      '71',
      '53',
      '19social',
      '83',
      '14heading',
      '73',
      '50',
      '2concise',
      'agent_development',
      '76',
      '81',
      '75',
      '77',
      '72',
      '94',
      '106',
      '88',
      '105',
      '107',
      '101',
      'yinhangguanpeisheng',
      '99',
      '95',
      '84',
      'duomotaidamoxingsuanfa',
      '104',
      '108',
      '102',
      '109',
      '103',
      '86',
      '85',
      '82',
      '100',
      '78',
      'shuziic',
      '93',
      '87',
      '97',
      '92',
      'youxikehuduankaifa'
    ]
  },
  {
    slug: 'qiche',
    name: '汽车',
    group: '行业',
    cards: ['101']
  },
  {
    slug: 'cangchuwuliu',
    name: '仓储/物流',
    group: '行业',
    cards: ['106']
  },
  {
    slug: 'jiaoyupeixun',
    name: '教育培训',
    group: '行业',
    cards: ['107']
  },
  {
    slug: 'baoxian',
    name: '保险',
    group: '行业',
    cards: ['108']
  },
  {
    slug: 'guanggao',
    name: '广告',
    group: '行业',
    cards: ['89', '99', '109']
  },
  {
    slug: 'sheji',
    name: '设计简历模板',
    group: '职位',
    cards: [
      '41',
      '42',
      '22',
      '16prominent_content',
      '17business',
      '9business',
      '14heading',
      '18art',
      '7simple_avatar',
      '72',
      '89',
      '85',
      '82',
      'shuziic',
      '69'
    ]
  },
  {
    slug: 'caiwu',
    name: '财务简历模板',
    group: '职位',
    cards: ['81', 'yinhangguanpeisheng', '78']
  },
  {
    slug: 'jiaoshi',
    name: '教师简历模板',
    group: '职位',
    cards: ['85']
  },
  {
    slug: 'python',
    name: 'python',
    group: '职位',
    cards: ['4internet']
  },
  {
    slug: 'webqianduan',
    name: 'Web前端',
    group: '职位',
    cards: ['10front_end', '16prominent_content', '14heading', '2concise']
  },
  {
    slug: 'java',
    name: 'Java',
    group: '职位',
    cards: ['48', '55', '15simple_versatile', '26', '71', '80']
  },
  {
    slug: 'android',
    name: 'Andorid',
    group: '职位',
    cards: ['88']
  },
  {
    slug: 'ios',
    name: 'iOS',
    group: '职位',
    cards: ['87']
  },
  {
    slug: 'ceshi',
    name: '测试',
    group: '职位',
    cards: ['35', '34', '36', '67']
  },
  {
    slug: 'yunwei',
    name: '运维',
    group: '职位',
    cards: ['67']
  },
  {
    slug: 'dashuju',
    name: '大数据',
    group: '职位',
    cards: ['1internet_avatar', '8general']
  },
  {
    slug: 'uiux',
    name: 'UI/UX',
    group: '职位',
    cards: []
  },
  {
    slug: 'pingmiansheji',
    name: '平面设计/美工',
    group: '职位',
    cards: ['89']
  },
  {
    slug: 'renliziyuan',
    name: '人力资源',
    group: '职位',
    cards: ['77']
  },
  {
    slug: 'huizhancehua',
    name: '会展策划',
    group: '职位',
    cards: ['90']
  },
  {
    slug: 'yiliaojiankang',
    name: '医疗/健康',
    group: '职位',
    cards: ['91']
  },
  {
    slug: 'pinpaigongguan',
    name: '品牌公关',
    group: '职位',
    cards: ['92']
  },
  {
    slug: 'suanfagongchengshi',
    name: '算法工程师',
    group: '职位',
    cards: ['74', '65', 'duomotaidamoxingsuanfa']
  },
  {
    slug: 'kuaixiao',
    name: '快消',
    group: '职位',
    cards: ['93']
  },
  {
    slug: 'javascript',
    name: 'JavaScript',
    group: '职位',
    cards: []
  },
  {
    slug: 'netgongchengshi',
    name: '.NET工程师',
    group: '职位',
    cards: []
  },
  {
    slug: 'cgongchengshi',
    name: 'C#工程师',
    group: '职位',
    cards: []
  },
  {
    slug: 'wangluoanquan',
    name: '网络安全',
    group: '职位',
    cards: ['67']
  },
  {
    slug: 'shujufenxi',
    name: '数据分析',
    group: '职位',
    cards: ['73', '3operation', '64']
  },
  {
    slug: 'qianrushi',
    name: '嵌入式',
    group: '职位',
    cards: ['9business', '83']
  },
  {
    slug: 'caigoumaoyi',
    name: '采购贸易',
    group: '职位',
    cards: ['96']
  },
  {
    slug: 'shangwutuozhan',
    name: '商务拓展',
    group: '职位',
    cards: ['97']
  },
  {
    slug: 'waimao',
    name: '外贸',
    group: '职位',
    cards: ['98']
  },
  {
    slug: 'xiaoshou',
    name: '销售',
    group: '职位',
    cards: ['59']
  },
  {
    slug: 'wenancehua',
    name: '文案/策划',
    group: '职位',
    cards: ['99']
  },
  {
    slug: 'seosem',
    name: 'SEO/SEM',
    group: '职位',
    cards: ['100']
  },
  {
    slug: 'xinmeiti',
    name: '新媒体',
    group: '职位',
    cards: ['43', '44', '41', '42', '75', '84', '102']
  },
  {
    slug: 'zhongguorenmindaxue',
    name: '中国人民大学',
    group: '学校',
    cards: ['89', '91', '90']
  },
  {
    slug: 'duiwaijingmaodaxue',
    name: '对外经贸大学',
    group: '学校',
    cards: ['98', '96', '92']
  },
  {
    slug: 'xianggangdaxue',
    name: '香港大学',
    group: '学校',
    cards: ['99']
  },
  {
    slug: 'sichuandaxue',
    name: '四川大学',
    group: '学校',
    cards: ['100']
  },
  {
    slug: 'nankaidaxue',
    name: '南开大学',
    group: '学校',
    cards: ['97']
  },
  {
    slug: 'nanjingdaxue',
    name: '南京大学',
    group: '学校',
    cards: ['76', '77', '95']
  },
  {
    slug: 'jilindaxue',
    name: '吉林大学',
    group: '学校',
    cards: ['101']
  },
  {
    slug: 'zhongnandaxue',
    name: '中南大学',
    group: '学校',
    cards: ['94']
  },
  {
    slug: 'shenzhendaxue',
    name: '深圳大学',
    group: '学校',
    cards: ['75']
  },
  {
    slug: 'jinandaxue',
    name: '暨南大学',
    group: '学校',
    cards: ['93']
  },
  {
    slug: 'zhongyangcaijingdaxue',
    name: '中央财经大学',
    group: '学校',
    cards: ['81', '108', '78']
  },
  {
    slug: 'dianzikejidaxue',
    name: '电子科技大学',
    group: '学校',
    cards: ['28']
  },
  {
    slug: 'zhongguochuanmeidaxue',
    name: '中国传媒大学',
    group: '学校',
    cards: ['102']
  },
  {
    slug: 'tongjidaxue',
    name: '同济大学',
    group: '学校',
    cards: ['103']
  },
  {
    slug: 'yishusheji',
    name: '艺术与设计',
    group: '专业',
    cards: ['82']
  },
  {
    slug: 'dianzixinxigongcheng',
    name: '电子信息工程',
    group: '专业',
    cards: ['83']
  },
  {
    slug: 'jiaoyuxue',
    name: '教育学',
    group: '专业',
    cards: ['107', '85']
  },
  {
    slug: 'yuyanzhuanye',
    name: '语言类专业',
    group: '专业',
    cards: ['86']
  }
]

export const CATEGORY_GROUPS = ['热门', '行业', '职位', '学校', '专业'] as const

export function categoryOf(slug: string) {
  return TEMPLATE_CATEGORIES.find(c => c.slug === slug)
}
