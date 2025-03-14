import React from 'react'
import {
  DataEnums,
  DataImageFileType,
  DataImageType,
  DataImageURLType,
  DataMentionType,
  DataTextType
} from './typings'
import { sendToChannel as toChannel, sendToUser as toUser, useSend as useS } from './post'

import {
  Text as AText,
  ImageURL as AImageURL,
  ImageFile as AImageFile,
  Image as AImage,
  Mention as AMention
} from './post'

/**
 *
 * @param _props
 * @returns
 */
export function Text(_props: {
  children: DataTextType['value'] | DataTextType['value'][]
  style?: DataTextType['options']['style']
}) {
  return React.createElement('div', {
    dataType: 'Text'
  })
}

/**
 *
 * @param _props
 * @returns
 */
export function ImageURL(_props: { src: DataImageURLType['value'] }) {
  return React.createElement('div', {
    dataType: 'ImageURL'
  })
}

/**
 *
 * @param _props
 * @returns
 */
export function ImageFile(_props: { src: DataImageFileType['value'] }) {
  return React.createElement('div', {
    dataType: 'ImageFile'
  })
}

/**
 *
 * @param _props
 * @returns
 */
export function Image(_props: { value: DataImageType['value'] }) {
  return React.createElement('div', {
    dataType: 'Image'
  })
}

/**
 *
 * @param _props
 * @returns
 */
export function Mention(_props: {
  belong?: DataMentionType['options']['belong']
  value: DataMentionType['value']
}) {
  return React.createElement('div', {
    dataType: 'Mention'
  })
}

/**
 *  转换数据
 * ***
 * 原则上，显示文本。使用 children 属性
 * ***
 * 其他类型使用 value 属性
 * ***
 * 如果是资源文件，使用 src 属性
 * ***
 * @param arg
 * @returns
 */
export function JSX(...arg: React.JSX.Element[]) {
  const data: DataEnums[] = []
  for (const item of arg) {
    const props = item.props
    const dataType = item.type()?.props?.dataType
    if (dataType === 'Text') {
      if (!props?.children) continue
      data.push(
        AText(Array.isArray(props.children) ? props.children.join('') : props.children, {
          style: props?.style
        })
      )
    } else if (dataType === 'ImageURL') {
      data.push(AImageURL(props.src))
    } else if (dataType === 'ImageFile') {
      data.push(AImageFile(props.src))
    } else if (dataType === 'Image') {
      data.push(AImage(props.value))
    } else if (dataType === 'Mention') {
      // <@!123456>  文本的显示会被平台显示。不用自己定义显示的文本，此处不使用 children
      data.push(
        AMention(
          props.value,
          props?.belong
            ? {
                belong: props?.belong
              }
            : null
        )
      )
    }
  }
  if (data.length === 0) {
    logger.error('Invalid data: data must be a non-empty array')
    return
  }
  return data
}

/**
 * 发送消息
 * @param e
 * @returns
 */
export const useSend = (e: { [key: string]: any }) => {
  const Send = useS(e)
  return (...arg: React.JSX.Element[]) => Send(...JSX(...arg))
}

/**
 *
 * @param channel_id
 * @param data
 * @returns
 */
export const sendToChannel = async (channel_id: string, data: React.JSX.Element[]) => {
  return toChannel(channel_id, JSX(...data))
}

/**
 *
 * @param user_id
 * @param data
 * @returns
 */
export const sendToUser = async (user_id: string, data: React.JSX.Element[]) => {
  return toUser(user_id, JSX(...data))
}
