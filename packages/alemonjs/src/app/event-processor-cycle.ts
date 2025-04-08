/**
 * @fileoverview 消息处理快
 * 登录模块向核心模块发送数据
 * 核心模块调用模块索引
 * @module processor
 * @author ningmengchongshui
 */
import { Next, Events, EventKeys } from '../typings'
import { ResultCode } from '../code'
import { expendEvent } from './event-processor-event'
import { expendMiddleware } from './event-processor-middleware'
import {
  expendSubscribeCreate,
  expendSubscribeMount,
  expendSubscribeUnmount
} from './event-processor-subscribe'
import { getConfigValue } from '../config'

/**
 * 打印日志
 * @param event
 * @param select
 */
const showLog = <T extends EventKeys>(event: Events[T], select: T) => {
  const log = {
    Name: select
  }
  if (typeof event['ChannelId'] == 'string' && event['ChannelId'] != '') {
    log['ChannelId'] = event['ChannelId']
  }
  if (typeof event['UserKey'] == 'string' && event['UserKey'] != '') {
    log['UserKey'] = event['UserKey']
  }
  if (typeof event['UserId'] == 'string' && event['UserId'] != '') {
    log['UserId'] = event['UserId']
  }
  if (typeof event['MessageId'] == 'string' && event['MessageId'] != '') {
    log['MessageId'] = event['MessageId']
  }
  if (typeof event['MessageText'] == 'string' && event['MessageText'] != '') {
    log['MessageText'] = event['MessageText']
  }
  logger.info({
    code: ResultCode.Ok,
    message: 'new event',
    data: log
  })
}

/**
 * 消息体处理机制
 * @param event
 * @param key
 */
export const expendCycle = async <T extends EventKeys>(valueEvent: Events[T], select: T) => {
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
  const value = getConfigValue() ?? {}
  if (Array.isArray(value?.logs?.channel_id)) {
    const channelIds = value?.logs?.channel_id
    if (channelIds && channelIds.length > 0 && channelIds.includes(valueEvent['ChannelId'])) {
      showLog(valueEvent, select)
    }
  } else {
    showLog(valueEvent, select)
  }
  // create
  expendSubscribeCreate(valueEvent, select, nextCreate)
}
