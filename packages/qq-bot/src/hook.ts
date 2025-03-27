import { EventKeys, Events } from 'alemonjs'
/**
 * 判断当前模式
 * @param event
 * @returns
 */
export const useMode = <T extends EventKeys>(event: Events[T]) => {
  const tag = event.tag
  let currentMode = 'group'
  // 群at
  if (tag == 'GROUP_AT_MESSAGE_CREATE') {
    currentMode = 'group'
  }
  // 私聊
  if (tag == 'C2C_MESSAGE_CREATE') {
    currentMode = 'group'
  }
  // 频道私聊
  if (tag == 'DIRECT_MESSAGE_CREATE') {
    currentMode = 'guild'
  }
  // 频道at
  if (tag == 'AT_MESSAGE_CREATE') {
    currentMode = 'guild'
  }
  // 频道消息
  if (tag == 'MESSAGE_CREATE') {
    currentMode = 'guild'
  }
  const isMode = (mode: 'guild' | 'group') => {
    return currentMode == mode
  }
  return isMode
}
