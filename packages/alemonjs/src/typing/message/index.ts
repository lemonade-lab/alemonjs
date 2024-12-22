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
 * 提及数据
 */
export type DataMentionType = {
  type: 'Mention'
  value: string
  options?: {
    belong?: 'user' | 'guild' | 'channel' | 'everyone'
    payload?: User | Guild | Channel | 'everyone'
  }
}

export type DataLinkType = {
  type: 'Link'
  value: string
  options?: {
    title?: string
  }
}

export type DataEmojiType = {
  type: 'Emoji'
  value: 1
}

export type DataEmbedType = {
  type: 'Embed'
  value: any
}

export type DataArkType = {
  type: 'Ark'
  value: any
}

export type DataFileType = {
  type: 'File'
  value: any
}

export type DataVideoType = {
  type: 'Video'
  value: any
}

export type DataVoiceType = {
  type: 'Voice'
  value: any
}

export type DataButtonType = {
  type: 'Button'
  value: any
  options?: {
    send?: string
    enter?: boolean
    reply?: boolean
    tip?: string
    color?: 'blue' | 'slate'
    permission?: 'user' | 'admin'
  }
}

export type DataButtonBoxType = {
  type: 'ButtonBox'
  value: any
  options?: {
    display: 'flex-col' | 'flex-row'
  }
}

export type DataParseType = {
  Text: DataTextType
  Image: DataImageType
  Link: DataLinkType
  Mention: DataMentionType
  Button: DataButtonType
  File: DataFileType
  Voice: DataVoiceType
  Video: DataVideoType
  ButtonBox: DataButtonBoxType
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
  | DataMentionType
  | DataEmojiType
  | DataEmbedType
  | DataArkType
  | DataLinkType
  | DataImageType
  | DataFileType
  | DataTextType
  | DataVideoType
  | DataVoiceType
  | DataButtonBoxType
  | DataFileType

export type MessageDataFormat = DataEnums[]
