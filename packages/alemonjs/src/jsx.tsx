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
  DataButton
} from './typings.js'
import { sendToChannel as toChannel, sendToUser as toUser, useSend as useS } from './post.js'

import {
  Text as AText,
  ImageURL as AImageURL,
  ImageFile as AImageFile,
  Image as AImage,
  Mention as AMention
} from './post.js'

/**
 *
 * @param _props
 * @returns
 */
export function Text(_props: {
  children: DataText['value'] | DataText['value'][]
  style?: DataText['options']['style']
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
export function Image(_props: { value: DataImage['value'] }) {
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

// BT.group 子组件
BT.group = _props => {
  return React.createElement('div', {
    dataType: 'BT.group'
  })
}

BT.template = _props => {
  return React.createElement('div', {
    dataType: 'BT.group'
  })
}

// BT.row 子组件
BT.row = _props => {
  return React.createElement('div', {
    dataType: 'BT.row'
  })
}

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
    } else if (dataType === 'BT.group') {
      console.log('Button', props, item.type())
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

// const Send = (..._x: any[]) => {
//   //
// }

// Send(
//   <BT.template id="12121" />,
//   <BT.group>
//     <BT.row><BT text="登录" data="/登录游戏" /><BT text="退出" data="/退出游戏" /></BT.row>
//     <BT.row><BT text="是否同意" data={{ "click": "/点击", "confirm": "/同意", "cancel": "/不同意" }} /></BT.row>
//     <BT.row><BT text="百度一下" data="htts://baidu.com" isLink /></BT.row>
//     <BT.row><BT text="自动" data="/自动发出" autoEnter /></BT.row>
//     <BT.row><BT text="禁用的" data="/点不了" toolTip="不支持点击" /></BT.row>
//   </BT.group>
// )
