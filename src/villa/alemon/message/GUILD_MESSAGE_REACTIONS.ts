import { AlemonJSEventError, AlemonJSEventLog } from '../../../log/index.js'
import {
  EventEnum,
  EventType,
  MessageBingdingOption,
  PlatformEnum,
  typeMessage
} from '../../../core/index.js'
import { segmentVILLA } from '../segment.js'
import { getBotConfigByKey } from '../../../config/index.js'
import { replyController } from '../reply.js'
import {
  ClientControllerOnMember,
  ClientControllerOnMessage
} from '../controller.js'

/**
 * 表情表态
 * @param event 回调数据
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
    villaId: number
  }
  type: number
  extendData: {
    // 增加和删除都是一个数据位
    addQuickEmoticon: {
      villaId: number // 别野编号
      roomId: number // 房间编号
      uid: number // 用户编号
      emoticonId: number // 表情编号
      emoticon: string // 表情说明  emoticon:狗头  =>  [狗头]
      isCancel?: boolean // 是撤回为  ture
      msgUid: string // 消息是谁的
      botMsgId: string // 机器人消息编号
    }
  }
  createdAt: number
  id: string
  sendAt: number
}) {
  if (process.env?.ALEMONJS_EVENT == 'dev') console.info('event', event)

  const AddQuickEmoticon = event.extendData.addQuickEmoticon

  const cfg = getBotConfigByKey('villa')
  const masterID = cfg.masterID

  const msg_id = `${AddQuickEmoticon.msgUid}.${event.sendAt}`

  const Message = ClientControllerOnMessage({
    guild_id: AddQuickEmoticon.villaId,
    channel_id: AddQuickEmoticon.roomId,
    msg_id: msg_id
  })

  const Member = ClientControllerOnMember({
    guild_id: AddQuickEmoticon.villaId,
    user_id: String(AddQuickEmoticon.uid)
  })

  /**
   * 制作e消息对象
   */
  const e = {
    platform: 'villa' as (typeof PlatformEnum)[number],
    event: 'GUILD_MESSAGE_REACTIONS' as (typeof EventEnum)[number],
    eventType: event.extendData.addQuickEmoticon.isCancel
      ? 'DELETE'
      : ('CREATE' as (typeof EventType)[number]),
    boundaries: 'publick' as 'publick' | 'private',
    attribute: 'group' as 'group' | 'single',
    bot: {
      id: event.robot.template.id,
      name: event.robot.template.name,
      avatar: event.robot.template.icon
    },
    isMaster: masterID == String(AddQuickEmoticon.uid),
    guild_id: String(AddQuickEmoticon.villaId),
    guild_name: '',
    guild_avatar: '',
    channel_name: '',
    channel_id: String(AddQuickEmoticon.roomId),
    attachments: [],
    specials: [
      {
        emoticon_id: AddQuickEmoticon.emoticonId,
        emoticon_type: 0,
        emoticon: AddQuickEmoticon.emoticon,
        is_cancel: AddQuickEmoticon?.isCancel ?? false,
        msg_uid: AddQuickEmoticon.msgUid
      }
    ],
    //
    at: false,
    at_user: undefined,
    at_users: [],
    msg: '',
    msg_id: msg_id,
    msg_txt: '',
    open_id: '',

    //
    user_id: String(AddQuickEmoticon.uid),
    user_name: '', // dodo 可权限获得
    user_avatar: '', // dodo 可权限获得
    send_at: event.sendAt,
    segment: segmentVILLA,
    /**
     * 消息回复
     * @param msg
     * @param select
     * @returns
     */
    reply: async (
      msg: Buffer | string | number | (Buffer | number | string)[],
      select?: MessageBingdingOption
    ): Promise<any> => {
      if (select?.open_id && select?.open_id != '') {
        console.error('VILLA 无私信')
        return false
      }
      const villaId = select?.guild_id ?? AddQuickEmoticon.villaId
      const roomId = select?.channel_id ?? AddQuickEmoticon.roomId
      return await replyController(villaId, roomId, msg, {
        quote: select?.quote
      })
    },
    Message,
    Member
  }

  /**
   * 只匹配类型
   */
  return await typeMessage(e)
    .then(() => AlemonJSEventLog(e.event, e.eventType))
    .catch(err => AlemonJSEventError(err, e.event, e.eventType))
}
