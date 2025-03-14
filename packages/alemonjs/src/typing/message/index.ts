import { User } from '../event/base/user'
import { Guild, Channel } from '../event/base/guild'

/**
 * 文本数据
 */
export type DataTextType = {
  type: 'Text'
  value: string
  options?: {
    style?: 'none' | 'bold' | 'block' | 'strikethrough' | 'boldItalic' | 'italic'
  }
}

/**
 * 图片数据
 */
export type DataImageType = {
  type: 'Image'
  value: Buffer
}

/**
 * 图片链接
 */
export type DataImageURLType = {
  type: 'ImageURL'
  value: string
}

/**
 * 图片文件
 */
export type DataImageFileType = {
  type: 'ImageFile'
  value: string
}

/**
 * 提及数据
 */
export type DataMentionType = {
  type: 'Mention'
  value?: string
  options?: {
    belong?: 'user' | 'guild' | 'channel' | 'everyone'
    payload?: User | Guild | Channel | 'everyone'
  }
}

export type DataParseType = {
  Text: DataTextType
  Image: DataImageType
  ImageURL: DataImageURLType
  ImageFile: DataImageFileType
  Mention: DataMentionType
}

export type ParseType = {
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

export type DataEnums =
  | DataTextType
  | DataImageType
  | DataImageURLType
  | DataImageFileType
  | DataMentionType

export type MessageDataFormat = DataEnums[]
