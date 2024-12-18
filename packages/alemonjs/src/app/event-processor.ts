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
 * @param event
 * @param select
 */
const Log = <T extends keyof AEvents>(event: AEvents[T], select: T) => {
  const logs = [`[${select}]`]
  if (typeof event['ChannelId'] == 'string' && event['ChannelId'] != '') {
    logs.push(`[${event['ChannelId']}]`)
  }
  if (typeof event['UserId'] == 'string' && event['UserId'] != '') {
    logs.push(`[${event['UserId']}]`)
  }
  if (Array.isArray(event['MessageBody'])) {
    const txt = useParse(event as any, 'Text')
    if (typeof txt == 'string' && txt != '') {
      logs.push(`[${txt}]`)
    }
  }
  logger.info(logs.join(''))
}

/**
 * 消息处理器
 * @param event
 * @param select
 * @returns
 */
export const OnProcessor = <T extends keyof AEvents>(event: AEvents[T], select: T) => {
  // 打印
  Log(event, select)
  // 选择处理
  switch (select) {
    case 'message.create':
      // 处理公有消息
      expendMessage(event as EventMessageCreate, 'message.create')
      break
    case 'private.message.create':
      // 处理私有消息
      expendMessage(event as EventMessageCreate, 'private.message.create')
      break
    default: {
      // 无消息体处理
      expendEvent(event as any, select)
      break
    }
  }
  return
}
