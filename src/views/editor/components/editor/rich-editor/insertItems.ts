// 插入菜单 22 项共享元数据：slash 菜单与 sideTool add-btn 菜单同源（生产 nu 数组契约）
// zh=标题 en=拼音别名 icon=图标 key=动作键 sub=子菜单类型
export interface InsertItemDef {
  key: string
  zh: string
  en: string
  icon: string
  sub?: 'table'
}
export const INSERT_ITEM_DEFS: InsertItemDef[] = [
  { key: 'h2', zh: '模块标题', en: 'jianlimokuaibiaoti', icon: 'wrongly' },
  { key: 'cols', zh: '左右布局', en: 'zuoyoubuju/column', icon: 'columns' },
  { key: 'icon', zh: '插入图标', en: 'charutubiao/icon', icon: 'emoji' },
  { key: 'img', zh: '插入图片', en: 'tupian/image', icon: 'image' },
  { key: 'h1', zh: '一级标题', en: 'yijibiaoti/heading', icon: 'head' },
  { key: 'h2b', zh: '二级标题', en: 'erjibiaoti/heading', icon: 'head' },
  { key: 'h3', zh: '三级标题', en: 'sanjibiaoti/heading', icon: 'head' },
  { key: 'h4', zh: '四级标题', en: 'sijibiaoti/heading', icon: 'head' },
  { key: 'h5', zh: '五级标题', en: 'wujibiaoti/heading', icon: 'head' },
  { key: 'h6', zh: '六级标题', en: 'liujibiaoti/heading', icon: 'head' },
  { key: 'table', zh: '表格布局', en: 'biaogebuju/table', icon: 'table', sub: 'table' },
  { key: 'nbsp', zh: '插入空白符', en: 'kongbaifu/space', icon: 'space' },
  { key: 'bold', zh: '加粗', en: 'jiacu/bold', icon: 'bold' },
  { key: 'italic', zh: '斜体', en: 'xieti/italic', icon: 'italic' },
  { key: 'quote', zh: '引用', en: 'yinyong/quote', icon: 'quote' },
  { key: 'hr', zh: '水平分割线', en: 'fengexian/horizontal', icon: 'segment' },
  { key: 'strike', zh: '删除线', en: 'shanchuxian/', icon: 'strike' },
  { key: 'tag', zh: '标签', en: 'biaoqian/code', icon: 'code' },
  { key: 'link', zh: '插入链接', en: 'charulianjie/link', icon: 'link' },
  { key: 'ol', zh: '有序列表', en: 'youxuliebiao/orderlist', icon: 'orderedlist' },
  { key: 'ul', zh: '无序列表', en: 'wuxuliebiao/unorderlist', icon: 'unorderedlist' },
  { key: 'avatar', zh: '头像上传', en: 'touxiang/image', icon: 'user' }
]
