export type DataTextType = {
  type: 'Text'
  value: string
  typing: 'none' | 'bold' | 'block' | 'strikethrough' | 'boldItalic' | 'italic'
}

export type DataImageType = {
  type: 'Image'
  value: string | Buffer
  typing?: 'buffer' | 'file'
}

export type DataAtType = {
  type: 'At'
  value: string
  typing: 'user' | 'guild' | 'channel' | 'everyone'
  name: string
  avatar: string
  bot: boolean
}

export type DataLinkType = {
  type: 'Link'
  title: string
  value: string
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
  name: string
  url: string
}

export type DataVideoType = {
  type: 'Video'
  url: string
}

export type DataVoiceType = {
  type: 'Voice'
  url: string
}

export type DataButtonType = {
  type: 'Button'
  value: string
  typing: string
}

export type DataBtBoxType = {
  type: 'BtBox'
  flex: 'Col' | 'Row'
  value: any[]
}

export type DataFilesType = {
  type: 'Files'
  value: string
}

export type DataParseType = {
  Text: DataTextType
  Image: DataImageType
  Link: DataLinkType
  At: DataTextType
  Button: DataButtonType
  Files: DataFilesType
  Voice: DataVoiceType
  Video: DataVideoType
  BtBox: DataBtBoxType
}

export type ParseType = {
  Text: string | undefined
  Image: Buffer[] | undefined
  Link: any
  At: { value: string; typing: string; name: string; avatar: string; bot: boolean }[] | undefined
  Button: any
  Files: any
  Voice: any
  Video: any
  BtBox: any
}

export type DataEnums =
  | DataAtType
  | DataEmojiType
  | DataEmbedType
  | DataArkType
  | DataLinkType
  | DataImageType
  | DataFileType
  | DataTextType
  | DataVideoType
  | DataVoiceType
  | DataBtBoxType
  | DataFilesType
