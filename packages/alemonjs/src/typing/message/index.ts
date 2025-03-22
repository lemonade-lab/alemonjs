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

export type DataMap = {
  Text: DataText
  Image: DataImage
  ImageURL: DataImageURL
  ImageFile: DataImageFile
  Mention: DataMention
}

export type ParseKeys = {
  Text: string | undefined
  Image: Buffer[] | undefined
  Link: any
  Mention:
    | { value: string; typing: string; name: string; avatar: string; bot: boolean }[]
    | undefined
  Button: any
  File: any
  Voice: any
  Video: any
  ButtonBox: any
}

export type DataEnums = DataText | DataImage | DataImageURL | DataImageFile | DataMention

export type MessageDataFormat = DataEnums[]
