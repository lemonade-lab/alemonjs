import { DataEnums, EventKeys, Events } from '../typings'
import { ChildrenApp } from './store'

/**
 * 使用提及。
 * @param {Object} event - 事件对象，包含触发提及的相关信息。
 */
export const useMention = async <T extends EventKeys>(event: Events[T]) => {
  if (!event || typeof event !== 'object') {
    throw new Error('Invalid event: event must be an object')
  }
  try {
    return await alemonjsBot.api.use.mention(event)
  } catch (e) {
    logger.error('Failed to mention:', e)
    // 弹出错误
    throw e
  }
}

/**
 * 使用发送消息。
 * @param {Object} event - 事件对象，包含触发发送的相关信息。
 * @returns {Function} - 返回一个异步函数，用于发送消息。
 * @throws {Error} - 如果 event 无效，抛出错误。
 */
export const useSend = <T extends EventKeys>(event: Events[T]) => {
  if (!event || typeof event !== 'object') {
    throw new Error('Invalid event: event must be an object')
  }
  return async (...val: DataEnums[]) => {
    if (!val || val.length === 0) {
      logger.error('Invalid val: val must be a non-empty array')
      return
    }
    try {
      return await alemonjsBot.api.use.send(event, val)
    } catch (e) {
      logger.error('Failed to send message:', e)
      // 弹出错误
      throw e
    }
  }
}

/**
 * 卸载模块
 * @param name
 */
export const unChildren = (name: string = 'main') => {
  const app = new ChildrenApp(name)
  app.un()
}

/**
 * 废弃,请使用unChildren
 * @deprecated
 */
export const unMount = () => {
  // 警告，已废弃。
  console.warn('unMount 已废弃，请使用 unChildren')
}

/**
 *
 * @param values
 * @returns
 */
export const createSelects = <T extends EventKeys[] | EventKeys>(values: T) => values
