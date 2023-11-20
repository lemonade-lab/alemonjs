import {
  EventEnum,
  EventType,
  InstructionMatching,
  MessageBingdingOption,
  PlatformEnum,
  UserType
} from '../../../core/index.js'
import { AlemonJSError, AlemonJSLog } from '../../../log/index.js'
import { getBotConfigByKey } from '../../../config/index.js'
import { ClientController, ClientControllerOnMember } from '../controller.js'
import { getBotMsgByDISCORD } from '../bot.js'
import { segmentDISCORD } from '../segment.js'
import { replyController } from '../reply.js'
import { ClientDISOCRD } from '../../sdk/index.js'

interface GUILD_MEMBER_UPDATE_TYPE {
  user: {
    username: string
    public_flags: number
    id: string
    global_name: string
    display_name: string
    discriminator: string
    bot: boolean
    avatar_decoration_data: {
      sku_id: string
      asset: string
    }
    avatar: string
  }
  roles: string[]
  premium_since: null
  pending: boolean
  nick: null
  mute: boolean
  joined_at: string
  guild_id: string
  flags: number
  deaf: boolean
  communication_disabled_until: null
  avatar: null
}

/**
 * 基础消息
 * @param event
 */
export async function GUILD_MEMBER_UPDATE(event: GUILD_MEMBER_UPDATE_TYPE) {
  //
  if (process.env?.ALEMONJS_EVENT == 'dev')
    console.log('GUILD_MEMBER_UPDATE', event)
}
