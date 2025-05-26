import { DataEnums, EventKeys, Events, User } from '../typings'
import { ResultCode } from '../core/code'
import { ChildrenApp } from './store'
import { createResult, Result } from './utils'
import { sendAction } from '../cbp/actions'

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
          const result = await sendAction({
            action: 'mention.get',
            payload: {
              event
            }
          })
          // mention 不能是 数组
          if (Array.isArray(result)) {
            return createResult(ResultCode.Ok, 'Successfully retrieved mention data', null)
          }
          if (result.code !== ResultCode.Ok) {
            return createResult(result.code, result.message, null)
          }
          res = result.data as User[]
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
          const result = await sendAction({
            action: 'mention.get',
            payload: {
              event
            }
          })
          // mention 不能是 数组
          if (Array.isArray(result)) {
            return createResult(ResultCode.Ok, 'Successfully retrieved mention data', null)
          }
          if (result.code !== ResultCode.Ok) {
            return createResult(result.code, result.message, null)
          }
          res = result.data as User[]
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
 * 消息处理
 * @param event
 * @returns
 */
export const useMessage = <T extends EventKeys>(event: Events[T]) => {
  if (!event || typeof event !== 'object') {
    logger.error({
      code: ResultCode.FailParams,
      message: 'Invalid event: event must be an object',
      data: null
    })
    throw new Error('Invalid event: event must be an object')
  }

  /**
   * 发送消息
   * @param val
   * @returns
   */
  const send = async (val: DataEnums[]): Promise<Result[]> => {
    if (!val || val.length === 0) {
      return [
        createResult(ResultCode.FailParams, 'Invalid val: val must be a non-empty array', null)
      ]
    }
    const result = await sendAction({
      action: 'message.send',
      payload: {
        event,
        params: {
          format: val
        }
      }
    })
    return Array.isArray(result) ? result : [result]
  }

  /**
   * 撤回消息
   */
  const withdraw = async (message_id?: string) => {
    return [createResult(ResultCode.Warn, '暂未支持', message_id)]
  }

  /**
   * 转发消息
   */
  const forward = async (message_id?: string) => {
    return [createResult(ResultCode.Warn, '暂未支持', message_id)]
  }

  /**
   * 回复 quote
   * ***
   * 和send区别在于，
   * 如果对应的平台支持引用时，进行引用回复
   */
  const reply = async (message_id?: string) => {
    return [createResult(ResultCode.Warn, '暂未支持', message_id)]
  }

  /**
   * 更新消息
   */
  const update = async (message_id?: string) => {
    return [createResult(ResultCode.Warn, '暂未支持', message_id)]
  }

  /**
   * 置顶消息
   */
  const pinning = async (message_id?: string) => {
    return [createResult(ResultCode.Warn, '暂未支持', message_id)]
  }

  /**
   * 警告消息
   */
  const horn = async (message_id?: string) => {
    return [createResult(ResultCode.Warn, '暂未支持', message_id)]
  }

  /**
   * 表态
   */
  const reaction = async (message_id?: string) => {
    return [createResult(ResultCode.Warn, '暂未支持', message_id)]
  }

  const message = {
    send,
    withdraw,
    forward,
    reply,
    update,
    pinning,
    horn,
    reaction
  }
  return [message]
}

/**
 * 用户处理
 * @deprecated 待支持
 * @param event
 * @returns
 */
export const useMenber = <T extends EventKeys>(event: Events[T]) => {
  if (!event || typeof event !== 'object') {
    logger.error({
      code: ResultCode.FailParams,
      message: 'Invalid event: event must be an object',
      data: null
    })
    throw new Error('Invalid event: event must be an object')
  }

  /**
   * 获取用户信息
   * @param user_id
   * @returns
   */
  const information = async (user_id?: string) => {
    return createResult(ResultCode.Warn, '暂未支持', user_id)
  }

  /**
   * 禁言
   * @param all 是否是全体
   * @returns
   */
  const mute = async (all: boolean = false) => {
    return createResult(ResultCode.Warn, '暂未支持', all)
  }

  /**
   * 解除禁言
   * @param all 是否是全体
   * @returns
   */
  const unmute = async (all: boolean = false) => {
    return createResult(ResultCode.Warn, '暂未支持', all)
  }

  /**
   * 移除用户
   * @param user_id
   * @returns
   */
  const remove = async (user_id?: string) => {
    return createResult(ResultCode.Warn, '暂未支持', user_id)
  }

  const member = {
    information,
    mute,
    unmute,
    remove
  }
  return [member]
}

/**
 * 频道处理
 * @deprecated 待支持
 * @param event
 * @returns
 */
export const useChannel = <T extends EventKeys>(event: Events[T]) => {
  if (!event || typeof event !== 'object') {
    logger.error({
      code: ResultCode.FailParams,
      message: 'Invalid event: event must be an object',
      data: null
    })
    throw new Error('Invalid event: event must be an object')
  }

  // 退出
  const exit = async (channel_id?: string) => {
    return createResult(ResultCode.Warn, '暂未支持', channel_id)
  }

  // 加入
  const join = async (channel_id?: string) => {
    return createResult(ResultCode.Warn, '暂未支持', channel_id)
  }

  const channel = {
    exit,
    join
  }
  return [channel]
}

/**
 * 废弃，请使用 useMessage
 * @deprecated
 * @param event
 * @returns
 */
export const useSend = <T extends EventKeys>(event: Events[T]) => {
  const [message] = useMessage(event)
  const send = async (...val: DataEnums[]) => {
    return message.send(val)
  }
  return send
}

/**
 * 废弃，请使用 useMessage
 * @param event
 * @returns
 */
export const useSends = <T extends EventKeys>(event: Events[T]) => {
  const [message] = useMessage(event)
  return [message.send]
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
