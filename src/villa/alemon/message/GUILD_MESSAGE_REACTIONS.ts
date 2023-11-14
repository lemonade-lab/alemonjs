import {
  AlemonJSEventError,
  AlemonJSEventLog,
  everyoneError
} from '../../../log/index.js'
import {
  EventEnum,
  EventType,
  PlatformEnum,
  typeMessage,
  getUrlbuffer
} from '../../../core/index.js'
import { segmentVILLA } from '../segment.js'
import { getBotConfigByKey } from '../../../config/index.js'
import { ClientVILLA } from '../../sdk/index.js'
import IMGS from 'image-size'

/**
 * 表情表态
 * @param event 回调数据
 * @param val  类型控制
 */
export async function GUILD_MESSAGE_REACTIONS(event: {
  robot: {
    template: {
      id: string
      name: string
      desc: string
      icon: string
      commands: Array<{
        name: string // 指令
        desc: string // 指令说明
      }>
    }
    villa_id: number
  }
  type: number
  extend_data: {
    EventData: {
      // 增加和删除都是一个数据位
      AddQuickEmoticon: {
        villa_id: number // 别野编号
        room_id: number // 房间编号
        uid: number // 用户编号
        emoticon_id: number // 表情编号
        emoticon: string // 表情说明  emoticon:狗头  =>  [狗头]
        is_cancel?: boolean // 是撤回为  ture
        msg_uid: string // 消息是谁的
        bot_msg_id: string // 机器人消息编号
      }
    }
  }
  created_at: number
  id: string
  send_at: number
}) {
  const AddQuickEmoticon = event.extend_data.EventData.AddQuickEmoticon

  const cfg = getBotConfigByKey('villa')
  const masterID = cfg.masterID

  /**
   * 制作e消息对象
   */
  const e = {
    platform: 'villa' as (typeof PlatformEnum)[number],
    boundaries: 'publick' as 'publick' | 'private',
    attribute: 'group' as 'group' | 'single',
    event: 'GUILD_MESSAGE_REACTIONS' as (typeof EventEnum)[number],
    eventType: event.extend_data.EventData.AddQuickEmoticon.is_cancel
      ? 'DELETE'
      : ('CREATE' as (typeof EventType)[number]),
    bot: {
      id: event.robot.template.id,
      name: event.robot.template.name,
      avatar: event.robot.template.icon
    },
    isPrivate: false,
    isGroup: true,
    isRecall: false,
    isMaster: masterID == String(AddQuickEmoticon.uid),
    guild_id: String(AddQuickEmoticon.villa_id),
    channel_id: String(AddQuickEmoticon.room_id),
    attachments: [],
    specials: [
      {
        emoticon_id: AddQuickEmoticon.emoticon_id,
        emoticon_type: 0,
        emoticon: AddQuickEmoticon.emoticon,
        is_cancel: AddQuickEmoticon?.is_cancel ?? false,
        msg_uid: AddQuickEmoticon.msg_uid
      }
    ],
    //
    at: false,
    at_user: undefined,
    at_users: [],
    msg: '',
    msg_id: AddQuickEmoticon.msg_uid,
    msg_txt: '',
    //
    user_id: String(AddQuickEmoticon.uid),
    user_name: '', // dodo 可权限获得
    user_avatar: '', // dodo 可权限获得
    send_at: event.send_at,
    segment: segmentVILLA,
    /**
     * 消息回复
     * @param msg
     * @param select
     * @returns
     */
    reply: async (
      msg: Buffer | string | number | (Buffer | number | string)[],
      select?: {
        quote?: string
        withdraw?: number
        guild_id?: string
        channel_id?: string
      }
    ): Promise<any> => {
      const villa_id = select?.guild_id ?? AddQuickEmoticon.villa_id
      const room_id = select?.channel_id ?? AddQuickEmoticon.room_id
      /**
       * isBuffer
       */
      if (Buffer.isBuffer(msg)) {
        /**
         * 上传图片
         */
        const url = await ClientVILLA.uploadImage(villa_id, msg).then(
          res => res?.data?.url
        )
        if (!url) return false
        const dimensions = IMGS.imageSize(msg)
        return await ClientVILLA.sendMessageImage(villa_id, room_id, url, {
          width: dimensions.width,
          height: dimensions.height
        }).catch(everyoneError)
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
        const { entities, content } = await ClientVILLA.stringParsing(
          cont,
          villa_id
        )
        /**
         * 上传图片
         */
        const url = await ClientVILLA.uploadImage(
          villa_id,
          msg[isBuffer] as Buffer
        ).then(res => res?.data?.url)
        if (!url) return false
        // 识别大小
        const dimensions = IMGS.imageSize(msg[isBuffer] as Buffer)
        if (entities.length == 0) {
          return await ClientVILLA.sendMessageTextUrl(
            villa_id,
            room_id,
            content,
            url,
            {
              width: dimensions.width,
              height: dimensions.height
            }
          ).catch(everyoneError)
        } else {
          return await ClientVILLA.sendMessageTextEntitiesUrl(
            villa_id,
            room_id,
            content,
            entities,
            url,
            {
              width: dimensions.width,
              height: dimensions.height
            }
          ).catch(everyoneError)
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
          /**
           * 上传图片
           */
          const url = await ClientVILLA.uploadImage(villa_id, msg).then(
            res => res?.data?.url
          )
          if (!url) return false
          const dimensions = IMGS.imageSize(msg)
          return await ClientVILLA.sendMessageImage(villa_id, room_id, url, {
            width: dimensions.width,
            height: dimensions.height
          }).catch(everyoneError)
        }
      }
      /**
       * reply
       */
      const { entities, content } = await ClientVILLA.stringParsing(
        cont,
        villa_id
      )
      if (entities.length == 0 && content != '') {
        return await ClientVILLA.sendMessageText(
          villa_id,
          room_id,
          content
        ).catch(everyoneError)
      } else if (entities.length != 0 && content != '') {
        return await ClientVILLA.sendMessageTextEntities(
          villa_id,
          room_id,
          content,
          entities
        ).catch(everyoneError)
      }
      return false
    },
    withdraw: async (select?: {
      guild_id?: string
      channel_id?: string
      msg_id?: string
      send_at?: number
    }) => {
      const villa_id = select?.guild_id ?? AddQuickEmoticon.villa_id
      const room_id = select?.channel_id ?? AddQuickEmoticon.room_id
      const msg_uid = select?.msg_id ?? false
      const send_at = select?.send_at ?? false
      if (!msg_uid || !room_id || !send_at) return false
      return ClientVILLA.recallMessage(villa_id, {
        room_id: room_id,
        msg_uid: msg_uid,
        send_at: send_at
      })
    }
  }

  /**
   * 只匹配类型
   */
  return await typeMessage(e)
    .then(() => AlemonJSEventLog(e.event, e.eventType))
    .catch(err => AlemonJSEventError(err, e.event, e.eventType))
}
