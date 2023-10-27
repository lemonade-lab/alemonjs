import {
  AMessage,
  InstructionMatching,
  UserType,
  getUrlbuffer
} from '../../../core/index.js'
import { BotEvent, MessageContentType, Client } from '../../sdk/index.js'
import IMGS from 'image-size'
import { segmentVilla } from '../segment.js'
import { getBotConfigByKey } from '../../../config/index.js'
import { now_e } from './e.js'
import {
  AlemonJSError,
  AlemonJSLog,
  everyoneError
} from '../../../log/index.js'
import { ClientKOA } from '../../../koa/index.js'

/**
 * 撤回消息
 * @param res
 * @param select
 * @returns
 */
const recallMessage = (
  res: { bot_msg_id: string },
  select: {
    quote?: string
    withdraw?: number
  },
  villa_id: number,
  room_id: number
) => {
  if (res && res.bot_msg_id && select?.withdraw && select?.withdraw > 1000) {
    setTimeout(() => {
      Client.recallMessage(villa_id, {
        room_id: String(room_id),
        msg_uid: res.bot_msg_id,
        msg_time: new Date().getTime()
      })
    }, select?.withdraw)
  }
  return res
}

/**
 * 图片转存
 * @param villa_id
 * @param uul
 * @param cfg
 * @returns
 */
const unloading = async (villa_id: number, uul: string) => {
  const NowObj = await Client.transferImage(villa_id, uul)
  if (!NowObj?.data?.new_url) return uul
  return NowObj?.data?.new_url
}

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
  const entities = MessageContent.content?.entities ?? []
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

  const cfg = getBotConfigByKey('villa')

  /**
   * 得到主人id
   */
  const masterID = cfg.masterID

  /**
   * 清除 @ 后的消息
   */
  const msg = txt.replace(/(@[^\s]+\s)(?!<)/g, '').trim()

  /**
   * 制作e消息对象
   */
  const e = {
    platform: 'villa',
    boundaries: 'publick',
    attribute: 'group',
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
    event: 'MESSAGES',
    /**
     *  消息类型
     * */
    eventType: 'CREATE',
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
    isMaster: MessageContent.user.id == masterID ? true : false,
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
    reply: async (
      msg: Buffer | string | number | (Buffer | number | string)[],
      select?: {
        quote?: string
        withdraw?: number
      }
    ): Promise<any> => {
      /**
       * isBuffer
       */
      if (Buffer.isBuffer(msg)) {
        /**
         * 挂载图片
         */
        const uul = await ClientKOA.setLocalImg(msg)
        if (!uul) return false
        const url = await unloading(villa_id, uul)
        const dimensions = IMGS.imageSize(msg)
        return await Client.sendMessageImage(villa_id, room_id, url, {
          width: dimensions.width,
          height: dimensions.height
        })
          .then(res => recallMessage(res?.data, select, villa_id, room_id))
          .catch(everyoneError)
      }
      /**
       * isString arr and find buffer
       */
      if (Array.isArray(msg) && msg.find(item => Buffer.isBuffer(item))) {
        // 找到其中一个buffer
        const isBuffer = msg.findIndex(item => Buffer.isBuffer(item))
        // 删除所有buffer
        const cont = msg
          .map(item => {
            if (typeof item === 'number') return String(item)
            return item
          })
          .filter(element => typeof element === 'string')
          .join('')
        // 字符解析器
        const { entities, content } = await Client.stringParsing(cont, villa_id)
        // 挂载图片
        const dimensions = IMGS.imageSize(msg[isBuffer] as Buffer)
        const uul = await ClientKOA.setLocalImg(msg[isBuffer] as Buffer)
        if (!uul) return false
        const url = await unloading(villa_id, uul)
        if (entities.length == 0) {
          return await Client.sendMessageTextUrl(
            villa_id,
            room_id,
            content,
            url,
            {
              width: dimensions.width,
              height: dimensions.height
            }
          )
            .then(res => recallMessage(res?.data, select, villa_id, room_id))
            .catch(everyoneError)
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
          )
            .then(res => recallMessage(res?.data, select, villa_id, room_id))
            .catch(everyoneError)
        }
      }
      // string and string[]
      const cont = Array.isArray(msg)
        ? msg.join('')
        : typeof msg === 'string'
        ? msg
        : typeof msg === 'number'
        ? `${msg}`
        : ''
      if (cont == '') return false

      /**
       * http
       */
      const match = cont.match(/<http>(.*?)<\/http>/)
      if (match) {
        const getUrl = match[1]
        const msg = await getUrlbuffer(getUrl)
        if (msg) {
          const uul = await ClientKOA.setLocalImg(msg)
          if (!uul) return false
          const url = await unloading(villa_id, uul)
          const dimensions = IMGS.imageSize(msg)
          return await Client.sendMessageImage(villa_id, room_id, url, {
            width: dimensions.width,
            height: dimensions.height
          })
            .then(res => recallMessage(res?.data, select, villa_id, room_id))
            .catch(everyoneError)
        }
      }

      /**
       * reply
       */
      const { entities, content } = await Client.stringParsing(cont, villa_id)
      if (entities.length == 0 && content != '') {
        return await Client.sendMessageText(villa_id, room_id, content)
          .then(res => recallMessage(res?.data, select, villa_id, room_id))
          .catch(everyoneError)
      } else if (entities.length != 0 && content != '') {
        return await Client.sendMessageTextEntities(
          villa_id,
          room_id,
          content,
          entities
        )
          .then(res => recallMessage(res?.data, select, villa_id, room_id))
          .catch(everyoneError)
      }
      return false
    },
    ...now_e
  } as AMessage

  /**
   * 业务处理
   */
  return await InstructionMatching(e)
    .then(() =>
      AlemonJSLog(e.channel_id, e.user_name, MessageContent.content.text)
    )
    .catch(err =>
      AlemonJSError(err, e.channel_id, e.user_name, MessageContent.content.text)
    )
}
