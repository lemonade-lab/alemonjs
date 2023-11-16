import {
  typeMessage,
  PlatformEnum,
  EventType,
  EventEnum
} from '../../../core/index.js'

import { AlemonJSEventError, AlemonJSEventLog } from '../../../log/index.js'
import { segmentQQ } from '../segment.js'
import { getBotMsgByQQ } from '../bot.js'
import { ClientController, ClientControllerOnMember } from '../controller.js'
import { getBotConfigByKey } from '../../../config/index.js'

interface EventGuildMembersType {
  eventType: 'GUILD_MEMBER_ADD' | 'GUILD_MEMBER_UPDATE' | 'GUILD_MEMBER_REMOVE'
  eventId: string
  msg: {
    guild_id: string
    joined_at: string
    nick: string
    op_user_id: string
    roles: string[]
    source_type?: string // 加入时就会有
    user: {
      avatar: string
      bot: number
      id: string
      username: string
    }
  }
}

/**
GUILD_MEMBERS (1 << 1)
  - GUILD_MEMBER_ADD       // 当成员加入时
  - GUILD_MEMBER_UPDATE    // 当成员资料变更时
  - GUILD_MEMBER_REMOVE    // 当成员被移除时
 */
export const GUILD_MEMBERS = async (event: EventGuildMembersType) => {
  const Message = ClientController({
    guild_id: event.msg.guild_id,
    channel_id: '',
    msg_id: '0'
  })

  const Member = ClientControllerOnMember({
    guild_id: event.msg.guild_id,
    channel_id: '',
    user_id: event.msg.user.id
  })

  const cfg = getBotConfigByKey('qq')
  const masterID = cfg.masterID

  const e = {
    platform: 'qq' as (typeof PlatformEnum)[number],
    event: 'GUILD_MEMBERS' as (typeof EventEnum)[number],
    eventType: new RegExp(/ADD$/).test(event.eventType)
      ? 'CREATE'
      : new RegExp(/UPDATE$/).test(event.eventType)
      ? 'UPDATE'
      : ('DELETE' as (typeof EventType)[number]),
    boundaries: 'publick' as 'publick' | 'private',
    attribute: 'group' as 'group' | 'single',
    bot: getBotMsgByQQ(),
    isMaster: masterID == event.msg.user.id,
    attachments: [],
    specials: [],
    guild_id: event.msg.guild_id,
    guild_name: '',
    guild_avatar: '',
    channel_name: '',
    channel_id: '',
    //
    at: false,
    at_user: undefined,
    at_users: [],
    msg: '',
    msg_txt: '',
    msg_id: '',
    //
    user_id: event.msg.user.id,
    user_name: event.msg.user.username,
    user_avatar: event.msg.user.avatar,
    segment: segmentQQ,
    send_at: new Date(event.msg.joined_at).getTime(),
    Member,
    /**
     * 发现消息
     * @param msg
     * @param img
     * @returns
     */
    reply: async (
      msg: Buffer | string | number | (Buffer | number | string)[],
      select?: {
        quote?: string
        withdraw?: number
        guild_id?: string
        channel_id?: string
      }
    ): Promise<any> => {},
    Message
  }

  return await typeMessage(e)
    .then(() => AlemonJSEventLog(e.event, e.eventType))
    .catch(err => AlemonJSEventError(err, e.event, e.eventType))
}
