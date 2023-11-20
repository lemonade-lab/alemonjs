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

interface MESSAGE_DELETE_TYPE {
  id: string
  channel_id: string
  guild_id: string
}

/**
 * 基础消息
 * @param event
 */
export async function MESSAGE_DELETE(event: MESSAGE_DELETE_TYPE) {
  if (process.env?.ALEMONJS_EVENT == 'dev') console.log('MESSAGE_DELETE', event)
}
