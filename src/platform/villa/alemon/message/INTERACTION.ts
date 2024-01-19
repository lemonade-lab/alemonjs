import { APPS } from '../../../../core/index.js'
import {
  type EventEnum,
  type TypingEnum,
  type MessageBingdingOption
} from '../../../../core/index.js'
import { ABotConfig } from '../../../../config/index.js'
import { segmentVILLA } from '../segment.js'
import { replyController } from '../reply.js'

/**
 * @param event 按钮数据
 */
export async function INTERACTION(event: {
  robot: {
    template: {
      id: string
      name: string
      desc: string
      icon: string
      customSettings: any[]
      commands: Array<{
        name: string // 指令
        desc: string // 指令说明
      }>
    }
    villaId: number
  }
  type: number
  extendData: {
    clickMsgComponent: {
      villaId: number
      roomId: number
      componentId: string
      msgUid: string
      uid: number
      botMsgId: string
      extra: string
    }
  }
  createdAt: number
  id: string
  sendAt: number
}) {
  const ClickMsgComponent = event.extendData.clickMsgComponent

  const masterID = ABotConfig.get('villa').masterID

  const msg_id = `${ClickMsgComponent.msgUid}.0`

  /**
   * 制作e消息对象
   */
  const e = {
    platform: 'villa',
    boundaries: 'publick' as 'publick' | 'private',
    attribute: 'group' as 'group' | 'single',
    event: 'INTERACTION' as (typeof EventEnum)[number],
    typing: 'CREATE' as (typeof TypingEnum)[number],
    bot: {
      id: event.robot.template.id,
      name: event.robot.template.name,
      avatar: event.robot.template.icon
    },
    isMaster: Array.isArray(masterID)
      ? masterID.includes(String(ClickMsgComponent.uid))
      : String(ClickMsgComponent.uid) == masterID,
    guild_id: String(ClickMsgComponent.villaId),
    guild_name: '',
    guild_avatar: '',
    channel_name: '',
    channel_id: String(ClickMsgComponent.roomId),
    attachments: [],
    specials: [],
    //
    at: false,
    at_users: [],
    at_user: undefined,
    msg_id: msg_id,
    // 回调透传信息
    msg: String(ClickMsgComponent.extra),
    msg_txt: '',
    quote: '',
    open_id: '',

    //
    user_id: String(ClickMsgComponent.uid),
    user_name: '',
    user_avatar: '',
    //
    send_at: 0,
    segment: segmentVILLA,
    /**
     *消息发送
     * @param msg
     * @param img
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
      const villaId = select?.guild_id ?? ClickMsgComponent.villaId
      const roomId = select?.channel_id ?? ClickMsgComponent.roomId
      return await replyController(villaId, roomId, msg, {
        quote: select?.quote
      })
    }
  }

  APPS.responseEventType(e)
  return
}
