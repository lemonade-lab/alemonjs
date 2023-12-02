import { ClientDISOCRD } from '../sdk/index.js'
import { setBotMsgByDISOCRD } from './bot.js'
import { MESSAGE_CREATE } from './message/MESSAGE_CREATE.js'
import { PRESENCE_UPDATE } from './message/PRESENCE_UPDATE.js'
import { MESSAGE_UPDATE } from './message/MESSAGE_UPDATE.js'
import { TYPING_START } from './message/TYPING_START.js'
import { MESSAGE_REACTION_ADD } from './message/MESSAGE_REACTION_ADD.js'
import { VOICE_STATE_UPDATE } from './message/VOICE_STATE_UPDATE.js'
import { GUILD_MEMBER_UPDATE } from './message/GUILD_MEMBER_UPDATE.js'
import { GUILD_MEMBER_ADD } from './message/GUILD_MEMBER_ADD.js'
import { CHANNEL_TOPIC_UPDATE } from './message/CHANNEL_TOPIC_UPDATE.js'
import { VOICE_CHANNEL_STATUS_UPDATE } from './message/VOICE_CHANNEL_STATUS_UPDATE.js'
import { MESSAGE_DELETE } from './message/MESSAGE_DELETE.js'
import { CHANNEL_UPDATE } from './message/CHANNEL_UPDATE.js'
import { GUILD_MEMBER_REMOVE } from './message/GUILD_MEMBER_REMOVE.js'
/**
 *
 * @param t
 * @param d
 */
export function conversation(t: string, d: any) {
  if (t == 'READY') {
    // 上线
    setBotMsgByDISOCRD({
      id: d.user.id,
      name: d.user.username,
      avatar: ClientDISOCRD.UserAvatar(d.user.id, d.user.avatar)
    })
  } else if (t == 'GUILD_CREATE') {
    // 频道信息创建
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
  } else if (t == 'GUILD_MEMBER_UPDATE') {
    //
    GUILD_MEMBER_UPDATE(d)
  } else if (t == 'GUILD_MEMBER_ADD') {
    //
    GUILD_MEMBER_ADD(d)
  } else if (t == 'CHANNEL_TOPIC_UPDATE') {
    //
    CHANNEL_TOPIC_UPDATE(d)
  } else if (t == 'VOICE_CHANNEL_STATUS_UPDATE') {
    //
    VOICE_CHANNEL_STATUS_UPDATE(d)
  } else if (t == 'MESSAGE_DELETE') {
    //
    MESSAGE_DELETE(d)
  } else if (t == 'CHANNEL_UPDATE') {
    //
    CHANNEL_UPDATE(d)
  } else if (t == 'GUILD_MEMBER_REMOVE') {
    //
    GUILD_MEMBER_REMOVE(d)
  } else {
    if (process.env?.ALEMONJS_EVENT == 'dev') {
      console.log(t)
      console.log('数据', d)
    }
  }
}
