import { ResultCode } from '../core/code'
import { createResult, Result } from '../core/utils'
import { Actions } from '../typing/actions'
import { actionResolves, actionTimeouts, deviceId, generateUniqueId, timeoutTime } from './config'
import * as JSON from 'flatted'
/**
 * 发送行为
 * @param data
 */
export const sendAction = (data: Actions): Promise<Result[]> => {
  const actionId = generateUniqueId()
  return new Promise(resolve => {
    actionResolves.set(actionId, resolve)
    // 设置唯一标识符
    data.actionId = actionId
    // 设置设备 ID
    data.DeviceId = deviceId
    // 发送消息
    global.chatbotClient.send(JSON.stringify(data))
    // 12 秒后超时
    const timeout = setTimeout(() => {
      // 被清理了
      if (!actionResolves.has(actionId) || !actionTimeouts.has(actionId)) {
        return
      }
      // 删除回调
      actionResolves.delete(actionId)
      // 删除超时器
      actionTimeouts.delete(actionId)
      // 不会当错误进行处理。而是传入错误码
      resolve([createResult(ResultCode.Fail, '行为超时', null)])
    }, timeoutTime)
    actionTimeouts.set(actionId, timeout)
  })
}
