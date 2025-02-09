import { DataEnums } from '../global'

/**
 * 创建数据格式。
 * @param {...DataEnums[]} data - 要格式化的数据。
 * @returns {DataEnums[]} - 返回格式化后的数据数组。
 * @throws {Error} - 如果 data 无效，抛出错误。
 */
export const createSendDataFormat = (...data: DataEnums[]): DataEnums[] => {
  if (!data || data.length === 0) {
    throw new Error('Invalid data: data cannot be empty')
  }
  return data
}

/**
 * 统一错误处理函数。
 * @param {string} context - 错误上下文（如 'channel' 或 'user'）。
 * @param {Error} error - 捕获的错误对象。
 * @throws {Error} - 抛出格式化后的错误。
 */
const handleError = (context: string, error: Error) => {
  logger.error(`Failed to send message to ${context}:`, error)
  throw new Error(`Failed to send message to ${context}`)
}

/**
 * 向指定频道发送消息。
 * @param {string} channel_id - 目标频道的 ID。
 * @param {DataEnums[]} data - 要发送的数据。
 * @returns {Promise<any>} - 返回发送操作的结果。
 * @throws {Error} - 如果 channel_id 无效或发送失败，抛出错误。
 */
export const sendToChannel = async (channel_id: string, data: DataEnums[]) => {
  if (!channel_id || typeof channel_id !== 'string') {
    throw new Error('Invalid channel_id')
  }
  try {
    return await global.alemonjs.api.active.send.channel(channel_id, data)
  } catch (error) {
    handleError('channel', error)
  }
}

/**
 * 向指定用户发送消息。
 * @param {string} user_id - 目标用户的 ID。
 * @param {DataEnums[]} data - 要发送的数据。
 * @returns {Promise<any>} - 返回发送操作的结果。
 * @throws {Error} - 如果 user_id 无效或发送失败，抛出错误。
 */
export const sendToUser = async (user_id: string, data: DataEnums[]) => {
  if (!user_id || typeof user_id !== 'string') {
    throw new Error('Invalid user_id')
  }
  try {
    return await global.alemonjs.api.active.send.user(user_id, data)
  } catch (error) {
    handleError('user', error)
  }
}
