import { ClientDISOCRD } from '../sdk/index.js'
import { BotMessage } from './bot.js'
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
import { loger } from '../../../log.js'

const ConversationMap = {
  READY: d => {
    BotMessage.set('avatar', ClientDISOCRD.userAvatar(d.user.id, d.user.avatar))
    BotMessage.set('id', d.user.id)
    BotMessage.set('name', d.user.username)
  },
  MESSAGE_CREATE,
  PRESENCE_UPDATE,
  MESSAGE_UPDATE,
  TYPING_START,
  MESSAGE_REACTION_ADD,
  VOICE_STATE_UPDATE,
  GUILD_MEMBER_UPDATE,
  GUILD_MEMBER_ADD,
  CHANNEL_TOPIC_UPDATE,
  VOICE_CHANNEL_STATUS_UPDATE,
  MESSAGE_DELETE,
  CHANNEL_UPDATE,
  GUILD_MEMBER_REMOVE
}

/**
 *
 * @param t
 * @param d
 */
export function conversation(t: string, d: any) {
  if (process.env?.ALEMONJS_EVENT == 'dev') loger.info('event', d)
  if (!Object.prototype.hasOwnProperty.call(ConversationMap, t)) return
  ConversationMap[t](d)
}
