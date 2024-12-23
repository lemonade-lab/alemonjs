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
export const Text = (
  val: DataTextType['value'],
  options?: DataTextType['options']
): DataTextType => {
  return {
    type: 'Text',
    value: val,
    options
  }
}
export const Image = (val: DataImageType['value']): DataImageType => {
  return {
    type: 'Image',
    value: val
  }
}

/**
 *
 * @param UserId 默认 @ 所有人
 * @param options 默认 user
 * @returns
 */
export const Mention = (
  UserId?: DataMentionType['value'],
  options?: DataMentionType['options']
): DataMentionType => {
  return {
    type: 'Mention',
    value: UserId,
    //
    options: options ?? {
      belong: 'user'
    }
  }
}

export const Link = (
  value: DataLinkType['value'],
  options: DataLinkType['options']
): DataLinkType => {
  return {
    type: 'Link',
    value,
    options
  }
}
export const Ark = (val: DataArkType['value']): DataArkType => {
  return {
    type: 'Ark',
    value: val
  }
}
export const Embed = (val: DataEmbedType['value']): DataEmbedType => {
  return {
    type: 'Embed',
    value: val
  }
}
export const Emoji = (val: DataEmojiType['value']): DataEmojiType => {
  return {
    type: 'Emoji',
    value: val
  }
}
export const Button = (
  title: DataButtonType['value'],
  options: DataButtonType['options']
): DataButtonType => {
  return {
    type: 'Button',
    value: title,
    options
  }
}
export const ButtonBox = (
  value: DataButtonBoxType['value'],
  options: DataButtonBoxType['options']
): DataButtonBoxType => {
  return {
    type: 'ButtonBox',
    value: value,
    options
  }
}
export const File = (val: DataFileType['value']): DataFileType => {
  return {
    type: 'File',
    value: val
  }
}
export const Video = (val: DataVideoType['value']): DataVideoType => {
  return {
    type: 'Video',
    value: val
  }
}
export const Voice = (val: DataVoiceType['value']): DataVoiceType => {
  return {
    type: 'Voice',
    value: val
  }
}
