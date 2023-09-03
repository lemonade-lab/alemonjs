import { InstructionMatching } from 'alemon'
import { EventEnum, EventType, AMessage, UserType, PlatformEnum } from 'alemon'
import { Message, AttachmentBuilder } from 'discord.js'
import { getBotConfigByDiscord } from '../../config.js'
import { segmentDiscord } from '../segment.js'
import { getBotMsgByDiscord } from '../bot.js'
/**
 * 公共
 * @param interaction
 * @returns
 */
export const PUBLIC_GUILD_MESSAGES_DISCORD = async (interaction: Message) => {
  /**
   * 忽视机器人
   */
  if (interaction.author.bot) {
    return
  }

  /**
   * 艾特消息处理
   */
  const at_users: UserType[] = []
  const obj = Object.fromEntries(interaction.mentions.users)

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
  let msg = interaction.content
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
  if (interaction.author.id == cfg.masterID) {
    /**
     * 是主人
     */
    isMaster = true
  }

  /**
   * 构造e对象
   */
  const e = {
    platform: PlatformEnum.discord,
    /**
     * 机器人信息  tudo
     */
    bot: getBotMsgByDiscord(),
    /**
     * 频道
     */
    guild_id: interaction.guildId,
    channel_id: interaction.channelId,
    isPrivate: true,
    isRecall: false,
    isMaster: isMaster,
    isGroup: true,
    /**
     * 消息事件
     */
    event: EventEnum.MESSAGES,
    eventType: EventType.CREATE,
    msg_txt: interaction.content,
    msg_id: interaction.id,
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
    user_id: interaction.author.id,
    user_name: interaction.author.username,
    user_avatar: interaction.author.avatarURL({
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
    reply: async (msg?: string | string[] | Buffer, img?: Buffer): Promise<boolean> => {
      if (Buffer.isBuffer(msg)) {
        try {
          const attach = new AttachmentBuilder(msg, { name: 'result.jpeg' })
          await interaction.channel.send({ files: [attach] })
          return true
        } catch (err) {
          console.error(err)
          return false
        }
      }
      const content = Array.isArray(msg) ? msg.join('') : typeof msg === 'string' ? msg : undefined
      if (Buffer.isBuffer(img)) {
        try {
          const attach = new AttachmentBuilder(img, { name: 'result.jpeg' })
          await interaction.channel.send({ files: [attach] })
          return true
        } catch (err) {
          console.error(err)
          return false
        }
      }
      try {
        await interaction.channel.send(content)
        return true
      } catch {
        return false
      }
    }
  }

  /**
   * 消息处理
   */
  await InstructionMatching(e as AMessage)
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
