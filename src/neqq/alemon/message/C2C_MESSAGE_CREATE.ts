import { CardType, InstructionMatching, AMessage } from 'alemon'
import { EventData } from '../types.js'
import { segmentQQ } from '../segment.js'
import { setBotMsgByQQ } from '../bot.js'
import { getBotConfigByKey } from '../../../login.js'

/**
 * 单聊
 * @param e
 * @param data  原数据
 * @returns
 */
export const C2C_MESSAGE_CREATE = async (e: AMessage, event: EventData) => {
  /**
   * 屏蔽其他机器人的消息
   */
  if (event.msg.author.bot) return

  /**
   * 得到登录配置
   */

  const cfg = getBotConfigByKey('qq')

  /**
   * 得到主人id
   */
  const masterID = cfg.masterID

  /**
   * 默认不是主人
   */
  e.isMaster = false

  /**
   * 检查身份
   */
  if (event.msg.author.id == masterID) {
    /**
     * 是主人
     */
    e.isMaster = true
  }

  /**
   * 是群聊
   */
  e.isGroup = true

  /**
   * 消息发送机制
   * @param msg 消息
   * @param img
   * @returns
   */
  e.reply = async (
    msg?: string | string[] | Buffer,
    img?: Buffer | string,
    name?: string
  ): Promise<boolean> => {
    if (Buffer.isBuffer(msg)) {
      try {
        return false
      } catch (err) {
        console.error(err)
        return false
      }
    }
    const content = Array.isArray(msg) ? msg.join('') : typeof msg === 'string' ? msg : undefined
    if (Buffer.isBuffer(img)) {
      try {
        return false
      } catch (err) {
        console.error(err)
        return false
      }
    }
    /**
     * 发送接口
     */
    return false
  }

  e.replyCard = async (arr: CardType[]) => {
    for (const item of arr) {
      try {
        if (item.type == 'qq_ark' || item.type == 'qq_embed') {
          return false
        } else {
          return false
        }
      } catch {
        return false
      }
    }
    return true
  }

  /**
   * 引用消息
   * @param mid
   * @param boj
   * @returns
   */

  e.replyByMid = async (mid: string, msg: string) => {
    return false
  }

  /**
   * 发送表情表态
   * @param mid
   * @param boj { emoji_type: number; emoji_id: string }
   * @returns
   */
  e.replyEmoji = async (
    mid: string,
    boj: { emoji_type: number; emoji_id: string }
  ): Promise<boolean> => {
    return false
  }

  /**
   * 删除表情表态
   * @param mid
   * @param boj { emoji_type: number; emoji_id: string }
   * @returns
   */
  e.deleteEmoji = async (
    mid: string,
    boj: { emoji_type: number; emoji_id: string }
  ): Promise<boolean> => {
    return false
  }

  /**
   * 消息原文
   */
  e.msg_txt = event.msg.content

  /**
   * 消息
   */
  e.msg = event.msg.content

  /**
   * 消息编号
   */
  e.msg_id = event.msg.id

  /**
   * 用户编号
   */
  e.user_id = event.msg.author.id

  /**
   * 用户头像
   */
  e.user_avatar = event.msg.author.avatar

  /**
   * 用户名
   */
  e.user_name = event.msg.author.username

  /**
   * 子频道编号
   */
  e.channel_id = event.msg.channel_id

  /**
   * 频道编号
   */
  e.guild_id = event.msg.guild_id

  /**
   * 模块
   */
  e.segment = segmentQQ

  /**
   * 被艾特的用户
   */
  e.at_users = []

  /**
   * 艾特消息处理
   */
  e.at = false

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

  if (e.bot.avatar == 'string') {
    /**
     * 配置一下机器人头像
     */
    const bot = e.at_users.find(item => item.bot == true && item.id == e.bot.id)
    if (bot) {
      e.bot.avatar = bot.avatar
      setBotMsgByQQ(bot)
    }
  }

  /**
   * 消息处理
   */
  await InstructionMatching(e)
    .then(() => {
      console.info(`\n[${e.channel_id}] [${e.user_name}] [${true}] \n ${e.msg_txt}`)
      return
    })
    .catch((err: any) => {
      console.error(err)
      console.info(`\n[${e.channel_id}] [${e.user_name}] [${false}] \n ${e.msg_txt}`)
      return
    })
}
