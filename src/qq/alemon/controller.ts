import { IMember } from 'qq-guild-bot'
import { replyController } from './reply.js'
import { ControllerOption, UserInformationType } from '../../core/index.js'

export const Controller = {
  Member: ({ guild_id, user_id, channel_id }) => {
    return {
      /**
       * 查看信息
       * @returns
       */
      information: async (): Promise<UserInformationType | false> => {
        const data: IMember = await ClientQQ.guildApi
          .guildMember(guild_id, user_id)
          .then(res => res.data)

        if (data) {
          return {
            id: data.user.id,
            name: data.user.username,
            avatar: data.user.avatar,
            introduce: '',
            joined_at: new Date(data.joined_at).getTime(),
            bot: data.user.bot,
            role: data.roles
          }
        }
        return false
      },
      /**
       * 禁言
       * @param param0
       * @returns
       */
      mute: async ({ time = 60000, is = true }) => {
        if (is) {
          return await ClientQQ.muteApi.muteMember(guild_id, user_id, {
            seconds: String(time / 1000)
          })
        } else {
          return await ClientQQ.muteApi.muteMember(guild_id, user_id, {
            seconds: '0'
          })
        }
      },
      /**
       * 踢出
       */
      remove: async () => {
        return await ClientQQ.guildApi.deleteGuildMember(guild_id, user_id)
      },
      /**
       * 身分组
       * @param role_id 身分组编号
       * @param is_add 默认添加行为
       * @returns
       */
      operate: async (role_id: string, add = true) => {
        if (add) {
          return await ClientQQ.memberApi.memberAddRole(
            guild_id,
            role_id,
            user_id,
            channel_id
          )
        } else {
          return await ClientQQ.memberApi.memberDeleteRole(
            guild_id,
            role_id,
            user_id,
            channel_id
          )
        }
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
      /**
       * 更新信息
       * @param content
       * @returns
       */
      update: async (
        content: Buffer | string | number | (Buffer | number | string)[]
      ) => {
        return false
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
        const arr: any[] = []
        if (cancel) {
          for (const item of msg) {
            arr.push(
              await ClientQQ.reactionApi.deleteReaction(channel_id, {
                message_id: msg_id,
                ...item
              })
            )
          }
          return arr
        }
        for (const item of msg) {
          arr.push(
            await ClientQQ.reactionApi.postReaction(channel_id, {
              message_id: msg_id,
              ...item
            })
          )
        }
        return arr
      },
      /**
       * 音频
       * @param file
       * @param name
       */
      audio: async (file: Buffer, name: string) => {
        return false
      },
      /**
       * 视频
       * @param file
       * @param name
       */
      video: async (file: Buffer, name: string) => {
        return false
      },
      card: async (msg: any[]) => {
        // 卡片消息
        const arr: any[] = []
        for (const item of msg) {
          arr.push(
            await ClientQQ.messageApi.postMessage(channel_id, {
              msg_id: msg_id,
              ...item
            })
          )
        }
        return arr
      },
      allEmoji: async () => {
        return false
      },
      allUsers: async (
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
}) => {
  return (select?: ControllerOption) => {
    const guild_id = select?.guild_id ?? data.guild_id
    const channel_id = select?.channel_id ?? data.channel_id
    const msg_id = select?.msg_id ?? data.msg_id
    return Controller.Message({ guild_id, channel_id, msg_id })
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
  channel_id: string
}) => {
  return (select?: ControllerOption) => {
    const guild_id = select?.guild_id ?? data.guild_id
    const user_id = select?.guild_id ?? data.user_id
    const channel_id = select?.channel_id ?? data.channel_id
    return Controller.Member({ guild_id, user_id, channel_id })
  }
}
