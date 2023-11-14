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
