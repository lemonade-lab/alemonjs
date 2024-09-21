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

export type DataLinkType = {
  type: 'Link'
  title: string
  value: string
}

export type DataImageType = {
  type: 'Image'
  value: string | Buffer
  typing?: 'buffer' | 'file'
}

export type DataFileType = {
  type: 'File'
  name: string
  url: string
}

export type DataTextType = {
  type: 'Text'
  value: string
  typing: 'none' | 'bold' | 'block' | 'strikethrough' | 'boldItalic' | 'italic'
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
  At: any
  Button: any
  Files: any
  Voice: any
  Video: any
  BtBox: any
}

export type DataEnums =
  | DataEmojiType
  | DataEmbedType
  | DataArkType
  | DataLinkType
  | DataImageType
  | DataFileType
  | DataTextType
  | DataVideoType
  | DataVoiceType
  | DataButtonType
  | DataBtBoxType
  | DataFilesType
