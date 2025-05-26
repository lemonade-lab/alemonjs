import { ResultCode } from '../core/code'
import { createResult, Result } from '../post'
import { Actions } from '../typing/actions'
import { actionResolves, actionTimeouts, deviceId, generateUniqueId, timeoutTime } from './config'

/**
 * 发送行为
 * @param data
 */
export const sendAction = (data: Actions): Promise<Result | Result[]> => {
  const actionId = generateUniqueId()
  return new Promise(resolve => {
    actionResolves.set(actionId, resolve)
    // 设置唯一标识符
    data.actionID = actionId
    // 设置设备 ID
    data.DeviceId = deviceId
    global.chatbotClient.send(JSON.stringify(data))
    // 12 秒后超时
    const timeout = setTimeout(() => {
      // 不会当错误进行处理
      resolve(createResult(ResultCode.Fail, '请求超时', null))
      // 手动清理
      clearTimeout(timeout)
      // 删除回调
      actionResolves.delete(actionId)
      // 删除超时器
      actionTimeouts.delete(actionId)
    }, timeoutTime)
    actionTimeouts.set(actionId, timeout)
  })
}
