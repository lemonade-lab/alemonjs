import {
  DataArkType,
  DataEmbedType,
  DataEmojiType,
  DataLinkType,
  DataTextType
} from './message-typing'
/**
 * 发送文本
 */
export const Text = (val: any, typing?: DataTextType['typing']): DataTextType => {
  return {
    type: 'Text',
    value: val,
    typing: typing ?? 'none'
  }
}

/**
 *
 * @param val
 */
export const At = (user_id?: string, typing?: 'user' | 'guild' | 'channel') => {
  return {
    type: 'At',
    value: user_id,
    typing
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

export const BtBox = (flex: 'Col' | 'Row', ...arg: any) => {
  return {
    type: 'BtBox',
    value: arg,
    flex
  }
}

/**
 * 发送文件
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
 * @param val
 */
export const Image = (val: Buffer | string, typing?: 'buffer' | 'file' | 'network') => {
  return {
    type: 'Image',
    value: val,
    typing
  }
}

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
 * 发送表态
 * @param val
 */
export const Emoji = (val: 1): DataEmojiType => {
  return {
    type: 'Emoji',
    value: val
  }
}
