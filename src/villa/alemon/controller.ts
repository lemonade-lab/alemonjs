import { ClientVILLA } from '../sdk/index.js'
import { replyController } from './reply.js'

/**
 * 客户端控制器
 * @param select
 * @returns
 */
export const ClientController = (data?: {
  guild_id: string | number
  channel_id: string | number
  msg_id: string
  send_at: number
}) => {
  return (select?: {
    guild_id?: string
    channel_id?: string
    msg_id?: string
    send_at?: number
  }) => {
    const villa_id = select?.guild_id ?? data.guild_id
    const room_id = select?.channel_id ?? data.channel_id
    const msg_uid = select?.msg_id ?? data.msg_id
    const send_at = select?.send_at ?? data.send_at
    return {
      reply: async (
        content: Buffer | string | number | (Buffer | number | string)[]
      ) => {
        // villa未有回复api
        return await replyController(villa_id, room_id, content)
      },
      quote: async (
        content: Buffer | string | number | (Buffer | number | string)[]
      ) => {
        // villa未有回复api
        return await replyController(villa_id, room_id, content)
      },
      withdraw: async () => {
        return await ClientVILLA.recallMessage(villa_id, {
          room_id: room_id,
          msg_uid: msg_uid,
          send_at: send_at
        })
      },
      pinning: async (cancel = false) => {
        return await ClientVILLA.pinMessage(villa_id, {
          room_id: room_id,
          is_cancel: cancel,
          msg_uid: msg_uid,
          send_at: send_at
        })
      },
      horn: async (cancel = false) => {
        return false
      },
      forward: async () => {
        return false
      },
      emoji: async (msg: any[], cancel?: boolean) => {
        return false
      },
      card: async (msg: any[]) => {
        return false
      }
    }
  }
}

/**
 * 客户端控制器
 * @param select
 * @returns
 */
export const ClientControllerOnMember = (data?: {
  guild_id: string | number
  uid: string | number
}) => {
  return (select?: { guild_id?: string; uid?: string }) => {
    const villa_id = select?.guild_id ?? data.guild_id
    const uid = select?.guild_id ?? data.uid
    return {
      /**
       * 查看信息
       * @returns
       */
      message: async () => {
        // 对进行进行过滤,并以固定格式返回
        const data = await ClientVILLA.getMember(villa_id, uid).then(
          res => res.data
        )
        if (!data) return false
        return {
          id: data.member.basic.uid,
          name: data.member.basic.nickname,
          avatar: data.member.basic.avatar
        }
      },
      /**
       * 禁言
       */
      mute: async () => {},
      /**
       * 踢出
       */
      remove: async () => {}
    }
  }
}
