import { BotMessage } from './bot.js'
import { BOTCONFIG } from '../../config/index.js'
import { AT_MESSAGE_CREATE } from './message/AT_MESSAGE_CREATE.js'
import { PUBLIC_MESSAGE_DELETE } from './message/PUBLIC_MESSAGE_DELETE.js'
import { MESSAGE_REACTION_REMOVE } from './message/MESSAGE_REACTION_REMOVE.js'
import { MESSAGE_REACTION_ADD } from './message/MESSAGE_REACTION_ADD.js'
import { DIRECT_MESSAGE_DELETE } from './message/DIRECT_MESSAGE_DELETE.js'
import { DIRECT_MESSAGE_CREATE } from './message/DIRECT_MESSAGE_CREATE.js'
import { CHANNEL_CREATE } from './message/CHANNEL_CREATE.js'
import { CHANNEL_DELETE } from './message/CHANNEL_DELETE.js'
import { CHANNEL_UPDATE } from './message/CHANNEL_UPDATE.js'
import { GUILD_CREATE } from './message/GUILD_CREATE.js'
import { GUILD_DELETE } from './message/GUILD_DELETE.js'
import { GUILD_UPDATE } from './message/GUILD_UPDATE.js'
import { GUILD_MEMBER_ADD } from './message/GUILD_MEMBER_ADD.js'
import { GUILD_MEMBER_REMOVE } from './message/GUILD_MEMBER_REMOVE.js'
import { GUILD_MEMBER_UPDATE } from './message/GUILD_MEMBER_UPDATE.js'
import { INTERACTION_CREATE } from './message/INTERACTION_CREATE.js'
import { MESSAGE_CREATE } from './message/MESSAGE_CREATE.js'
import { MESSAGE_DELETE } from './message/MESSAGE_DELETE.js'

function READY(event: {
  version: number
  session_id: string
  user: {
    id: string
    username: string
    bot: boolean
    status: number
  }
  shard: {
    0: number
    1: number
  }
}) {
  const cfg = BOTCONFIG.get('qq')
  if (cfg.sandbox) console.info('ready', event)
  BotMessage.set('id', event.user.id)
  BotMessage.set('name', event.user.username)
}

const ConversationMap = {
  READY: READY,
  AT_MESSAGE_CREATE,
  CHANNEL_CREATE,
  CHANNEL_DELETE,
  CHANNEL_UPDATE,
  DIRECT_MESSAGE_CREATE,
  DIRECT_MESSAGE_DELETE,
  GUILD_CREATE,
  GUILD_DELETE,
  GUILD_UPDATE,
  GUILD_MEMBER_ADD,
  GUILD_MEMBER_REMOVE,
  GUILD_MEMBER_UPDATE,
  INTERACTION_CREATE,
  MESSAGE_CREATE,
  MESSAGE_DELETE,
  MESSAGE_REACTION_REMOVE: MESSAGE_REACTION_REMOVE,
  MESSAGE_REACTION_ADD: MESSAGE_REACTION_ADD,
  PUBLIC_MESSAGE_DELETE
}

/**
 * 会话事件分类
 * @param ws
 */
export const Conversation = (key: string, event: any) => {
  if (process.env?.ALEMONJS_EVENT == 'dev') console.info('event', event)
  if (Object.prototype.hasOwnProperty.call(ConversationMap, key)) {
    ConversationMap[key](event)
  }
}
