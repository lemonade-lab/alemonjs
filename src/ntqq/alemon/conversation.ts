import { GROUP_AT_MESSAGE_CREATE } from './message/GROUP_AT_MESSAGE_CREATE.js'
import { C2C_MESSAGE_CREATE } from './message/C2C_MESSAGE_CREATE.js'
import { setBotMsgByNtqq } from './bot.js'
/**
 *
 * @param t
 * @param d
 */
export function conversation(t: string, d: any) {
  if (t == 'READY') {
    // 设置bot信息
    setBotMsgByNtqq({
      id: d.user.id,
      name: d.user.name,
      avatar: 'string'
    })
  } else if (t == 'GROUP_AT_MESSAGE_CREATE') {
    C2C_MESSAGE_CREATE(d)
  } else if (t == 'C2C_MESSAGE_CREATE') {
    GROUP_AT_MESSAGE_CREATE(d)
  } else {
    console.log(t)
    console.log(d)
  }
}
