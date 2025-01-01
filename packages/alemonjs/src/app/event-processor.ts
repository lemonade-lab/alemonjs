import { Events } from '../typing/event/map'
import { expendCycle } from './event-processor-cycle'

/**
 * 消息处理器
 * @param event
 * @param name
 * @returns
 */
export const OnProcessor = <T extends keyof Events>(event: Events[T], name: T) => {
  // 不再消息匹配
  event['name'] = name
  expendCycle(event, name)
  return
}
