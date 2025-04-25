import React from 'react'
import { logger } from './global.js'
import {
  DataEnums,
  DataImageFile,
  DataImage,
  DataImageURL,
  DataMention,
  DataText,
  Events,
  EventKeys,
  DataButton,
  ButtonRow
} from './typings.js'
import { sendToChannel as toChannel, sendToUser as toUser, useSend as useS } from './post.js'

import {
  Text as AText,
  ImageURL as AImageURL,
  ImageFile as AImageFile,
  Image as AImage,
  Mention as AMention,
  BT as ABT
} from './post.js'
import { ResultCode } from './core/code.js'

/**
 *
 * @param _props
 * @returns
 */
export function Text(
  _props:
    | {
        children?: DataText['value'] | DataText['value'][]
        style?: DataText['options']['style']
      }
    | {
        value?: DataText['value'] | DataText['value'][]
        style?: DataText['options']['style']
      }
) {
  return React.createElement('div', {
    dataType: 'Text'
  })
}

const Image: React.FC<{ value: DataImage['value'] }> & {
  url: React.FC<{ src: DataImageURL['value'] }>
  file: React.FC<{ src: DataImageURL['value'] }>
} = _props => {
  return React.createElement('div', {
    dataType: 'Image'
  })
}

// BT.group 子组件
Image.url = _props => {
  return React.createElement('div', {
    dataType: 'ImageURL'
  })
}

Image.file = _props => {
  return React.createElement('div', {
    dataType: 'ImageFile'
  })
}

export { Image }

/**
 *
 * @param _props
 * @returns
 */
export function ImageFile(_props: { src: DataImageFile['value'] }) {
  return React.createElement('div', {
    dataType: 'ImageFile'
  })
}

/**
 *
 * @param _props
 * @returns
 */
export function ImageURL(_props: { src: DataImageURL['value'] }) {
  return React.createElement('div', {
    dataType: 'ImageURL'
  })
}

/**
 *
 * @param _props
 * @returns
 */
export function Mention(_props: {
  belong?: DataMention['options']['belong']
  value: DataMention['value']
}) {
  return React.createElement('div', {
    dataType: 'Mention'
  })
}

interface BTProps {
  text: DataButton['value']
  data: DataButton['options']['data']
  autoEnter?: DataButton['options']['autoEnter']
  toolTip?: DataButton['options']['toolTip']
  showList?: DataButton['options']['showList']
  isLink?: DataButton['options']['isLink']
  children?: DataButton['value']
}

const BT: React.FC<BTProps> & {
  group: React.FC<{ children?: React.ReactNode }>
  row: React.FC<{ children?: React.ReactNode }>
  template: React.FC<{ id: string }>
} = _props => {
  return React.createElement('div', {
    dataType: 'Button'
  })
}

function ButtonGroup(_props: { children: React.ReactNode }) {
  return React.createElement('div', {
    dataType: 'BT.group'
  })
}

function ButtonRows(_props: { children: React.ReactNode }) {
  return React.createElement('div', {
    dataType: 'BT.row'
  })
}

function ButtonTemplate(_props: { id: string }) {
  return React.createElement('div', {
    dataType: 'BT.group'
  })
}

// BT.group 子组件
BT.group = ButtonGroup
// BT.template 子组件
BT.template = ButtonTemplate
// BT.row 子组件
BT.row = ButtonRows

export { BT }

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
      if (props?.value) {
        data.push(
          AText(props.value, {
            style: props?.style
          })
        )
      } else if (props?.children) {
        data.push(
          AText(Array.isArray(props.children) ? props.children.join('') : props.children, {
            style: props?.style
          })
        )
      }
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
    } else if (dataType === 'BT.group') {
      const id = props?.id
      if (id) {
        data.push(ABT.template(id))
      } else {
        if (Array.isArray(props?.children)) {
          const rows: ButtonRow[] = []
          for (const child of props?.children) {
            // 拿到每个子组件
            const bts: DataButton[] = []
            if (Array.isArray(child.children)) {
              for (const chi of child.children) {
                // const type = chi.children
                const value = chi.props?.text
                const data = chi.props?.data
                const options = {}
                if (chi.props?.autoEnter) {
                  options['autoEnter'] = chi.props?.autoEnter ? true : false
                }
                if (chi.props?.toolTip) {
                  options['toolTip'] = chi.props?.toolTip ?? ''
                }
                if (chi.props?.showList) {
                  options['showList'] = chi.props?.showList ? true : false
                }
                if (chi.props?.isLink) {
                  options['isLink'] = chi.props?.isLink ? true : false
                }
                bts.push(ABT(value, data, options))
              }
            }
            rows.push(ABT.row(...bts))
          }
          data.push(ABT.group(...rows))
        }
      }
    }
  }
  if (data.length === 0) {
    logger.warn({
      code: ResultCode.FailParams,
      message: 'Invalid data: data must be a non-empty array',
      data: null
    })
  }
  return data
}

/**
 * 发送消息
 * @param e
 * @returns
 */
export const useSend = <T extends EventKeys>(e: Events[T]) => {
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
