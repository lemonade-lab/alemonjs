/**
 * @fileoverview 消息处理快
 * 登录模块向核心模块发送数据
 * 核心模块调用模块索引
 * @module processor
 * @author ningmengchongshui
 */
import { Next, Events } from '../typings'
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
const Log = <T extends keyof Events>(event: Events[T], select: T) => {
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
export const expendCycle = async <T extends keyof Events>(valueEvent: Events[T], select: T) => {
  const nextEnd: Next = () => {
    return
  }
  // unmount
  const nextUnMount: Next = (cn, ...cns) => {
    if (cn) {
      nextEnd(...cns)
      return
    }
    expendSubscribeUnmount(valueEvent, select, nextEnd)
  }
  // event
  const nextEvent: Next = (cn, ...cns) => {
    if (cn) {
      nextUnMount(...cns)
      return
    }
    expendEvent(valueEvent, select, nextUnMount)
  }
  // mount
  const nextMount: Next = (cn, ...cns) => {
    if (cn) {
      nextEvent(...cns)
      return
    }
    expendSubscribeMount(valueEvent, select, nextEvent)
  }
  // middleware
  const nextCreate: Next = (cn, ...cns) => {
    if (cn) {
      nextMount(...cns)
      return
    }
    expendMiddleware(valueEvent, select, nextMount)
  }
  const log = Log(valueEvent, select)
  logger.info(log.join(''))
  // create
  expendSubscribeCreate(valueEvent, select, nextCreate)
}
