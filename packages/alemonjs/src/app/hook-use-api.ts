import { DataEnums, EventKeys, Events, User } from '../typings'
import { ChildrenApp } from './store'

/**
 * 使用提及。
 * @param {Object} event - 事件对象，包含触发提及的相关信息。
 */
export const useMention = <T extends EventKeys>(event: Events[T]) => {
  if (!event || typeof event !== 'object') {
    throw new Error('Invalid event: event must be an object')
  }
  let res: User[] = null
  type Options = {
    UserId?: string
    UserKey?: string
    UserName?: string
    IsMaster?: boolean
    IsBot?: boolean
  }
  const mention = {
    find: async (options: Options) => {
      if (!res) {
        res = await alemonjsBot.api.use.mention(event)
      }
      // 过滤出符合条件的数据
      const data = res.filter(item => {
        if (options.UserId && item.UserId !== options.UserId) {
          return false
        }
        if (options.UserKey && item.UserKey !== options.UserKey) {
          return false
        }
        if (options.UserName && item.UserName !== options.UserName) {
          return false
        }
        if (options.IsMaster && item.IsMaster !== options.IsMaster) {
          return false
        }
        if (options.IsBot && item.IsBot !== options.IsBot) {
          return false
        }
        return true
      })
      return data
    },
    findOne: async (
      options: Options = {
        IsBot: false
      }
    ) => {
      if (!res) {
        res = await alemonjsBot.api.use.mention(event)
      }
      // 根据条件查找
      const data = res.find(item => {
        if (options.UserId && item.UserId !== options.UserId) {
          return false
        }
        if (options.UserKey && item.UserKey !== options.UserKey) {
          return false
        }
        if (options.UserName && item.UserName !== options.UserName) {
          return false
        }
        if (options.IsMaster && item.IsMaster !== options.IsMaster) {
          return false
        }
        if (options.IsBot && item.IsBot !== options.IsBot) {
          return false
        }
        return true
      })
      return data
    }
  }
  return [mention]
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
