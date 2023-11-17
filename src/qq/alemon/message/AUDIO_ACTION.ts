import { AlemonJSEventError, AlemonJSEventLog } from '../../../log/event.js'
import {
  typeMessage,
  PlatformEnum,
  EventEnum,
  EventType,
  MessageBingdingOption
} from '../../../core/index.js'
import { getBotMsgByQQ } from '../bot.js'
import { segmentQQ } from '../segment.js'
import { ClientController, ClientControllerOnMember } from '../controller.js'
import { directController } from '../direct.js'
import { replyController } from '../reply.js'

/**
 * TUDO
 */

/**
 * AUDIO_MICROPHONE 音频
 * AUDIO_FREQUENCY 麦克风
 */

/**
AUDIO_ACTION (1 << 29)
  - AUDIO_START             // 音频开始播放时  create
  - AUDIO_FINISH            // 音频播放结束时 delete
  - AUDIO_ON_MIC            // 上麦时  create
  - AUDIO_OFF_MIC           // 下麦时 delete
 */
export const AUDIO_ACTION = async (event: any) => {
  const Message = ClientController({
    guild_id: event.msg.guild_id,
    channel_id: event.msg.channel_id,
    msg_id: ''
  })

  const Member = ClientControllerOnMember({
    guild_id: event.msg.guild_id,
    channel_id: event.msg.channel_id,
    user_id: ''
  })

  const e = {
    platform: 'qq' as (typeof PlatformEnum)[number],
    event: 'AUDIO_MICROPHONE' as (typeof EventEnum)[number],
    eventType: 'CREATE' as (typeof EventType)[number],
    boundaries: 'publick' as 'publick' | 'private',
    attribute: 'group' as 'group' | 'single',
    bot: getBotMsgByQQ(),
    isMaster: false,
    guild_id: event.msg.guild_id,
    guild_name: '',
    guild_avatar: '',
    channel_name: '',
    channel_id: event.msg.channel_id,
    attachments: [],
    specials: [],
    //
    msg_id: '',
    msg_txt: '',
    msg: '',
    at: false,
    at_user: undefined,
    at_users: [],
    open_id: event.msg.guild_id,
    //
    user_id: '',
    user_avatar: '',
    user_name: '',
    segment: segmentQQ,
    send_at: new Date().getTime(),
    /**
     * 发现消息
     * @param msg
     * @param img
     * @returns
     */
    reply: async (
      msg: Buffer | string | number | (Buffer | number | string)[],
      select?: MessageBingdingOption
    ): Promise<any> => {
      const msg_id = select?.msg_id ?? event.msg.id
      const withdraw = select?.withdraw ?? 0
      if (select?.open_id && select?.open_id != '') {
        return await directController(msg, select?.open_id, msg_id, {
          withdraw
        })
      }
      const channel_id = select?.channel_id ?? event.msg.channel_id
      return await replyController(msg, channel_id, msg_id, {
        quote: select?.quote,
        withdraw
      })
    },
    Message,
    Member
  }

  if (new RegExp(/MIC$/).test(event.eventType)) {
    if (!new RegExp(/ON_MIC$/).test(event.eventType)) {
      // 下麦
      e.eventType = 'DELETE'
    }
  } else {
    // 音频事件
    e.event = 'AUDIO_FREQUENCY'
    if (!new RegExp(/^AUDIO_START$/).test(event.eventType)) {
      // 音频播放结束时
      e.eventType = 'DELETE'
    }
  }

  return await typeMessage(e)
    .then(() => AlemonJSEventLog(e.event, e.eventType))
    .catch(err => AlemonJSEventError(err, e.event, e.eventType))
}
