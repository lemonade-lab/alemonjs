import { MessageButtonType } from '../../../core/types.js'

/**
 * 转换为可被识别的数据格式
 * @param arr
 * @returns
 */
export function getKeyboardData(arrs: MessageButtonType[][]) {
  const rows = []
  let id = 0
  for (const arr of arrs) {
    const buttons = []
    for (const item of arr) {
      id++
      buttons.push({
        id: String(id),
        render_data: {
          label: item?.label ?? '/帮助',
          visited_label: item?.label ?? '/帮助',
          // link 是灰色按钮
          style: item?.link ? 0 : 1
        },
        action: {
          type: item?.link ? 0 : 2,
          permission: {
            type: 2
          },
          // 默认自动回车
          enter: item?.enter ?? true,
          // 默认不是引用回复
          reply: item?.reply ?? false,
          unsupport_tips: '请升级至最新版',
          data: item?.link ?? item?.value ?? item?.label ?? item
        }
      })
    }
    rows.push({
      // 多少个
      buttons
    })
  }
  return {
    content: {
      // 多少
      rows
    }
  }
}
