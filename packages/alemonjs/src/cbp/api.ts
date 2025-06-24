import { ResultCode } from '../core/code'
import { createResult, Result } from '../core/utils'
import { apiTimeouts, apiResolves, deviceId, generateUniqueId, timeoutTime } from './config'
import { Apis } from '../typing/apis'
import * as flattedJSON from 'flatted'

/**
 * 发送行为
 * @param data
 */
export const sendAPI = (data: Apis): Promise<Result[]> => {
  const ApiId = generateUniqueId()
  return new Promise(resolve => {
    apiResolves.set(ApiId, resolve)
    // 设置唯一标识符
    data.apiId = ApiId
    // 设置设备 ID
    data.DeviceId = deviceId
    // 发送消息
    global.chatbotClient.send(flattedJSON.stringify(data))
    // 12 秒后超时
    const timeout = setTimeout(() => {
      // 被清理了
      if (!apiResolves.has(ApiId) || !apiTimeouts.has(ApiId)) {
        return
      }
      // 删除回调
      apiResolves.delete(ApiId)
      // 删除超时器
      apiTimeouts.delete(ApiId)
      // 不会当错误进行处理。而是传入错误码
      resolve([createResult(ResultCode.Fail, '接口超时', null)])
    }, timeoutTime)
    apiTimeouts.set(ApiId, timeout)
  })
}
