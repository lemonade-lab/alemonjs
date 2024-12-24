import { AEvents } from '../typing/event/map'
import { expendEvent } from './event-processor-event'

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
  // 不再消息匹配
  expendEvent(event, select)
  return
}
