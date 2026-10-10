const routeTitles: Record<string, string> = {
  home: '个人简历模板免费下载，PDF简历制作，专业中英文简历模板 - CodeCV简历',
  jianlimoban: '简历模板免费下载_个人简历模板在线制作 - CodeCV简历',
  profile: '我的简历管理_简历投递进度跟踪_求职进度管理_简历制作工具 - CodeCV简历',
  progress: '我的投递进度 - CodeCV简历',
  mianjing: '面经大全 - 大厂面试经验真题分享 | CodeCV简历',
  'mianjing-activity': '面经创作大赛 - 第一期 - 发面经赢会员 | CodeCV简历',
  'mianjing-mine': '我的面经 - CodeCV简历',
  strategy: '求职攻略_面试技巧_简历优化建议_求职经验分享_程序员求职指南 - CodeCV简历',
  jobs: '2027秋招/春招信息表｜校园招聘岗位汇总，包含日常实习/暑期实习/社招职位 - CodeCV简历',
  member: '会员中心_VIP会员特权_简历制作高级功能_专业简历模板下载 - CodeCV简历',
  invite: '邀请有赏_推荐好友_邀请返利_分享赚钱_邀请奖励计划 - CodeCV简历',
  'user-invite': '邀请记录|推荐奖励|邀请佣金|用户邀请管理 - CodeCV简历',
  'mianjing-write': '投稿面经 - CodeCV简历',
  order: '我的订单|订单管理|支付记录|会员购买记录 - CodeCV简历',
  notify: '通知中心 - CodeCV简历',
  login: '登录 / 注册 - CodeCV简历',
  'resume-import': '导入简历_在线简历导入_简历模板选择 - CodeCV简历',
  'add-post': '投稿文章_求职攻略投稿_简历经验分享 - CodeCV简历',
  'add-success': '投稿成功 - CodeCV简历',
  feedback: '用户反馈_使用体验_产品建议_简历制作工具评价_用户评价 - CodeCV简历',
  share: '简历分享 - CodeCV简历',
  cv: '编辑简历 - CodeCV简历',
  'mp-editor': '编辑简历 - CodeCV简历',
  'export-resume': '导出简历 - CodeCV简历',
  'template-category': '简历模板 - CodeCV简历',
  'page-404': '404页面不存在|页面找不到|访问错误 - CodeCV简历',
  NotFound: '404页面不存在|页面找不到|访问错误 - CodeCV简历'
}

export default defineNuxtRouteMiddleware(to => {
  const t = routeTitles[to.name as string]
  if (t) useHead({ title: t })
})
