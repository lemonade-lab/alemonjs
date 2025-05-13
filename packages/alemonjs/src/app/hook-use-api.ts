import { DataEnums, EventKeys, Events, User } from '../typings'
import { ResultCode } from '../core/code'
import { ChildrenApp } from './store'
import { createResult } from './utils'

/**
 * 使用提及。
 * @param {Object} event - 事件对象，包含触发提及的相关信息。
 * @throws {Error} - 如果 event 无效，抛出错误。
 */
export const useMention = <T extends EventKeys>(event: Events[T]) => {
  if (!event || typeof event !== 'object') {
    logger.error({
      code: ResultCode.FailParams,
      message: 'Invalid event: event must be an object',
      data: null
    })
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
      try {
        if (!res) {
          res = await alemonjsBot.api.use.mention(event)
        }
      } catch (err) {
        return createResult(ResultCode.Fail, err?.message || 'Failed to get mention data', null)
      }
      if (!Array.isArray(res)) {
        return createResult(ResultCode.Fail, 'No mention data found', null)
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
      return createResult(ResultCode.Ok, 'Successfully retrieved mention data', data)
    },
    findOne: async (
      options: Options = {
        IsBot: false
      }
    ) => {
      try {
        if (!res) {
          res = await alemonjsBot.api.use.mention(event)
        }
      } catch (err) {
        return createResult(ResultCode.Fail, err?.message || 'Failed to get mention data', null)
      }
      if (!Array.isArray(res)) {
        return createResult(ResultCode.Fail, 'No mention data found', null)
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
      if (!data) {
        return createResult(ResultCode.Fail, 'No mention data found', null)
      }
      return createResult(ResultCode.Ok, 'Successfully retrieved mention data', data)
    }
  }
  return [mention]
}

/**
 * 使用发送消息。
 * @param {Object} event - 事件对象，包含触发发送的相关信息。
 * @throws {Error} - 如果 event 无效，抛出错误。
 */
export const useSend = <T extends EventKeys>(event: Events[T]) => {
  if (!event || typeof event !== 'object') {
    logger.error({
      code: ResultCode.FailParams,
      message: 'Invalid event: event must be an object',
      data: null
    })
    throw new Error('Invalid event: event must be an object')
  }
  return async (...val: DataEnums[]) => {
    if (!val || val.length === 0) {
      return createResult(ResultCode.FailParams, 'Invalid val: val must be a non-empty array', null)
    }
    return await alemonjsBot.api.use.send(event, val)
  }
}

export const useSends = <T extends EventKeys>(event: Events[T]) => {
  if (!event || typeof event !== 'object') {
    logger.error({
      code: ResultCode.FailParams,
      message: 'Invalid event: event must be an object',
      data: null
    })
    throw new Error('Invalid event: event must be an object')
  }
  const send = async (val: DataEnums[]) => {
    if (!val || val.length === 0) {
      return createResult(ResultCode.FailParams, 'Invalid val: val must be a non-empty array', null)
    }
    return await alemonjsBot.api.use.send(event, val)
  }
  return [send]
}

/**
 * 卸载模块
 * @param name
 * @throws {Error} - 如果 name 无效，抛出错误。
 */
export const unChildren = (name: string = 'main') => {
  if (!name || typeof name !== 'string') {
    logger.error({
      code: ResultCode.FailParams,
      message: 'Invalid name: name must be a string',
      data: null
    })
    throw new Error('Invalid name: name must be a string')
  }
  const app = new ChildrenApp(name)
  app.un()
}

/**
 * 废弃,请使用unChildren
 * @deprecated
 */
export const unMount = () => {
  logger.warn({
    code: ResultCode.Warn,
    message: 'unMount is deprecated, please use unChildren',
    data: null
  })
}

/**
 * 创建选择器
 * @param values
 * @returns
 */
export const onSelects = <T extends EventKeys[] | EventKeys>(values: T) => values
global.onSelects = onSelects

/**
 * 废弃,请使用onSelects
 * @deprecated
 */
export const createSelects = onSelects
