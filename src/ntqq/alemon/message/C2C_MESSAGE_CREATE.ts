import {
  InstructionMatching,
  PlatformEnum,
  EventEnum,
  EventType,
  MessageBingdingOption
} from '../../../core/index.js'
import { segmentNTQQ } from '../segment.js'
import { getBotMsgByNtqq } from '../bot.js'
import { USER_DATA } from '../types.js'
import { AlemonJSError, AlemonJSLog } from '../../../log/index.js'
import { getBotConfigByKey } from '../../../config/index.js'
import { ClientController, ClientControllerOnMember } from '../controller.js'
import { directController } from '../direct.js'

export const C2C_MESSAGE_CREATE = async (event: USER_DATA) => {
  if (process.env?.ALEMONJS_EVENT == 'dev') {
    console.log('C2C_MESSAGE_CREATE', event)
  }

  const cfg = getBotConfigByKey('ntqq')
  const masterID = cfg.masterID

  const open_id = event.author.user_openid

  const Message = ClientController({
    guild_id: event.author.user_openid,
    msg_id: event.id
  })

  const Member = ClientControllerOnMember()

  const e = {
    platform: 'ntqq' as (typeof PlatformEnum)[number],
    event: 'MESSAGES' as (typeof EventEnum)[number],
    eventType: 'CREATE' as (typeof EventType)[number],
    boundaries: 'publick' as 'publick' | 'private',
    attribute: 'single' as 'group' | 'single',
    bot: getBotMsgByNtqq(),
    isMaster: event.author.id == masterID ? true : false,
    channel_id: event.author.user_openid,
    guild_name: '',
    guild_avatar: '',
    channel_name: '',
    guild_id: event.author.user_openid,
    attachments: [],
    specials: [],
    //
    at_users: [],
    at_user: undefined,
    at: false,
    msg_txt: event.content,
    msg: event.content,
    msg_id: event.id,
    open_id: open_id,
    //
    user_id: event.author.id,
    user_name: '柠檬冲水',
    user_avatar: 'https://q1.qlogo.cn/g?b=qq&s=0&nk=1715713638',
    segment: segmentNTQQ,
    send_at: new Date().getTime(),
    Member,
    reply: async (
      msg: Buffer | string | number | (Buffer | number | string)[],
      select?: MessageBingdingOption
    ): Promise<any> => {
      const msg_id = select?.msg_id ?? event.id
      return await directController(msg, open_id, msg_id)
    },
    Message
  }

  /**
   * 业务处理
   */
  return await InstructionMatching(e)
    .then(() => AlemonJSLog(e.channel_id, e.user_name, e.msg_txt))
    .catch(err => AlemonJSError(err, e.channel_id, e.user_name, e.msg_txt))
}
