import { replyController } from './reply.js'

export const Controller = {
  Mumber: ({ guild_id, user_id }) => {
    return {
      /**
       * 查看信息
       * @returns
       */
      information: async () => {
        return false
      },
      /**
       * 禁言
       */
      mute: async () => {
        return false
      },
      /**
       * 踢出
       */
      remove: async () => {
        return false
      },
      /**
       * 身分组
       * @param role_id 身分组编号
       * @param is_add 默认添加行为
       * @returns
       */
      operate: async (role_id: string, add = true) => {
        return false
      }
    }
  },
  Message: ({ guild_id, msg_id }) => {
    return {
      reply: async (
        content: Buffer | string | number | (Buffer | number | string)[]
      ) => {
        return await replyController(content, guild_id, msg_id)
      },
      quote: async (
        content: Buffer | string | number | (Buffer | number | string)[]
      ) => {
        return await replyController(content, guild_id, msg_id)
      },
      withdraw: async (hideTip: boolean) => {},
      pinning: async (cancel?: boolean) => {},
      forward: async () => {},
      horn: async (cancel?: boolean) => {},
      emoji: async (msg: any[], cancel?: boolean) => {},
      card: async (msg: any[]) => {},
      allEmoji: async () => {}
    }
  }
}

/**
 * 客户端控制器
 * @param select
 * @returns
 */
export const ClientController = (data: {
  guild_id: string
  channel_id: string
  msg_id: string
  send_at: number
}) => {
  return (select?: {
    guild_id?: string
    channel_id?: string
    msg_id?: string
    send_at?: number
  }) => {
    const guild_id = select?.guild_id ?? data.guild_id
    const channel_id = select?.channel_id ?? data.channel_id
    const msg_id = select?.msg_id ?? data.msg_id
    const send_at = select?.send_at ?? data.send_at
    return Controller.Message({ guild_id, msg_id })
  }
}
