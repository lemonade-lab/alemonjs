import { BotMessage } from './bot.js'
import { BOTCONFIG } from '../../config/index.js'
import { AT_MESSAGE_CREATE } from './message/AT_MESSAGE_CREATE.js'
import { PUBLIC_MESSAGE_DELETE } from './message/PUBLIC_MESSAGE_DELETE.js'

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
  PUBLIC_MESSAGE_DELETE
}

/**
 * 会话事件分类
 * @param ws
 */
export const Conversation = (key: string, event: any) => {
  if (Object.prototype.hasOwnProperty.call(ConversationMap, key)) {
    ConversationMap[key](event)
  }
}
