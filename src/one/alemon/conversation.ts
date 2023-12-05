import { setBotMsgByONE } from './bot.js'
import { EventGroup, Heartbeat } from '../sdk/types.js'
import { Event } from '../sdk/types.js'
import { DIRECT_MESSAGE } from './message/DIRECT_MESSAGE.js'
import { MESSAGES } from './message/MESSAGES.js'
/**
 * 会话控制
 */
export const conversation = {
  meta: async (event: Heartbeat) => {
    if (event.status && event.status.bots) {
      const bot = event.status.bots[0]
      setBotMsgByONE({
        id: bot.self.user_id,
        name: bot.self.nickname,
        avatar: '' // 头像是什么
      })
    }
  },
  message: async (event: Event | EventGroup) => {
    if (event.detail_type == 'private') {
      DIRECT_MESSAGE(event as Event)
    } else {
      MESSAGES(event as EventGroup)
    }
  }
}
