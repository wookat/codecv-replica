import { driver } from 'driver.js'
import 'driver.js/dist/driver.css'
import './popover.scss'
import { getLocalStorage, setLocalStorage } from '@/common/localstorage'

// 生产逐字引导配置（driver.js 7 步，从 entry chunk 提取）
const driverObj = driver({
  popoverClass: 'guide-container',
  showProgress: true,
  nextBtnText: '下一步',
  prevBtnText: '上一步',
  doneBtnText: '开始使用',
  allowClose: true,
  steps: [
    {
      element: '.toggle-edit-mode',
      popover: {
        title: '编辑模式切换',
        description:
          '现支持两种模式，你可以选择 <strong style="color: var(--strong-color)">markdown</strong>模式或<strong style="color: var(--strong-color)">所见即所得</strong> 模式来编写，且不用担心切换后数据丢失，因为它们之间的数据是同步的～'
      }
    },
    {
      element: '.menu-guide',
      popover: {
        title: '简历排版编写指南',
        description: '如果你不知道怎么去编写排版，你可以花三分钟看看该指南～'
      }
    },
    {
      element: '.move',
      popover: {
        title: '编辑器宽度控制',
        description: '如果你觉得编辑区域太窄，可以拖动该区域来改变编辑器的宽度'
      }
    },
    {
      element: '.operator-level2',
      popover: {
        title: '简历工具栏',
        description: '你可以通过这些工具来调整你想要看到的简历效果'
      }
    },
    {
      element: '.lx-avatar-tool',
      popover: {
        title: '证件照上传/更换',
        description:
          '你可以在此处上传/更换你的证件照<strong style="color: var(--strong-color)">（可拖拽）</strong>，当然你也可以在左侧编辑器中上传<strong style="color: var(--strong-color)">（编辑器中上传不支持拖拽）</strong>，可根据自身需求来弹性设置~'
      }
    },
    {
      element: '.export-group',
      popover: {
        title: '导出简历',
        description:
          '在此处你可以选择你想导出的<strong style="color: var(--strong-color)">简历格式</strong>'
      }
    },
    {
      element: '.resume-history',
      popover: {
        title: '简历历史记录',
        description: '你可以在此处查看你保存过的历史版本，可用于回溯'
      }
    }
  ]
})

export const startGuide = function () {
  const guideStatus = getLocalStorage('resume-make-guide')
  if (guideStatus) return
  setTimeout(driverObj.drive)
  setLocalStorage('resume-make-guide', true, 1000 * 3600 * 24 * 180)
}
export const refreshGuide = driverObj.drive
