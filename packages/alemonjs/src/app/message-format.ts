import {
  DataMention,
  DataImage,
  DataText,
  DataImageURL,
  DataImageFile,
  ButtonRow,
  DataButtonGroup,
  DataButton
} from '../typings'

/**
 * 文本消息
 * @param val
 * @param options
 * @returns
 */
export const Text = (val: DataText['value'], options?: DataText['options']): DataText => {
  return {
    type: 'Text',
    value: val,
    options
  }
}

/**
 * 图片消息
 * @param val
 * @returns
 */
export const Image = (val: DataImage['value']): DataImage => {
  return {
    type: 'Image',
    value: val
  }
}

/**
 * 图片链接，http 或 https 开头
 * @param val
 * @returns
 */
export const ImageURL = (val: DataImageURL['value']): DataImageURL => {
  return {
    type: 'ImageURL',
    value: val
  }
}

/**
 * 本地图片文件
 * @param val
 * @returns
 */
export const ImageFile = (val: DataImageFile['value']): DataImageFile => {
  return {
    type: 'ImageFile',
    value: val
  }
}

/**
 * 提及
 * @param UserId 默认 @ 所有人
 * @param options 默认 user
 * @returns
 */
export const Mention = (
  UserId?: DataMention['value'],
  options?: DataMention['options']
): DataMention => {
  return {
    type: 'Mention',
    value: UserId,
    options: options ?? {
      belong: 'user'
    }
  }
}

const BT = (
  title: string,
  data: DataButton['options']['data'],
  options?: Omit<DataButton['options'], 'data'>
): DataButton => {
  return {
    type: 'Button',
    value: title,
    options: {
      data,
      ...options
    }
  }
}

BT.group = function Group(...rows: ButtonRow[]): DataButtonGroup {
  return {
    type: 'BT.group',
    value: rows
  }
}

BT.template = function Template(value: DataButtonGroup['options']['template_id']): DataButtonGroup {
  return {
    type: 'BT.group',
    value: [],
    options: {
      template_id: value
    }
  }
}

BT.row = function Row(...buttons: DataButton[]): ButtonRow {
  return {
    type: 'BT.row',
    value: buttons
  }
}

export { BT }

// const Send = (...x: DataButtonGroup[]) => {
//   return x;
// };

// Send(
//   BT.template('123'),
//   BT.group(
//     BT.row(BT("开始", "/开始游戏")),
//     BT.row(BT("百度一下", "https://baidu.com", { isLink: true })),
//     BT.row(BT("是否同意", { click: "/同意", confirm: "/同意", cancel: "/不同意" })),
//     BT.row(BT("哈哈", "/哈哈", { autoEnter: false, showList: true, toolTip: '不支持' }))
//   )
// )
