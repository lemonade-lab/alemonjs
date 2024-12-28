/**
 * @fileoverview 消息处理快
 * 登录模块向核心模块发送数据
 * 核心模块调用模块索引
 * @module processor
 * @author ningmengchongshui
 */
import { Next } from '../global'
import { AEvents } from '../typing/event/map'
import { expendEvent } from './event-processor-event'
import { expendMiddleware } from './event-processor-middleware'
import {
  expendSubscribeCreate,
  expendSubscribeMount,
  expendSubscribeUnmount
} from './event-processor-subscribe'

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
  if (typeof event['UserKey'] == 'string' && event['UserKey'] != '') {
    logs.push(`[${event['UserKey']}]`)
  }
  if (Array.isArray(event['MessageBody'])) {
    const content = event['MessageBody'].filter(item => item.type == 'Text').map(item => item.value)
    const txt = content.join('')
    logs.push(`[${txt}]`)
  }
  return logs
}

/**
 * 消息体处理机制
 * @param event
 * @param key
 */
export const expendCycle = async <T extends keyof AEvents>(valueEvent: AEvents[T], select: T) => {
  const nextEnd = () => {
    // 结束
  }
  const nextUnMount: Next = isCycle => {
    if (isCycle) {
      nextEnd()
      return
    }
    // 当消息被正常卸载时，说明消息没有被处理
    expendSubscribeUnmount(valueEvent, select, nextEnd)
  }
  const nextEvent: Next = isCycle => {
    if (isCycle) {
      nextUnMount()
      return
    }
    expendEvent(valueEvent, select, nextUnMount)
  }
  const nextMount: Next = isCycle => {
    if (isCycle) {
      nextEvent()
      return
    }
    expendSubscribeMount(valueEvent, select, nextEvent)
  }
  const nextCreate: Next = isCycle => {
    if (isCycle) {
      nextMount()
      return
    }
    expendMiddleware(valueEvent, select, nextMount)
  }
  const log = Log(valueEvent, select)
  logger.info(log.join(''))
  // 开始
  expendSubscribeCreate(valueEvent, select, nextCreate)
}
