import { DataMention, DataImage, DataText, DataImageURL, DataImageFile } from '../typings'

/**
 * 文本消息
 * @param val
 * @param options
 * @returns
 */
export const Text = (val: DataText['value'], options?: DataText['options']): DataText => {
  return {
    type: 'Text',
    value: val,
    options
  }
}

/**
 * 图片消息
 * @param val
 * @returns
 */
export const Image = (val: DataImage['value']): DataImage => {
  return {
    type: 'Image',
    value: val
  }
}

/**
 * 图片链接，http 或 https 开头
 * @param val
 * @returns
 */
export const ImageURL = (val: DataImageURL['value']): DataImageURL => {
  return {
    type: 'ImageURL',
    value: val
  }
}

/**
 * 本地图片文件
 * @param val
 * @returns
 */
export const ImageFile = (val: DataImageFile['value']): DataImageFile => {
  return {
    type: 'ImageFile',
    value: val
  }
}

/**
 * 提及
 * @param UserId 默认 @ 所有人
 * @param options 默认 user
 * @returns
 */
export const Mention = (
  UserId?: DataMention['value'],
  options?: DataMention['options']
): DataMention => {
  return {
    type: 'Mention',
    value: UserId,
    //
    options: options ?? {
      belong: 'user'
    }
  }
}
