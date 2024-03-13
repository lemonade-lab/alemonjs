import { APPS } from '../../../../core/index.js'
import {
  type EventEnum,
  type TypingEnum,
  type MessageBingdingOption
} from '../../../../core/index.js'
import { ABotConfig } from '../../../../config/index.js'
import { segmentKOOK } from '../segment.js'
import { replyController } from '../reply.js'
import { type SystemData, type StatementData } from '../../sdk/index.js'
import { directController } from '../direct.js'

/**
 * @param event 按钮数据
 */
export async function INTERACTION(event: SystemData) {
  const body = event.extra.body as StatementData
  const masterID = ABotConfig.get('kook').masterID
  const msg_id = body.msg_id

  /**
   * 制作e消息对象
   */
  const e = {
    platform: 'kook',
    boundaries: 'publick' as 'publick' | 'private',
    attribute: 'group' as 'group' | 'single',
    event: 'INTERACTION' as (typeof EventEnum)[number],
    typing: 'CREATE' as (typeof TypingEnum)[number],
    bot: {
      id: '',
      name: '',
      avatar: ''
    },
    isMaster: Array.isArray(masterID)
      ? masterID.includes(String(body.user_id))
      : String(body.user_id) == masterID,
    guild_id: '',
    guild_name: '',
    guild_avatar: '',
    channel_name: '',
    channel_id: String(body.channel_id),
    attachments: [],
    specials: [],
    //
    at: false,
    at_users: [],
    at_user: undefined,
    msg_id: msg_id,
    // 回调透传信息
    msg: String(event.msg_id) ?? '',
    msg_txt: '',
    quote: '',
    open_id: '',

    //
    user_id: String(body.user_id),
    user_name: '',
    user_avatar: '',
    //
    send_at: 0,
    segment: segmentKOOK,
    /**
     *消息发送
     * @param msg
     * @param img
     * @returns
     */
    reply: async (
      msg: Buffer | string | number | (Buffer | number | string)[],
      select?: MessageBingdingOption
    ): Promise<any> => {
      const channel_id = select?.channel_id ?? body.channel_id
      if (select?.open_id && select?.open_id != '') {
        return await directController(msg, `${channel_id}`, body.user_id)
      }
      return await replyController(msg, `${channel_id}`)
    }
  }

  APPS.responseEventType(e)
  return
}
