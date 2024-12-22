import {
  DataArkType,
  DataMentionType,
  DataEmbedType,
  DataEmojiType,
  DataImageType,
  DataLinkType,
  DataTextType,
  DataButtonType,
  DataButtonBoxType,
  DataFileType,
  DataVideoType,
  DataVoiceType
} from '../typing/message'
export const Text = (val: string, options?: DataTextType['options']): DataTextType => {
  return {
    type: 'Text',
    value: val,
    options
  }
}
export const Image = (val: Buffer): DataImageType => {
  return {
    type: 'Image',
    value: val
  }
}
export const Mention = (
  UserId: string | 'everyone',
  options?: DataMentionType['options']
): DataMentionType => {
  return {
    type: 'Mention',
    value: UserId ?? 'everyone',
    options
  }
}

export const Link = (value: string, options: DataLinkType['options']): DataLinkType => {
  return {
    type: 'Link',
    value,
    options
  }
}
export const Ark = (val: any): DataArkType => {
  return {
    type: 'Ark',
    value: val
  }
}
export const Embed = (val: any): DataEmbedType => {
  return {
    type: 'Embed',
    value: val
  }
}
export const Emoji = (val: 1): DataEmojiType => {
  return {
    type: 'Emoji',
    value: val
  }
}
export const Button = (title: string, options: DataButtonType['options']): DataButtonType => {
  return {
    type: 'Button',
    value: title,
    options
  }
}
export const ButtonBox = (value: any, options: DataButtonBoxType['options']): DataButtonBoxType => {
  return {
    type: 'ButtonBox',
    value: value,
    options
  }
}
export const File = (val: string): DataFileType => {
  return {
    type: 'File',
    value: val
  }
}
export const Video = (val: string): DataVideoType => {
  return {
    type: 'Video',
    value: val
  }
}
export const Voice = (val: any): DataVoiceType => {
  return {
    type: 'Voice',
    value: val
  }
}
