import { ClientKOOK } from '../sdk/index.js'
import { replyController } from './reply.js'
import {
  type ControllerOption,
  type UserInformationType
} from '../../core/index.js'
import { getBotConfigByKey } from '../../config/index.js'
import { everyoneError } from '../../log/index.js'
export const Controller = {
  Member: ({ guild_id, user_id }) => {
    return {
      information: async (): Promise<UserInformationType | false> => {
        const data = await ClientKOOK.userView(guild_id, user_id)
          .then(res => res.data)
          .catch(everyoneError)
        if (data) {
          const cfg = getBotConfigByKey('qq')
          const masterID = cfg.masterID
          return {
            id: data.id,
            name: data.username,
            introduce: '',
            bot: data.bot,
            avatar: data.avatar,
            isMaster: masterID == data.id,
            joined_at: data.joined_at,
            role: data.roles
          }
        }
        return false
      },
      mute: async (option?: { time?: number; cancel?: boolean }) => {
        return false
      },
      remove: async () => {
        return await ClientKOOK.guildKickout(guild_id, user_id).catch(
          everyoneError
        )
      },
      operate: async (role_id: string, add = true) => {
        return false
      }
    }
  },
  Message: ({ channel_id, user_id, msg_id }) => {
    return {
      reply: async (
        content: Buffer | string | number | (Buffer | number | string)[]
      ) => {
        return await replyController(content, channel_id).catch(everyoneError)
      },
      quote: async (
        content: Buffer | string | number | (Buffer | number | string)[]
      ) => {
        return await replyController(content, channel_id).catch(everyoneError)
      },
      update: async (
        content: Buffer | string | number | (Buffer | number | string)[]
      ) => {
        return await ClientKOOK.messageUpdate({ msg_id, content }).catch(
          everyoneError
        )
      },
      withdraw: async (hideTip: boolean) => {
        return await ClientKOOK.messageDelete(msg_id).catch(everyoneError)
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
              }).catch(everyoneError)
            )
          }
          return arr
        }
        for (const item of msg) {
          arr.push(
            await ClientKOOK.messageAddReaction({ msg_id, emoji: item }).catch(
              everyoneError
            )
          )
        }
        return arr
      },
      audio: async (file: Buffer | string, name?: string) => {
        if (typeof file == 'string') {
          return await ClientKOOK.createMessage({
            type: 3,
            target_id: channel_id,
            content: file
          }).catch(everyoneError)
        }
        const ret = await ClientKOOK.postFile(file, name).catch(everyoneError)
        if (!ret) return false
        return await ClientKOOK.createMessage({
          type: 3,
          target_id: channel_id,
          content: ret.data.url
        }).catch(everyoneError)
      },
      video: async (file: Buffer | string, name?: string) => {
        if (typeof file == 'string') {
          return await ClientKOOK.createMessage({
            type: 3,
            target_id: channel_id,
            content: file
          }).catch(everyoneError)
        }
        const ret = await ClientKOOK.postFile(file, name).catch(everyoneError)
        if (!ret) return false
        return await ClientKOOK.createMessage({
          type: 3,
          target_id: channel_id,
          content: ret.data.url
        }).catch(everyoneError)
      },
      card: async (msg: any[]) => {
        return [
          await ClientKOOK.createMessage({
            type: 10,
            target_id: channel_id,
            content: JSON.stringify(msg)
          }).catch(everyoneError)
        ]
      },
      allUsers: async (
        emoji?: any,
        options = {
          cookie: '',
          limit: 20
        }
      ) => {
        // 该消息下 指定emoji的所有用户
        return await ClientKOOK.messageReactionList({ msg_id, emoji }).catch(
          everyoneError
        )
      },
      article: async (msg: any) => {
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
export const ClientController = (data: {
  msg_id: string
  channel_id: string
  user_id: string
}) => {
  return (select?: ControllerOption) => {
    const msg_id = select?.msg_id ?? data.msg_id
    const user_id = select?.user_id ?? data.user_id
    const channel_id = select?.channel_id ?? data.channel_id
    return Controller.Message({ msg_id, user_id, channel_id })
  }
}

/**
 * 成员控制器
 * @param select
 * @returns
 */
export const ClientControllerOnMember = (data?: {
  guild_id: string | number
  user_id: string
}) => {
  return (select?: ControllerOption) => {
    const guild_id = select?.guild_id ?? data.guild_id
    const user_id = select?.guild_id ?? data.user_id
    return Controller.Member({ guild_id, user_id })
  }
}
