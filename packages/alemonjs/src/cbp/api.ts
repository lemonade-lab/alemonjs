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
    // 设置唯一标识符
    data.apiId = ApiId
    // 设置设备 ID
    data.DeviceId = deviceId

    // 沙盒模式
    if (global.sandbox) {
      if (!global.testoneClient) {
        return resolve([createResult(ResultCode.Fail, '未连接到客户端', null)])
      }
      // 发送消息
      global.testoneClient.send(flattedJSON.stringify(data))
    } else {
      // 发送消息
      global.chatbotClient.send(flattedJSON.stringify(data))
    }

    apiResolves.set(ApiId, resolve)

    // 超时
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

    // 设置超时
    apiTimeouts.set(ApiId, timeout)
  })
}
