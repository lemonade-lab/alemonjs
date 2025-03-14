import { DataEnums, Events } from '../typings'

/**
 * 使用提及。
 * @param {Object} event - 事件对象，包含触发提及的相关信息。
 * @returns {any} - 返回提及操作的结果。
 */
export const useMention = async (event: { [key: string]: any }) => {
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
export const useSend = (event: { [key: string]: any }) => {
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
 * 卸载模块。
 * 从全局存储中移除与指定模块相关的数据。
 * @param {string} mainDir - 模块的主目录路径。
 * @throws {Error} - 如果 mainDir 无效，抛出错误。
 */
export const unChildren = (mainDir: string) => {
  if (!mainDir || typeof mainDir !== 'string') {
    throw new Error('Invalid mainDir: mainDir must be a non-empty string')
  }

  // 从 storeMains 中移除
  const storeMainsIndex = alemonjsCore.storeMains.indexOf(mainDir)
  if (storeMainsIndex !== -1) {
    alemonjsCore.storeMains.splice(storeMainsIndex, 1)
  }

  // 从 storeResponse 中移除
  if (alemonjsCore.storeResponse.find(item => item.source == mainDir)) {
    alemonjsCore.storeResponse = alemonjsCore.storeResponse.filter(item => item.source !== mainDir)
  }

  // 从 storeMiddleware 中移除
  if (alemonjsCore.storeMiddleware.find(item => item.source == mainDir)) {
    alemonjsCore.storeMiddleware = alemonjsCore.storeMiddleware.filter(
      item => item.source !== mainDir
    )
  }

  // 从 storeResponseGather 中移除
  for (const key in alemonjsCore.storeResponseGather) {
    if (
      Array.isArray(alemonjsCore.storeResponseGather[key]) &&
      alemonjsCore.storeResponseGather[key].find(item => item.source == mainDir)
    ) {
      alemonjsCore.storeResponseGather[key] = alemonjsCore.storeResponseGather[key].filter(
        item => item.source !== mainDir
      )
    }
  }

  // 从 storeMiddlewareGather 中移除
  for (const key in alemonjsCore.storeMiddlewareGather) {
    if (
      Array.isArray(alemonjsCore.storeMiddlewareGather[key]) &&
      alemonjsCore.storeMiddlewareGather[key].find(item => item.source == mainDir)
    ) {
      alemonjsCore.storeMiddlewareGather[key] = alemonjsCore.storeMiddlewareGather[key].filter(
        item => item.source !== mainDir
      )
    }
  }
}

/**
 * 废弃,请使用unChildren
 * @deprecated
 */
export const unMount = unChildren

/**
 *
 * @param values
 * @returns
 */
export const createSelects = <T extends (keyof Events)[] | keyof Events>(values: T) => values
