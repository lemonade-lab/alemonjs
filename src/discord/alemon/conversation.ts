import { ClientDISOCRD } from '../sdk/index.js'
import { setBotMsgByDISOCRD } from './bot.js'
import { MESSAGES } from './message/MESSAGES.js'
export function conversation(t: string, d: any) {
  console.log(t)
  if (t == 'READY') {
    setBotMsgByDISOCRD({
      id: d.user.id,
      name: d.user.username,
      avatar: ClientDISOCRD.UserAvatar(d.user.id, d.user.avatar)
    })
  } else if (t == 'GUILD_CREATE') {
    // console.log(d)
  } else if (t == 'MESSAGE_CREATE') {
    MESSAGES(d)
  } else {
    console.log('数据', d)
  }
}
