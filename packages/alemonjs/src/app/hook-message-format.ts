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

/**
 *
 * @param val
 * @param options
 * @returns
 */
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

/**
 *
 * @param val
 * @returns
 */
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

/**
 *
 * @param value
 * @param options
 * @returns
 */
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

/**
 *
 * @param val
 * @returns
 */
export const Ark = (val: DataArkType['value']): DataArkType => {
  return {
    type: 'Ark',
    value: val
  }
}

/**
 *
 * @param val
 * @returns
 */
export const Embed = (val: DataEmbedType['value']): DataEmbedType => {
  return {
    type: 'Embed',
    value: val
  }
}

/**
 *
 * @param val
 * @returns
 */
export const Emoji = (val: DataEmojiType['value']): DataEmojiType => {
  return {
    type: 'Emoji',
    value: val
  }
}

/**
 *
 * @param title
 * @param options
 * @returns
 */
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

/**
 *
 * @param value
 * @param options
 * @returns
 */
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

/**
 *
 * @param val
 * @returns
 */
export const File = (val: DataFileType['value']): DataFileType => {
  return {
    type: 'File',
    value: val
  }
}

/**
 *
 * @param val
 * @returns
 */
export const Video = (val: DataVideoType['value']): DataVideoType => {
  return {
    type: 'Video',
    value: val
  }
}

/**
 *
 * @param val
 * @returns
 */
export const Voice = (val: DataVoiceType['value']): DataVoiceType => {
  return {
    type: 'Voice',
    value: val
  }
}
