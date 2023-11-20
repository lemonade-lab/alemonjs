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

interface VOICE_STATE_UPDATE_TYPE {
  member: {
    user: {
      username: string
      public_flags: number
      id: string
      global_name: string
      display_name: string
      discriminator: string
      bot: boolean
      avatar_decoration_data: any
      avatar: string
    }
    roles: string[]
    premium_since: null
    pending: boolean
    nick: null
    mute: boolean
    joined_at: string
    flags: number
    deaf: boolean
    communication_disabled_until: null
    avatar: string
  }
  user_id: string
  suppress: boolean
  session_id: string
  self_video: boolean
  self_mute: true
  self_deaf: boolean
  request_to_speak_timestamp: null
  mute: boolean
  guild_id: string
  deaf: boolean
  channel_id: string
}

/**
 * 基础消息
 * @param event
 */
export async function VOICE_STATE_UPDATE(event: VOICE_STATE_UPDATE_TYPE) {
  if (process.env?.ALEMONJS_EVENT == 'dev')
    console.log('VOICE_STATE_UPDATE', event)
}
