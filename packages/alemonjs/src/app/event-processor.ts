/**
 * @fileoverview 消息处理快
 * 登录模块向核心模块发送数据
 * 核心模块调用模块索引
 * @module processor
 * @author ningmengchongshui
 */
import { AEvents } from '../env'
import { expendMessage } from './event-processor-body'
import { useParse } from '../post'
import { expendEvent } from './event-processor-event'
export * from './store'

type EventMessageCreate = AEvents['message.create'] | AEvents['private.message.create']

/**
 *
 * @param value
 * @param select
 */
const Log = <T extends keyof AEvents>(value: AEvents[T], select: T) => {
  const logs = [`[${select}]`]
  if (typeof value['ChannelId'] == 'string' && value['ChannelId'] != '') {
    logs.push(`[${value['ChannelId']}]`)
  }
  if (typeof value['UserId'] == 'string' && value['UserId'] != '') {
    logs.push(`[${value['UserId']}]`)
  }
  if (Array.isArray(value['Megs'])) {
    const txt = useParse(value['Megs'], 'Text')
    if (typeof txt == 'string' && txt != '') {
      logs.push(`[${txt}]`)
    }
  }
  logger.info(logs.join(''))
}

/**
 * 消息处理器
 * @param value
 * @param event
 * @returns
 */
export const OnProcessor = <T extends keyof AEvents>(value: AEvents[T], select: T) => {
  // 打印
  Log(value, select)
  // 选择处理
  switch (select) {
    case 'message.create':
      // 处理公有消息
      expendMessage(value as EventMessageCreate, 'message.create')
      break
    case 'private.message.create':
      // 处理私有消息
      expendMessage(value as EventMessageCreate, 'private.message.create')
      break
    default: {
      // 无消息体处理
      expendEvent(value as any, select)
      break
    }
  }
  return
}
