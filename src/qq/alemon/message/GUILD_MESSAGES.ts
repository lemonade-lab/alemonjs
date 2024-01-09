import {
  APPS,
  type EventEnum,
  type TypingEnum,
  type MessageBingdingOption
} from '../../../core/index.js'
import { getBotMsgByQQ } from '../bot.js'
import { AlemonJSEventError, AlemonJSEventLog } from '../../../log/index.js'
import { segmentQQ } from '../segment.js'
import { setBotMsgByQQ } from '../bot.js'
import { BOTCONFIG } from '../../../config/index.js'
import { AlemonJSError, AlemonJSLog } from '../../../log/index.js'
import { replyController } from '../reply.js'
import { Controllers } from '../controller.js'
import { directController } from '../direct.js'

/**
 * *私域*
 */

/** 
GUILD_MESSAGES (1 << 9)    // 消息事件，仅 *私域* 机器人能够设置此 intents。
  - MESSAGE_CREATE         
  // 频道内的全部消息，
  而不只是 at 机器人的消息。
  内容与 AT_MESSAGE_CREATE 相同
  - MESSAGE_DELETE         // 删除（撤回）消息事件
 * */
export const GUILD_MESSAGES = async (event: any) => {
  if (process.env?.ALEMONJS_EVENT == 'dev') console.info('event', event)

  const cfg = BOTCONFIG.get('qq')
  const masterID = cfg.masterID

  const e = {
    platform: 'qq',
    event: 'MESSAGES' as (typeof EventEnum)[number],
    typing: 'CREATE' as (typeof TypingEnum)[number],
    boundaries: 'private' as 'publick' | 'private',
    attribute: 'group' as 'group' | 'single',
    bot: getBotMsgByQQ(),
    isMaster: event.msg?.author?.id == masterID,
    attachments: event?.msg?.attachments ?? [],
    specials: [],
    guild_id: event.msg.guild_id,
    guild_name: '',
    guild_avatar: '',
    channel_name: '',
    channel_id: event.msg.channel_id,
    at: false,
    at_user: undefined,
    at_users: [],
    msg: event.msg?.content ?? '',
    msg_txt: event.msg?.content ?? '',
    msg_id: event.msg?.id ?? '',
    quote: '',
    open_id: event.msg.guild_id,

    user_id: event.msg?.author?.id ?? '',
    user_name: event.msg?.author?.username ?? '',
    user_avatar: event.msg?.author?.avatar ?? '',
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
      const withdraw = select?.withdraw ?? 0
      const msg_id = select?.channel_id ?? event.msg?.id
      if (select?.open_id && select?.open_id != '') {
        return await directController(msg, select?.open_id, msg_id, {
          withdraw,
          open_id: select?.open_id,
          user_id: event.msg?.author?.id ?? ''
        })
      }
      const channel_id = select?.channel_id ?? event.msg.channel_id
      return await replyController(msg, channel_id, msg_id, {
        quote: select?.quote,
        withdraw
      })
    },
    Controllers
  }

  /**
   * 撤回消息
   */
  if (new RegExp(/DELETE$/).test(event.eventType)) {
    e.typing = 'DELETE'

    APPS.responseEventType(e)
    return
  }

  // 屏蔽其他机器人的消息
  if (event.msg.author.bot) return

  if (event.msg.mentions) {
    /**
     * 去掉@ 转为纯消息
     */
    for await (const item of event.msg.mentions) {
      if (item.bot != true) {
        // 用户艾特才会为真
        e.at = true
      }
      e.at_users.push({
        id: item.id,
        name: item.username,
        avatar: item.avatar,
        bot: item.bot
      })
    }
    /**
     * 循环删除文本中的at信息并去除前后空格
     */
    e.at_users.forEach(item => {
      e.msg = e.msg.replace(`<@!${item.id}>`, '').trim()
    })
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

  if (e.bot.avatar == '') {
    /**
     * 配置一下机器人头像
     */
    const bot = e.at_users.find(item => item.bot == true && item.id == e.bot.id)
    if (bot) {
      e.bot.avatar = bot.avatar
      setBotMsgByQQ(bot)
    }
  }

  APPS.responseMessage(e)
  return
}
