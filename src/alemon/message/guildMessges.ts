import { IOpenAPI, IGuild, ReactionObj } from 'qq-guild-bot'
import { EventEmitter } from 'ws'
import { green } from 'kolorist'
import { PathLike } from 'fs'
import { BotType, BotConfigType, sendImage, postImage, InstructionMatching } from 'alemon'

/* 非依赖引用 */
import { channewlPermissions } from '../permissions'
import { replyPrivate } from '../privatechat'
import { AlemonMsgType } from '../types'

declare global {
  //接口对象
  var client: IOpenAPI
  //连接对象
  var ws: EventEmitter
  //机器人信息
  var robot: BotType
  //频道管理
  var guilds: Array<IGuild>
  //机器人配置
  var cfg: BotConfigType
}

export const guildMessges = async (e: AlemonMsgType) => {
  /* 屏蔽其他机器人的消息 */
  if (e.msg.author.bot) return

  const BotPS = await channewlPermissions(e.msg.channel_id, robot.user.id)
  e.bot_permissions = BotPS

  const UserPS = await channewlPermissions(e.msg.channel_id, e.msg.author.id)
  e.user_permissions = UserPS

  const channeldata = await client.channelApi
    .channel(e.msg.channel_id)
    .then(res => {
      return res.data
    })
    .catch((err: any) => console.error(err))

  e.msg.channel_name = channeldata['name']

  const guilddata = guilds.find(item => item.id == e.msg.guild_id)
  if (guilddata) {
    e.msg.owner_id = guilddata.id
  } else {
    e.msg.owner_id = 'false'
  }

  e.isMaster = false

  if (e.msg.author.id == cfg.masterID) {
    e.isMaster = true
  }

  e.isGroup = false

  /**
   * 消息发送机制
   * @param content 消息内容
   * @param obj 额外消息 可选
   */
  e.reply = async (msg?: string | object | Array<string>, obj?: object): Promise<boolean> => {
    const content = Array.isArray(msg) ? msg.join('') : typeof msg === 'string' ? msg : undefined
    const options = typeof msg === 'object' && !obj ? msg : obj
    return await client.messageApi
      .postMessage(e.msg.channel_id, {
        msg_id: e.msg.id,
        content,
        ...options
      })
      .then(() => true)
      .catch((err: any) => {
        console.error(err)
        return false
      })
  }

  /**
   * 表情表态
   * @param boj 表情对象
   */
  e.deleteEmoji = async (boj: ReactionObj): Promise<boolean> => {
    await client.reactionApi
      .deleteReaction(e.msg.channel_id, boj)
      .catch((err: any) => console.error(err))
    return true
  }

  e.postEmoji = async (boj: ReactionObj): Promise<boolean> => {
    await client.reactionApi
      .postReaction(e.msg.channel_id, boj)
      .catch((err: any) => console.error(err))
    return true
  }

  /**
   * 发送本地图片
   * @param content 消息内容  可选
   * @param file_image 消息图片
   * @returns
   */
  e.sendImage = async (file_image: any, content?: string): Promise<boolean> => {
    if (e.isGroup) return false
    return await sendImage(
      e.msg.channel_id,
      {
        msg_id: e.msg.id, //消息id, 必须
        file_image, //本地图片的路径
        content
      },
      e.isGroup
    )
      .then(() => true)
      .catch((err: any) => {
        console.error(err)
        return false
      })
  }

  /**
   * 发送截图
   * @param file_image
   * @param content 内容,可选
   * @returns
   */
  e.postImage = async (file_image: PathLike, content?: string): Promise<boolean> => {
    if (e.isGroup) return false
    return await postImage(
      e.msg.channel_id,
      {
        msg_id: e.msg.id, //消息id, 必须
        file_image, //buffer
        content
      },
      e.isGroup
    )
      .then(() => true)
      .catch((err: any) => {
        console.error(err)
        return false
      })
  }

  /* 消息 */
  e.cmd_msg = e.msg.content

  e.identity = {
    master: false, //频道主人
    member: false, //成员
    grade: '1', //等级
    admins: false, //管理员
    wardens: false //子频道管理也
  }

  if (e.msg.member) {
    if (e.msg.member.roles.find(item => item == '2')) e.identity.admins = true //管理员
    if (e.msg.member.roles.find(item => item == '4')) e.identity.master = true //频道主人
    if (e.msg.member.roles.find(item => item == '5')) e.identity.wardens = true //子频道管理
    const arr = e.msg.member.roles.filter(item => item != '2' && item != '4' && item != '5')
    const grade = arr[0].split(/(?<=1)/)
    if (grade.length > 1) e.identity.grade = grade[1]
  }

  /* 艾特消息处理 */
  e.at = false
  if (e.msg.mentions) {
    // 去掉@ 转为纯消息
    e.atuid = e.msg.mentions
    e.at = true
    /* 循环删除文本中的ati信息 */
    e.atuid.forEach(item => {
      e.cmd_msg = e.cmd_msg.replace(`<@!${item.id}>`, '').trim()
    })
  }

  e.replyPrivate = async (
    msg?: string | object | Array<string>,
    obj?: object
  ): Promise<boolean> => {
    return await replyPrivate(e.msg, msg, obj)
      .then(res => {
        console.log(res)
        return true
      })
      .catch(err => {
        console.log(err)
        return false
      })
  }

  /* 消息处理 */
  InstructionMatching(e).catch((err: any) => console.error(err))

  console.info(
    green(`\n[${guilddata.name}][${e.msg.channel_id}] [${e.msg.author.username}]\n${e.msg.content}`)
  )
}
