import { DataEnums } from '../typing/message'

/**
 * 使用提及功能。
 * @param {Object} event - 事件对象，包含触发提及的相关信息。
 * @returns {any} - 返回提及操作的结果。
 */
export const useMention = async (event: { [key: string]: any }) => {
  if (!event || typeof event !== 'object') {
    throw new Error('Invalid event: event must be an object')
  }
  try {
    await global.alemonjs.api.use.mention(event)
  } catch (e) {
    logger.error('Failed to mention:', e)
  }
}

/**
 * 发送消息。
 * @param {Object} event - 事件对象，包含触发发送的相关信息。
 * @returns {Function} - 返回一个异步函数，用于发送消息。
 * @throws {Error} - 如果 event 无效，抛出错误。
 */
export const useSend = (event: { [key: string]: any }) => {
  if (!event || typeof event !== 'object') {
    throw new Error('Invalid event: event must be an object')
  }
  return async (...val: DataEnums[]) => {
    if (!val || val.length === 0) {
      throw new Error('Invalid data: data cannot be empty')
    }
    try {
      await global.alemonjs.api.use.send(event, val)
    } catch (e) {
      logger.error('Failed to send message:', e)
    }
  }
}

/**
 * 卸载模块。
 * 从全局存储中移除与指定模块相关的数据。
 * @param {string} mainDir - 模块的主目录路径。
 * @throws {Error} - 如果 mainDir 无效，抛出错误。
 */
export const unMount = (mainDir: string) => {
  if (!mainDir || typeof mainDir !== 'string') {
    throw new Error('Invalid mainDir: mainDir must be a non-empty string')
  }

  // 从 storeMains 中移除
  const storeMainsIndex = global.storeMains.indexOf(mainDir)
  if (storeMainsIndex !== -1) {
    global.storeMains.splice(storeMainsIndex, 1)
  }

  // 从 storeResponse 中移除
  global.storeResponse = global.storeResponse.filter(item => item.source !== mainDir)

  // 从 storeMiddleware 中移除
  global.storeMiddleware = global.storeMiddleware.filter(item => item.source !== mainDir)

  // 从 storeResponseGather 中移除
  for (const key in global.storeResponseGather) {
    if (Array.isArray(global.storeResponseGather[key])) {
      global.storeResponseGather[key] = global.storeResponseGather[key].filter(
        item => item.source !== mainDir
      )
    }
  }

  // 从 storeMiddlewareGather 中移除
  for (const key in global.storeMiddlewareGather) {
    if (Array.isArray(global.storeMiddlewareGather[key])) {
      global.storeMiddlewareGather[key] = global.storeMiddlewareGather[key].filter(
        item => item.source !== mainDir
      )
    }
  }
}
