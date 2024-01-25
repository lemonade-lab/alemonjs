import { GROUP_AT_MESSAGE_CREATE } from './message/GROUP_AT_MESSAGE_CREATE.js'
import { C2C_MESSAGE_CREATE } from './message/C2C_MESSAGE_CREATE.js'
import { BotMessage } from './bot.js'
/**
 *
 * @param t
 * @param d
 */
export function conversation(t: string, d: any) {
  if (process.env?.ALEMONJS_EVENT == 'dev') console.info('event', d)
  switch (t) {
    case 'READY': {
      BotMessage.set('id', d.user.id)
      BotMessage.set('name', d.user.name)
      break
    }
    case 'GROUP_AT_MESSAGE_CREATE': {
      GROUP_AT_MESSAGE_CREATE(d)
      break
    }
    case 'C2C_MESSAGE_CREATE': {
      C2C_MESSAGE_CREATE(d)
      break
    }
  }
}
