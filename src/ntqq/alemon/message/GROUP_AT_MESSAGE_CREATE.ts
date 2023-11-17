import {
  InstructionMatching,
  PlatformEnum,
  EventEnum,
  EventType,
  MessageBingdingOption
} from '../../../core/index.js'
import { segmentNTQQ } from '../segment.js'
import { getBotMsgByNtqq } from '../bot.js'
import { getBotConfigByKey } from '../../../config/index.js'
import { GROUP_DATA } from '../types.js'
import { AlemonJSError, AlemonJSLog } from '../../../log/index.js'
import { ClientController, ClientControllerOnMember } from '../controller.js'
import { replyController } from '../reply.js'

/**
 * 公私域合并
 * @param e
 * @param data  原数据
 * @returns
 */
export const GROUP_AT_MESSAGE_CREATE = async (event: GROUP_DATA) => {
  const cfg = getBotConfigByKey('ntqq')
  const masterID = cfg.masterID

  const Message = ClientController({
    guild_id: event.group_id,
    msg_id: event.id
  })

  const Member = ClientControllerOnMember()

  const e = {
    platform: 'ntqq' as (typeof PlatformEnum)[number],
    event: 'MESSAGES' as (typeof EventEnum)[number],
    eventType: 'CREATE' as (typeof EventType)[number],
    boundaries: 'publick' as 'publick' | 'private',
    attribute: 'group' as 'group' | 'single',
    bot: getBotMsgByNtqq(),
    isMaster: event.author.id == masterID ? true : false,
    guild_id: event.group_id,
    guild_name: '',
    guild_avatar: '',
    channel_name: '',
    channel_id: event.group_id,
    attachments: [],
    specials: [],
    msg_txt: event.content,
    msg: event.content.trim(),
    msg_id: event.id,
    open_id: '',
    user_id: event.author.id,
    user_avatar: 'https://q1.qlogo.cn/g?b=qq&s=0&nk=1715713638',
    user_name: '柠檬冲水',
    segment: segmentNTQQ,
    at_users: [],
    at: false,
    at_user: undefined,
    send_at: new Date().getTime(),
    Message,
    Member,
    /**
     * 消息发送机制
     * @param msg 消息
     * @param img
     * @returns
     */
    reply: async (
      msg: Buffer | string | number | (Buffer | number | string)[],
      select?: MessageBingdingOption
    ): Promise<any> => {
      // 如果存在 open_id 表示 转为私聊
      if (select?.open_id && select?.open_id != '') {
        console.error('NTQQ  无主动私信')
        return false
      }
      const group_id = select?.guild_id ?? event.group_id
      return await replyController(msg, group_id, event.id)
    }
  }

  /**
   * 存在at
   */
  if (e.at) {
    /**
     * 得到第一个艾特
     */
    e.at_user = e.at_users.find(item => item.bot != true)
  }

  /**
   * 业务处理
   */
  return await InstructionMatching(e)
    .then(() => AlemonJSLog(e.channel_id, e.user_name, e.msg_txt))
    .catch(err => AlemonJSError(err, e.channel_id, e.user_name, e.msg_txt))
}
