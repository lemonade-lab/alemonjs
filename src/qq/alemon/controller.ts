import { replyController } from './reply.js'

export const Controller = {
  Mumber: ({ guild_id, uid }) => {
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
  Message: ({ guild_id, channel_id, msg_id }) => {
    return {
      reply: async (
        content: Buffer | string | number | (Buffer | number | string)[]
      ) => {
        return await replyController(content, channel_id, msg_id)
      },
      quote: async (
        content: Buffer | string | number | (Buffer | number | string)[]
      ) => {
        return await replyController(content, channel_id, msg_id, {
          quote: msg_id
        })
      },
      withdraw: async (hideTip = true) => {
        return await ClientQQ.messageApi.deleteMessage(
          channel_id,
          msg_id,
          hideTip
        )
      },
      pinning: async (cancel?: boolean) => {
        if (cancel) {
          return await ClientQQ.pinsMessageApi.deletePinsMessage(
            channel_id,
            msg_id
          )
        }
        return await ClientQQ.pinsMessageApi.putPinsMessage(channel_id, msg_id)
      },
      forward: async () => {
        return false
      },
      horn: async (cancel?: boolean) => {
        if (cancel) {
          return await ClientQQ.announceApi.deleteGuildAnnounce(
            guild_id,
            msg_id
          )
        }
        return await ClientQQ.announceApi.postGuildAnnounce(
          guild_id,
          channel_id,
          msg_id
        )
      },
      emoji: async (msg: any[], cancel?: boolean) => {
        // 不同的场景下 api不同  私聊是不具有这么多功能的
        if (cancel) {
          // 是数组形式的表态
          const arr: any[] = []
          for (const item of msg) {
            arr.push(
              await ClientQQ.reactionApi.deleteReaction(channel_id, item)
            )
          }
          return arr
        }
        // 是数组形式的表态
        const arr: any[] = []
        for (const item of msg) {
          arr.push(await ClientQQ.reactionApi.postReaction(channel_id, item))
        }
        return arr
      },
      card: async (msg: any[]) => {
        // 卡片消息
        return []
      },
      allEmoji: async () => {
        //
        return false
      },
      byEmoji: async (
        reactionObj: any,
        options = {
          cookie: '',
          limit: 20
        }
      ) => {
        return await ClientQQ.reactionApi.getReactionUserList(
          channel_id,
          reactionObj,
          options
        )
      }
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
    return Controller.Message({ guild_id, channel_id, msg_id })
  }
}
