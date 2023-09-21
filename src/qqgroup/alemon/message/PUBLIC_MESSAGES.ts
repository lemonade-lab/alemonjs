import { AMessage, UserType, InstructionMatching, CardType } from 'alemon'
import { GroupEventType } from '../types.js'
import { segmentQQGroup } from '../segment.js'
import { getBotMsgByQQGroup } from '../bot.js'
// icqq
import { segmentIcqq } from '../../icqq/segment.js'
import { getUserAvatar } from '../../icqq/user.js'
import { parseMsg } from '../msg.js'
import { getBotConfigByKey } from '../../../login.js'

/**
 * 响应普通消息
 * @param event
 * @returns
 */
export async function PUBLIC_MESSAGESByQQGroup(event: GroupEventType) {
  // 消息监听
  // console.info('message=', event)

  /**
   * 得到配置
   */
  const cfg = getBotConfigByKey('qqgroup')

  const allBot = cfg.botQQ ?? []
  for (const item of allBot) {
    if (event.sender.user_id == item) {
      // 直接返回
      return
    }
  }

  /**
   * 重点关注字段
   * atall
   */

  const bot = getBotMsgByQQGroup()
  /**
   * 艾特消息处理
   */
  const at_users: UserType[] = []
  /**
   * 艾特处理
   */
  let at = false
  /**
   * 清除 @ 相关
   */
  let msg = ''
  /**
   *
   */
  for (const item of event.message) {
    if (item.type == 'text') {
      msg = item.text
    }
    if (item.type == 'image') {
      /**
       * 把图片地址当成消息
       */
      msg = item.url
    }
    if (item.type == 'json') {
      msg = item.data
    }
    if (item.type == 'at') {
      /**
       * 如果存在 atme
       * 而且 id与qq相等
       * 自己就是bot
       */
      let isBot = false
      if (item.qq == bot.id && event.message_type == 'group' && event.atme) {
        isBot = true
      }
      at_users.push({
        id: String(item.qq),
        name: msg.replace('@', '').trim(),
        avatar: getUserAvatar(item.qq),
        /**
         * qq 如何判断是否是 bot
         * 只能靠主人主动收集
         * 就把对方视为bot
         * 主人用指令添加bot标记
         * 因此需要添加一个是否是bot的收集json
         * 同时该json文件非监听类型
         */
        bot: isBot
      })
    }
  }

  let at_user: UserType | undefined = undefined

  if (at_users.some(item => item.bot != true)) {
    at = true
  }
  if (at) {
    at_user = at_users.find(item => item.bot != true)
  }

  /**
   * 主人处理
   */
  let isMaster = false

  /**
   * 检查身份
   */
  if (event.sender.user_id == cfg.masterID) {
    /**
     * 是主人
     */
    isMaster = true
  }

  let group_id = 0
  let guild_name = ''
  if (event.message_type == 'group') {
    guild_name = event.group_name
    group_id = event.group_id
  }

  /**
   * 构造e对象
   */
  const e = {
    platform: 'qqgroup',
    /**
     * 机器人信息
     */
    bot,
    /**
     * 频道
     */
    guild_id: String(group_id),
    guild_name: guild_name,
    channel_id: String(group_id),
    channel_name: guild_name,
    isPrivate: true,
    isRecall: false,
    isMaster: isMaster,
    isGroup: event.message_type == 'group' ? true : false,
    /**
     * 消息事件
     */
    event: 'MESSAGES', // message
    eventType: 'CREATE',
    msg_txt: msg, // icqq做了处理 无法重新扁平化
    msg_id: event.message_id,
    msg: msg,
    /**
     * 艾特消息
     */
    at,
    at_user,
    at_users,
    msg_create_time: new Date().getTime(),
    /**
     * 用户
     */
    user_id: String(event.sender.user_id),
    user_name: event.sender.nickname,
    user_avatar: getUserAvatar(event.sender.user_id),
    /**
     * 模板函数
     */
    segment: segmentQQGroup,
    /**
     * 消息发送机制
     * @param content 消息内容
     * @param img 额外消息 可选
     */
    reply: async (
      msg?: string | string[] | Buffer,
      img?: Buffer | string,
      name?: string
    ): Promise<boolean> => {
      if (Buffer.isBuffer(msg)) {
        try {
          event.reply(segmentIcqq.image(msg)).catch(err => {
            console.error(err)
          })
          return true
        } catch (err) {
          console.error(err)
          return false
        }
      }
      const content = Array.isArray(msg) ? msg.join('') : typeof msg === 'string' ? msg : undefined
      if (Buffer.isBuffer(img)) {
        try {
          event.reply([content, segmentIcqq.image(img)]).catch(err => {
            console.error(err)
          })
          return true
        } catch (err) {
          console.error(err)
          return false
        }
      }
      try {
        event.reply(parseMsg(content)).catch(err => {
          console.error(err)
        })
        return true
      } catch {
        return false
      }
    },
    replyByMid: async (
      mid: string,
      msg?: string | string[] | Buffer,
      img?: Buffer | string,
      name?: string
    ) => {
      try {
        if (Buffer.isBuffer(msg)) {
          try {
            event.reply(segmentIcqq.image(msg), true).catch(err => {
              console.error(err)
            })
            return true
          } catch (err) {
            console.error(err)
            return false
          }
        }
        const content = Array.isArray(msg)
          ? msg.join('')
          : typeof msg === 'string'
          ? msg
          : undefined
        if (Buffer.isBuffer(img)) {
          try {
            event.reply([content, segmentIcqq.image(img)], true).catch(err => {
              console.error(err)
            })
            return true
          } catch (err) {
            console.error(err)
            return false
          }
        }
        try {
          event.reply(parseMsg(content), true).catch(err => {
            console.error(err)
          })
          return true
        } catch {
          return false
        }
      } catch {
        return false
      }
    },
    replyCard: async (arr: CardType[]) => {
      const cardArr: any = []
      const map = {
        qqgroup_image: card => cardArr.push(segmentIcqq.image(card)),
        qqgroup_json: card => cardArr.push(segmentIcqq.json(card)),
        qqgroup_xml: card => cardArr.push(segmentIcqq.xml(card)),
        qqgroup_face: card => cardArr.push(segmentIcqq.face(card)),
        qqgroup_at: card => cardArr.push(segmentIcqq.at(card)),
        qqgroup_bface: item => cardArr.push(segmentIcqq.bface(item.card.file, item.card.text)),
        qqgroup_dice: card => cardArr.push(segmentIcqq.dice(card)),
        qqgroup_fake: card => cardArr.push(segmentIcqq.face(card)),
        qqgroup_flash: card => cardArr.push(segmentIcqq.flash(card)),
        qqgroup_fromCqcode: card => cardArr.push(segmentIcqq.fromCqcode(card)),
        qqgroup_location: card =>
          cardArr.push(segmentIcqq.location(card.lat, card.lng, card.address, card.id)),
        qqgroup_mirai: card => cardArr.push(segmentIcqq.mirai(card)),
        qqgroup_music: card => cardArr.push(segmentIcqq.music(card)),
        qqgroup_poke: card => cardArr.push(segmentIcqq.poke(card)),
        qqgroup_share: card => cardArr.push(segmentIcqq.sface(card)),
        qqgroup_video: card => cardArr.push(segmentIcqq.video(card)),
        qqgroup_record: card => cardArr.push(segmentIcqq.record(card)),
        qqgroup_rps: card => cardArr.push(segmentIcqq.rps(card)),
        qqgroup_text: card => cardArr.push(segmentIcqq.text(card))
      }
      for (const item of arr) {
        if (map[item.type]) {
          map[item.type](item.card)
        }
      }
      try {
        event.reply(cardArr).catch(err => {
          console.error(err)
        })
        return true
      } catch {
        return false
      }
    }
  } as AMessage

  /**
   * 消息处理
   */
  await InstructionMatching(e)
    .then(() => {
      console.info(`\n[${e.channel_id}] [${e.user_name}] [${true}] ${e.msg_txt}`)
      return true
    })
    .catch((err: any) => {
      console.error(err)
      console.info(`\n[${e.channel_id}] [${e.user_name}] [${false}] ${e.msg_txt}`)
      return false
    })

  return false
}
