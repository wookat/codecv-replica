// 简历所见即所得编辑器 —— tiptap/ProseMirror 引擎（对齐生产 .tiptap.ProseMirror 结构）
// schema 原则：能解析 .reference-dom 全部 HTML（resume-module/head-layout/main-layout/
// flex-layout/flex-layout-item/常规块），渲染回同构 DOM，保证 resumeDOMStruct2Markdown 零改动
import { Extension, Mark, Node, mergeAttributes } from '@tiptap/core'
import StarterKit from '@tiptap/starter-kit'
import Table from '@tiptap/extension-table'
import TableRow from '@tiptap/extension-table-row'
import TableHeader from '@tiptap/extension-table-header'
import TableCell from '@tiptap/extension-table-cell'
import Link from '@tiptap/extension-link'
import Underline from '@tiptap/extension-underline'
import TextStyle from '@tiptap/extension-text-style'
import Color from '@tiptap/extension-color'
import Highlight from '@tiptap/extension-highlight'
import Image from '@tiptap/extension-image'
import TextAlign from '@tiptap/extension-text-align'
import Code from '@tiptap/extension-code'

// ---------- 全局属性保留：class/style/data-*/id 在所有节点上透传 ----------
const PreserveAttrs = Extension.create({
  name: 'preserveAttrs',
  addGlobalAttributes() {
    return [
      {
        types: [
          'paragraph',
          'heading',
          'bulletList',
          'orderedList',
          'listItem',
          'blockquote',
          'codeBlock',
          'horizontalRule',
          'hardBreak',
          'image',
          'table',
          'tableRow',
          'tableHeader',
          'tableCell',
          'resumeModule',
          'headLayout',
          'mainLayout',
          'flexLayout',
          'flexItem'
        ],
        attributes: {
          class: { default: null, rendered: true },
          style: { default: null, rendered: true },
          id: { default: null, rendered: true },
          uid: { default: null, rendered: true }
        }
      }
    ]
  }
})

// ---------- 包装节点：与生产 DOM 同构 ----------
function wrapperNode(name: string, cls: string, content: string) {
  return Node.create({
    name,
    group: 'topwrap',
    content,
    defining: true,
    parseHTML() {
      return [{ tag: `div.${cls}`, priority: 60 }]
    },
    renderHTML({ HTMLAttributes }) {
      return ['div', mergeAttributes(HTMLAttributes, { class: cls }), 0]
    }
  })
}

const ResumeModule = wrapperNode('resumeModule', 'resume-module', 'block+')
// headStart..headEnd 内允许 flexLayout（头像|个人信息双栏行），否则 PM 会把
// flex-layout 提升为同级节点、head-layout 变空壳 → 序列化 md 里头部内容错位/乱码
const HeadLayout = wrapperNode('headLayout', 'head-layout', '(flexLayout|block)+')
const FlexLayout = wrapperNode('flexLayout', 'flex-layout', 'flexItem+')

const MainLayout = Node.create({
  name: 'mainLayout',
  group: 'topwrap',
  content: '(resumeModule|flexLayout|block)+',
  defining: true,
  parseHTML() {
    return [{ tag: 'div.main-layout', priority: 60 }]
  },
  renderHTML({ HTMLAttributes }) {
    return ['div', mergeAttributes(HTMLAttributes, { class: 'main-layout' }), 0]
  }
})

const FlexItem = Node.create({
  name: 'flexItem',
  group: 'none',
  content: 'block+',
  defining: true,
  parseHTML() {
    return [{ tag: 'div.flex-layout-item', priority: 60 }]
  },
  renderHTML({ HTMLAttributes }) {
    return ['div', mergeAttributes(HTMLAttributes, { class: 'flex-layout-item' }), 0]
  }
})

// ---------- 兜底容器：模板皮肤的其他 div 包装（.container/.row 等任意类名） ----------
const HtmlDiv = Node.create({
  name: 'htmlDiv',
  group: 'topwrap',
  content: 'block+',
  defining: true,
  parseHTML() {
    return [{ tag: 'div', priority: 10 }]
  },
  renderHTML({ HTMLAttributes }) {
    return ['div', mergeAttributes(HTMLAttributes), 0]
  }
})

// ---------- 行内 icon：<i class="iconfont icon-x"> —— dom2md 序列化为 icon:x ----------
const Icon = Node.create({
  name: 'icon',
  inline: true,
  group: 'inline',
  atom: true,
  addAttributes() {
    return { name: { default: '' } }
  },
  parseHTML() {
    return [
      {
        tag: 'i.iconfont',
        getAttrs: el => ({
          name: (el.getAttribute('class') || '').replace(/^.*icon-(\S+).*$/, '$1')
        })
      }
    ]
  },
  renderHTML({ node }) {
    return ['i', { class: `iconfont icon-${node.attrs.name}` }]
  }
})

// ---------- 兜底行内元素：span/em 等非 mark 行内标签原样保留 ----------
const HtmlSpan = Mark.create({
  name: 'htmlSpan',
  addAttributes() {
    return { class: { default: null }, style: { default: null } }
  },
  parseHTML() {
    return [{ tag: 'span' }, { tag: 'em' }, { tag: 'small' }, { tag: 'sub' }, { tag: 'sup' }]
  },
  renderHTML({ HTMLAttributes }) {
    return ['span', mergeAttributes(HTMLAttributes), 0]
  }
})

// ---------- doc：顶层允许包装节点与常规块 ----------
const Doc = Node.create({
  name: 'doc',
  topNode: true,
  content: '(topwrap|block)+'
})

// ---------- table 用宽松 cell：生产 td/th 内可以是任意块 ----------
const CvTableCell = TableCell.extend({ content: 'block+' })
const CvTableHeader = TableHeader.extend({ content: 'block+' })

export const resumeExtensions = [
  Doc,
  StarterKit.configure({
    document: false,
    heading: { levels: [1, 2, 3, 4, 5, 6] },
    history: { depth: 200 },
    hardBreak: false, // br 在模板里是 &nbsp; 占位符，禁用 Shift+Enter 意外换行
    code: false // 用下方扩展版（带 class/style attrs，标签样式面板可写）
  }),
  // 行内 code：保留 class/style（<code class="single-code"> 技能标签）
  Code.extend({
    addAttributes() {
      return {
        class: { default: null },
        style: { default: null }
      }
    },
    renderHTML({ HTMLAttributes }) {
      return ['code', HTMLAttributes, 0]
    }
  }),
  ResumeModule,
  HeadLayout,
  MainLayout,
  FlexLayout,
  FlexItem,
  HtmlDiv,
  Icon,
  HtmlSpan,
  TextStyle,
  Color,
  Highlight.configure({ multicolor: true }),
  Underline,
  Link.configure({ openOnClick: false, autolink: true }),
  Image.extend({
    addAttributes() {
      return {
        ...this.parent?.(),
        class: { default: null },
        style: { default: null },
        width: { default: null },
        height: { default: null }
      }
    }
  }),
  Table.configure({ resizable: true, lastColumnResizable: false }),
  TableRow,
  CvTableHeader,
  CvTableCell,
  TextAlign.configure({
    types: ['heading', 'paragraph'],
    alignments: ['left', 'center', 'right', 'justify']
  }),
  PreserveAttrs
]
