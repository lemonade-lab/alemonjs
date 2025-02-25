import {
  DataMentionType,
  DataImageType,
  DataTextType,
  DataImageURLType,
  DataImageFileType
} from '../typings'

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
 * 图片链接，http 或 https 开头
 * @param val
 * @returns
 */
export const ImageURL = (val: DataImageURLType['value']): DataImageURLType => {
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
export const ImageFile = (val: DataImageFileType['value']): DataImageFileType => {
  return {
    type: 'ImageFile',
    value: val
  }
}

/**
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
