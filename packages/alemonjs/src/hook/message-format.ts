import {
  DataArkType,
  DataAtType,
  DataEmbedType,
  DataEmojiType,
  DataImageType,
  DataLinkType,
  DataTextType
} from './message-typing'

/**
 * 文本数据
 */
export const Text = (val: string, typing?: DataTextType['typing']): DataTextType => {
  return {
    type: 'Text',
    value: val,
    typing: typing ?? 'none'
  }
}

/**
 * 图片数据
 * @param val
 */
export const Image = (val: Buffer | string, typing?: 'buffer' | 'file'): DataImageType => {
  return {
    type: 'Image',
    value: val,
    typing: typing ?? 'buffer'
  }
}

/**
 *
 * @param val
 */
export const At = (
  UserID?: string,
  typing?: 'user' | 'guild' | 'channel' | 'everyone',
  val?: any
): DataAtType => {
  return {
    type: 'At',
    value: UserID ?? 'everyone',
    typing: UserID ? typing : 'everyone',
    name: val?.name ?? '',
    avatar: val?.avatar ?? '',
    bot: val?.bot ?? false
  }
}

/**
 *
 * @param title
 * @param url
 */
export const Button = (
  title: string,
  options: {
    send?: string
    enter?: boolean
    reply?: boolean
    tip?: string
    color?: 'blue' | 'slate'
    permission?: 'user' | 'admin'
  }
) => {
  return {
    type: 'Button',
    value: title,
    options
  }
}

/**
 *
 * @param flex "
 * @param arg
 * @returns
 */
export const BtBox = (flex: 'Col' | 'Row', ...arg: any) => {
  return {
    type: 'BtBox',
    value: arg,
    flex
  }
}

/**
 *
 * @param val
 * @returns
 */
export const Files = (val: string) => {
  return {
    type: 'Files',
    value: val
  }
}

/**
 *
 * @param val
 * @returns
 */
export const Video = (val: string) => {
  return {
    type: 'Video',
    value: val
  }
}

/**
 *
 * @param val
 */
export const Voice = (val: any) => {
  return {
    type: 'Voice',
    value: val
  }
}

/**
 *
 * @param title
 * @param value
 * @returns
 */
export const Link = (title: string, value: string): DataLinkType => {
  return {
    type: 'Link',
    title,
    value
  }
}

/**
 *
 * @param val
 * @returns
 */
export const Ark = (val: any): DataArkType => {
  return {
    type: 'Ark',
    value: val
  }
}

/**
 *
 * @param val
 */
export const Embed = (val: any): DataEmbedType => {
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
export const Emoji = (val: 1): DataEmojiType => {
  return {
    type: 'Emoji',
    value: val
  }
}
