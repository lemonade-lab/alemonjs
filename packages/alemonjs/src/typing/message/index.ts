import { User } from '../event/base/user'
import { Guild, Channel } from '../event/base/guild'

/**
 * 文本数据
 */
export type DataText = {
  type: 'Text'
  value: string
  options?: {
    style?: 'none' | 'bold' | 'block' | 'strikethrough' | 'boldItalic' | 'italic'
  }
}

/**
 * 图片数据
 */
export type DataImage = {
  type: 'Image'
  value: Buffer
}

/**
 * 图片链接
 */
export type DataImageURL = {
  type: 'ImageURL'
  value: string
}

/**
 * 图片文件
 */
export type DataImageFile = {
  type: 'ImageFile'
  value: string
}

/**
 * 提及数据
 */
export type DataMention = {
  type: 'Mention'
  value?: string
  options?: {
    belong?: 'user' | 'guild' | 'channel' | 'everyone'
    payload?: User | Guild | Channel | 'everyone'
  }
}

export type DataButton = {
  type: 'Button'
  // 显示的文字
  value:
    | string
    | {
        title: string
        // 被点击后要显示的
        label: string
      }
  options?: {
    // 禁止提示
    toolTip?: string
    // 自动回车
    autoEnter?: boolean
    // 显示列表
    showList?: boolean
    // 数据
    data?:
      | string
      | {
          click: string
          confirm: string
          cancel: string
        }
    //
    isLink?: boolean
  }
}

export type ButtonRow = {
  type: 'BT.row'
  value: DataButton[]
}

export type DataButtonGroup = {
  type: 'BT.group'
  value: ButtonRow[]
  options?: {
    template_id?: string
  }
}

export type DataMap = {
  Text: DataText
  Image: DataImage
  ImageURL: DataImageURL
  ImageFile: DataImageFile
  Mention: DataMention
  ButtonGroup: DataButtonGroup
}

export type DataEnums =
  | DataText
  | DataImage
  | DataImageURL
  | DataImageFile
  | DataMention
  | DataButtonGroup
export type MessageDataFormat = DataEnums[]
