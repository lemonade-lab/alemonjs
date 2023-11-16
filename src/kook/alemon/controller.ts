import { ClientKOOK } from '../sdk/index.js'
import { replyController } from './reply.js'
import { ControllerOption, UserInformationType } from '../../core/index.js'

export const Controller = {
  Member: ({ guild_id, user_id }) => {
    return {
      /**
       * 查看信息
       * @returns
       */
      information: async (): Promise<UserInformationType | false> => {
        const data = await ClientKOOK.userView(guild_id, user_id).then(
          res => res.data
        )
        if (data) {
          return {
            id: data.id,
            name: data.username,
            introduce: '',
            bot: data.bot,
            avatar: data.avatar,
            joined_at: data.joined_at,
            role: data.roles
          }
        }
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
        return await ClientKOOK.guildKickout(guild_id, user_id)
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
  Message: ({ guild_id, channel_id, msg_id, user_id }) => {
    return {
      reply: async (
        content: Buffer | string | number | (Buffer | number | string)[]
      ) => {
        return await replyController(content, msg_id)
      },
      quote: async (
        content: Buffer | string | number | (Buffer | number | string)[]
      ) => {
        return await replyController(content, msg_id)
      },
      /**
       * 更新信息
       * @param content
       * @returns
       */
      update: async (
        content: Buffer | string | number | (Buffer | number | string)[]
      ) => {
        return await ClientKOOK.messageUpdate({ msg_id, content })
      },
      withdraw: async (hideTip: boolean) => {
        return await ClientKOOK.messageDelete(msg_id)
      },
      pinning: async (cancel?: boolean) => {
        return false
      },
      forward: async () => {
        return false
      },
      horn: async (cancel?: boolean) => {
        return false
      },
      emoji: async (msg: any[], cancel?: boolean) => {
        const arr: any[] = []
        if (cancel) {
          for (const item of msg) {
            arr.push(
              await ClientKOOK.messageDeleteReaction({
                msg_id,
                emoji: item,
                user_id
              })
            )
          }
          return arr
        }
        for (const item of msg) {
          arr.push(await ClientKOOK.messageAddReaction({ msg_id, emoji: item }))
        }
        return arr
      },
      card: async (msg: any[]) => {
        // 卡片
        return []
      },
      allEmoji: async () => {
        // 该消息的所有emoji
        return false
      },
      allUsers: async (
        emoji?: any,
        options = {
          cookie: '',
          limit: 20
        }
      ) => {
        // 该消息下 指定emoji的所有用户
        return await ClientKOOK.messageReactionList({ msg_id, emoji })
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
  user_id: string
}) => {
  return (select?: ControllerOption) => {
    const guild_id = select?.guild_id ?? data.guild_id
    const channel_id = select?.channel_id ?? data.channel_id
    const msg_id = select?.msg_id ?? data.msg_id
    const send_at = select?.send_at ?? data.send_at
    const user_id = select?.user_id ?? data.user_id
    return Controller.Message({ guild_id, channel_id, msg_id, user_id })
  }
}
