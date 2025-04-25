import { DataEnums } from '../typings'
import { ResultCode } from '../core/code'

/**
 * 创建数据格式。
 * @param {...DataEnums[]} data - 要格式化的数据。
 * @returns {DataEnums[]} - 返回格式化后的数据数组。
 * @throws {Error} - 如果 data 无效，抛出错误。
 */
export const createSendDataFormat = (...data: DataEnums[]): DataEnums[] => {
  if (!data || data.length === 0) {
    logger.error({
      code: ResultCode.FailParams,
      message: 'Invalid data: data cannot be empty',
      data: null
    })
    throw new Error('Invalid data: data cannot be empty')
  }
  return data
}

/**
 * 向指定频道发送消息。
 * @param {string} channel_id - 目标频道的 ID。
 * @param {DataEnums[]} data - 要发送的数据。
 * @throws {Error} - 如果 channel_id 无效或发送失败，抛出错误。
 */
export const sendToChannel = async (channel_id: string, data: DataEnums[]) => {
  if (!channel_id || typeof channel_id !== 'string') {
    logger.error({
      code: ResultCode.FailParams,
      message: 'Invalid channel_id: channel_id must be a string',
      data: null
    })
    throw new Error('Invalid channel_id: channel_id must be a string')
  }
  return await alemonjsBot.api.active.send.channel(channel_id, data)
}

/**
 * 向指定用户发送消息。
 * @param {string} user_id - 目标用户的 ID。
 * @param {DataEnums[]} data - 要发送的数据。
 * @throws {Error} - 如果 user_id 无效或发送失败，抛出错误。
 */
export const sendToUser = async (user_id: string, data: DataEnums[]) => {
  if (!user_id || typeof user_id !== 'string') {
    logger.error({
      code: ResultCode.FailParams,
      message: 'Invalid user_id: user_id must be a string',
      data: null
    })
    throw new Error('Invalid user_id: user_id must be a string')
  }
  return await alemonjsBot.api.active.send.user(user_id, data)
}
