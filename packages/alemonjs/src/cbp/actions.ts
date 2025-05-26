import { Actions } from '../typing/actions'
import {
  actionResolves,
  actionTimeouts,
  DEVICE_ID_HEADER,
  deviceId,
  FULL_RECEIVE_HEADER,
  generateUniqueId,
  reconnectInterval,
  timeoutTime,
  USER_AGENT_HEADER
} from './config'

/**
 * 发送行为
 * @param data
 */
export const sendAction = (data: Actions): Promise<any> => {
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
      resolve(null)
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
