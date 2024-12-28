import { AEvents } from '../typing/event/map'
import { expendCycle } from './event-processor-cycle'

/**
 * 消息处理器
 * @param event
 * @param select
 * @returns
 */
export const OnProcessor = <T extends keyof AEvents>(event: AEvents[T], select: T) => {
  // 不再消息匹配
  expendCycle(event, select)
  return
}
