import { ClientDISOCRD } from '../sdk/index.js'
import { setBotMsgByDISOCRD } from './bot.js'
import { MESSAGE_CREATE } from './message/MESSAGE_CREATE.js'
import { PRESENCE_UPDATE } from './message/PRESENCE_UPDATE.js'
import { MESSAGE_UPDATE } from './message/MESSAGE_UPDATE.js'
import { TYPING_START } from './message/TYPING_START.js'
import { MESSAGE_REACTION_ADD } from './message/MESSAGE_REACTION_ADD.js'
import { VOICE_STATE_UPDATE } from './message/VOICE_STATE_UPDATE.js'
export function conversation(t: string, d: any) {
  console.log(t)
  if (t == 'READY') {
    // 上线
    setBotMsgByDISOCRD({
      id: d.user.id,
      name: d.user.username,
      avatar: ClientDISOCRD.UserAvatar(d.user.id, d.user.avatar)
    })
  } else if (t == 'GUILD_CREATE') {
    // 频道信息创建
    // console.log(d)
  } else if (t == 'MESSAGE_CREATE') {
    // 消息创建
    MESSAGE_CREATE(d)
  } else if (t == 'PRESENCE_UPDATE') {
    // 成员状态更新
    PRESENCE_UPDATE(d)
  } else if (t == 'MESSAGE_UPDATE') {
    // 子频道信息更新
    MESSAGE_UPDATE(d)
  } else if (t == 'TYPING_START') {
    //
    TYPING_START(d)
  } else if (t == 'MESSAGE_REACTION_ADD') {
    //
    MESSAGE_REACTION_ADD(d)
  } else if (t == 'VOICE_STATE_UPDATE') {
    //
    VOICE_STATE_UPDATE(d)
  } else {
    if (process.env?.ALEMONJS_EVENT == 'dev') console.log('数据', d)
  }
}
