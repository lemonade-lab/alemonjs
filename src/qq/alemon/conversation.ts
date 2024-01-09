import { GUILD } from './message/GUILDS.js'
import { CHANNEL } from './message/CHANNEL.js'
import { GUILD_MEMBERS } from './message/GUILD_MEMBERS.js'
import { DIRECT_MESSAGE } from './message/DIRECT_MESSAGE.js'
import { PUBLIC_GUILD_MESSAGES } from './message/PUBLIC_GUILD_MESSAGES.js'
import { GUILD_MESSAGE_REACTIONS } from './message/GUILD_MESSAGE_REACTIONS.js'
import { OPEN_FORUMS_EVENT } from './message/OPEN_FORUMS_EVENT.js'
import { GUILD_MESSAGES } from './message/GUILD_MESSAGES.js'
import { INTERACTION } from './message/INTERACTION.js'
import { MESSAGE_AUDIT } from './message/MESSAGE_AUDIT.js'
import { AUDIO_ACTION } from './message/AUDIO_ACTION.js'
import { FORUMS_EVENT } from './message/FORUMS_EVENT.js'
import { BotMessage } from './bot.js'
import { BOTCONFIG } from '../../config/index.js'

interface BotData {
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
}

function GUILDS(event) {
  if (new RegExp(/^GUILD.*$/).test(event.eventType)) {
    GUILD(event)
  } else {
    CHANNEL(event)
  }
}

function READY(event) {
  const cfg = BOTCONFIG.get('qq')
  if (cfg.sandbox) {
    console.info('ready', event)
  }
  const robot: BotData = event.msg
  BotMessage.set('id', robot.user.id)
  BotMessage.set('name', robot.user.username)
}

/**
 * 会话事件分类
 * @param ws
 */
export const Conversation = {
  READY: READY,
  GUILDS: GUILDS
}
