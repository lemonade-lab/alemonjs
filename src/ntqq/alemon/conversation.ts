import { GROUP_AT_MESSAGE_CREATE } from './message/GROUP_AT_MESSAGE_CREATE.js'
import { C2C_MESSAGE_CREATE } from './message/C2C_MESSAGE_CREATE.js'
import { setBotMsgByNtqq } from './bot.js'
/**
 * 回话对象
 */
export const conversation = {
  READY: async data => {
    // 设置bot信息
    setBotMsgByNtqq({
      id: data.user.id,
      name: data.user.name,
      avatar: 'string'
    })
  },
  GROUP_AT_MESSAGE_CREATE: GROUP_AT_MESSAGE_CREATE,
  C2C_MESSAGE_CREATE: C2C_MESSAGE_CREATE
}
