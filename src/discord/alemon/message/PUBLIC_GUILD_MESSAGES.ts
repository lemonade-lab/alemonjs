import { AMessage, UserType, InstructionMatching } from 'alemon'
import { Message as DcMessage } from 'discord.js'
import { getBotConfigByDiscord } from '../../config.js'
import { segmentDiscord } from '../segment.js'
import { getBotMsgByDiscord } from '../bot.js'
import { postImage } from '../api.js'
/**
 * 公共
 * @param event
 * @returns
 */
export const PUBLIC_GUILD_MESSAGES_DISCORD = async (event: DcMessage) => {
  /**
   * 忽视机器人
   */
  if (event.author.bot) {
    return
  }

  /**
   * 艾特消息处理
   */
  const at_users: UserType[] = []
  const obj = Object.fromEntries(event.mentions.users)

  /**
   *
   */
  for (const item in obj) {
    at_users.push({
      id: obj[item].id,
      name: obj[item].username,
      avatar: obj[item].avatarURL({
        extension: 'png',
        forceStatic: true,
        size: 1024
      }),
      bot: obj[item].bot
    })
  }

  /**
   * 清除 @ 相关
   */
  let msg = event.content
  for await (const item of at_users) {
    msg = msg.replace(`<@${item.id}>`, '').trim()
  }

  /**
   * 艾特处理
   */
  let at = false
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
   * 得到登录配置
   */
  const cfg = getBotConfigByDiscord()

  /**
   * 检查身份
   */
  if (event.author.id == cfg.masterID) {
    /**
     * 是主人
     */
    isMaster = true
  }

  /**
   * 构造e对象
   */
  const e = {
    platform: 'discord',
    /**
     * 机器人信息  tudo
     */
    bot: getBotMsgByDiscord(),
    /**
     * 频道
     */
    guild_id: event.guildId,
    channel_id: event.channelId,
    isPrivate: true,
    isRecall: false,
    isMaster: isMaster,
    isGroup: true,
    /**
     * 消息事件
     */
    event: 'MESSAGES',
    eventType: 'CREATE',
    msg_txt: event.content,
    msg_id: event.id,
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
    user_id: event.author.id,
    user_name: event.author.username,
    user_avatar: event.author.avatarURL({
      extension: 'png',
      forceStatic: true,
      size: 1024
    }),
    /**
     * 模板函数
     */
    segment: segmentDiscord,
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
          const attach = await postImage(img, typeof img == 'string' ? img : undefined)
          if (attach) {
            await event.channel.send({ files: [attach] })
            return true
          } else {
            return false
          }
        } catch (err) {
          console.error(err)
          return false
        }
      }
      const content = Array.isArray(msg) ? msg.join('') : typeof msg === 'string' ? msg : undefined
      if (Buffer.isBuffer(img)) {
        try {
          const attach = await postImage(img, name)
          if (attach) {
            await event.channel.send({ files: [attach] })
            return true
          } else {
            return false
          }
        } catch (err) {
          console.error(err)
          return false
        }
      }
      try {
        await event.channel.send(content)
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
}
