import { DefinePlatformFunc } from '../typings'
import { ResultCode } from '../code'
/**
 * 定义机器人
 * @param callback
 * @throws {Error} - 如果 callback 无效，抛出错误。
 * @returns
 */
export const definePlatform: DefinePlatformFunc = callback => {
  // 判断是否是函数
  if (typeof callback !== 'function') {
    logger.error({
      code: ResultCode.FailParams,
      message: 'Invalid callback: callback must be a function',
      data: null
    })
    throw new Error('Invalid callback: callback must be a function')
  }
  return {
    _name: 'platform',
    callback
  }
}
global.definePlatform = definePlatform
/**
 * 废弃，请使用 definePlatform
 * @deprecated
 */
export const defineBot: DefinePlatformFunc = callback => {
  logger.warn({
    code: ResultCode.Warn,
    message: 'defineBot is deprecated, please use definePlatform',
    data: null
  })
  return definePlatform(callback)
}
global.defineBot = defineBot
