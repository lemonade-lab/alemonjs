import { AMessage, EventType, EventEnum, InstructionMatching, UserType, PlatformEnum } from 'alemon'
import { BotEvent, MessageContentType, Client } from 'mys-villa'
import imageSize from 'image-size'
import { segmentVilla } from '../segment.js'
import { getBotConfigByVilla } from '../../config.js'
import { now_e } from './e.js'

/**
 * 获取ip
 */
const ip = await Client.getIP()

/**
 * 消息会话
 * @param event 回调数据
 * @param val  类型控制
 */
export async function MESSAGES_VILLA(event: BotEvent) {
  /**
   * 数据包解析
   */
  const MessageContent: MessageContentType = JSON.parse(
    event.extend_data.EventData.SendMessage.content
  )
  /**
   * 别野编号
   */
  const villa_id = event.robot.villa_id
  /**
   * 房间号
   */
  const room_id = event.extend_data.EventData.SendMessage.room_id
  /**
   * 得到特效
   */
  const entities = MessageContent.content.entities
  /**
   * 收集uid
   */
  const at_users: UserType[] = []
  /**
   * at控制
   */
  let at = false

  /**
   * 艾特用户
   */
  let at_user: UserType | undefined = undefined

  /**
   * 消息原文
   */
  const txt = MessageContent.content.text

  /**
   * 解析
   */
  for await (const item of entities) {
    const name = txt
      .substring(item.offset, item.offset + item.length)
      .trim()
      .replace(/^@|(\s+)?$/g, '')
    if (item.entity.user_id) {
      /**
       * 存在用户艾特
       */
      at = true
      at_users.push({
        id: item.entity.user_id,
        name,
        avatar: 'string',
        bot: false
      })
      continue
    }
    if (item.entity.bot_id) {
      at_users.push({
        id: item.entity.bot_id,
        name,
        avatar: 'string',
        bot: true
      })
      continue
    }
  }

  /**
   * 存在at
   */
  if (at) {
    /**
     * 找到第一个不是bot的用户
     */
    at_user = at_users.find(item => item.bot != true)
  }

  /**
   * 得到登录配置
   */

  const cfg = getBotConfigByVilla()

  /**
   * 得到主人id
   */
  const masterID = cfg.masterID

  /**
   * 默认不是主人
   */
  let isMaster = false

  /**
   * 检查身份
   */
  if (MessageContent.user.id == masterID) {
    /**
     * 是主人
     */
    isMaster = true
  }

  /**
   * 清除 @ 后的消息
   */
  const msg = txt.replace(/(@[^\s]+\s)(?!<)/g, '').trim()

  /**
   * 制作e消息对象
   */
  const e = {
    platform: PlatformEnum.villa,
    /**
     * 机器人信息
     */
    bot: {
      id: event.robot.template.id,
      name: event.robot.template.name,
      avatar: event.robot.template.icon
    },
    /**
     * 消息编号
     */
    /**
     * 事件类型
     */
    event: EventEnum.MESSAGES,
    /**
     *  消息类型
     * */
    eventType: EventType.CREATE,
    /**
     *  是否是私域
     *
     * */
    isPrivate: false,
    /**
     * 是否是群聊
     * */
    isGroup: true,
    /**
     * 是否是撤回
     * */
    isRecall: false,
    /**
     * 是否是艾特
     * */
    at,
    /**
     * 艾特得到的qq
     * */
    at_users: at_users,
    /**
     * 艾特用户
     */
    at_user,
    /**
     * 是否是机器人主人
     */
    isMaster: isMaster,
    /*
     * 消息编号 这个消息是可以触发回复api的消息id
     */
    msg_id: event.id,
    /**
     * 去除了艾特后的消息
     * */
    msg: msg,
    /**
     * 原文
     */
    msg_txt: txt,
    /**
     * 房间编号
     */
    guild_id: String(villa_id),

    /**
     * 房间编号
     */
    channel_id: String(room_id),

    /**
     * 用户编号
     */
    user_id: MessageContent.user.id,

    /**
     * 用户名
     */
    user_name: MessageContent.user.name,

    /**
     * 用户头像
     */
    user_avatar: MessageContent.user.portrait,

    /**
     * 创建消息事件
     */
    msg_create_time: new Date().getTime(),

    /**
     * 模板接口
     */
    segment: segmentVilla,

    /**
     *消息发送
     * @param msg
     * @param img
     * @returns
     */
    reply: async (msg?: string | string[] | Buffer, img?: Buffer) => {
      /**
       * url获取
       */
      let url = ''
      /**
       * 第一参数是buffer
       */
      if (Buffer.isBuffer(msg)) {
        /**
         * 挂载图片
         */
        const dimensions = imageSize(msg)
        const uul = await Client.setLocalImg(msg)
        if (!uul) return false
        const NowObj = await Client.transferImage(villa_id, `http://${ip}:8080${uul}`)
        if (!NowObj) {
          url = `http://${ip}:8080${uul}`
        } else {
          url = NowObj.new_url
        }
        /**
         * 直接发送图片
         */
        return await Client.sendMessageImage(villa_id, room_id, url, {
          width: dimensions.width,
          height: dimensions.height
        }).catch(err => {
          console.error(err)
          return false
        })
      }

      /**
       * 第一个参数是对象且不是数组对象
       */
      if (typeof msg === 'object' && !Array.isArray(msg)) {
        const options: any = msg
        if (options?.image) {
          /**
           * 图片对象
           */
          return await Client.sendMessageTextUrl(villa_id, room_id, msg, options.image).catch(
            err => {
              console.error(err)
              return false
            }
          )
        }
        return false
      }

      /**
       * 字符解析器
       */
      const { entities, content } = await Client.stringParsing(msg, villa_id)

      /**
       * 第二参是 buffer
       */
      if (Buffer.isBuffer(img)) {
        /**
         * 挂载图片
         */
        const dimensions = imageSize(img)
        const uul = await Client.setLocalImg(img)
        if (!uul) return false
        const NowObj = await Client.transferImage(villa_id, `http://${ip}:8080${uul}`)
        if (!NowObj) {
          url = `http://${ip}:8080${uul}`
        } else {
          url = NowObj.new_url
        }
        if (entities.length == 0) {
          return await Client.sendMessageTextUrl(villa_id, room_id, content, url, {
            width: dimensions.width,
            height: dimensions.height
          }).catch(err => {
            console.error(err)
            return false
          })
        } else {
          return await Client.sendMessageTextEntitiesUrl(
            villa_id,
            room_id,
            content,
            entities,
            url,
            {
              width: dimensions.width,
              height: dimensions.height
            }
          ).catch(err => {
            console.error(err)
            return false
          })
        }
      }
      if (entities.length == 0 && content != '') {
        return await Client.sendMessageText(villa_id, room_id, content).catch(err => {
          console.error(err)
          return false
        })
      } else if (entities.length != 0 && content != '') {
        return await Client.sendMessageTextEntities(villa_id, room_id, content, entities).catch(
          err => {
            console.error(err)
            return false
          }
        )
      }
      return false
    },
    ...now_e
  }

  /**
   * 业务处理
   */
  await InstructionMatching(e as AMessage)
    .then(() => {
      console.info(`\n[${e.channel_id}] [${e.user_name}] [${true}] ${MessageContent.content.text}`)
      return true
    })
    .catch((err: any) => {
      console.error(`\n[${e.channel_id}] [${e.user_name}] [${true}] ${MessageContent.content.text}`)
      console.error(err)
      return false
    })
  return false
}
