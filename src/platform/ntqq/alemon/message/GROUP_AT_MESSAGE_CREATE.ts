import {
  APPS,
  type EventEnum,
  type TypingEnum
} from '../../../../core/index.js'
import { BotMessage } from '../bot.js'
import { ABotConfig } from '../../../../config/index.js'
import { GROUP_DATA } from '../types.js'
/**
 * 公私域合并
 * @param e
 * @param data  原数据
 * @returns
 */
export const GROUP_AT_MESSAGE_CREATE = async (event: GROUP_DATA) => {
  const { appID, masterID } = ABotConfig.get('ntqq')
  const e = {
    platform: 'ntqq',
    event: 'MESSAGES' as (typeof EventEnum)[number],
    typing: 'CREATE' as (typeof TypingEnum)[number],
    boundaries: 'publick' as 'publick' | 'private',
    attribute: 'group' as 'group' | 'single',
    bot: BotMessage.get(),
    isMaster: Array.isArray(masterID)
      ? masterID.includes(event.author.id)
      : event.author.id == masterID,
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
    quote: '',
    open_id: event.author.member_openid,
    user_id: event.author.id,
    user_name: '无',
    user_avatar: `https://q.qlogo.cn/qqapp/${appID}/${event.author.id}/640`,
    at_users: [],
    at: false,
    at_user: undefined,
    send_at: new Date().getTime()
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
  APPS.response(e)
  APPS.responseMessage(e)
  return
}
