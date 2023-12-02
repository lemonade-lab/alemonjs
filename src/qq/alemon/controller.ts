import { type IMember } from 'qq-guild-bot'
import { replyController } from './reply.js'
import { ControllerOption, type UserInformationType } from '../../core/index.js'
import { getBotConfigByKey } from '../../config/index.js'
import { directController } from './direct.js'
import { everyoneError } from '../../log/index.js'
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
          .catch(everyoneError)

        if (data) {
          const cfg = getBotConfigByKey('qq')
          const masterID = cfg.masterID
          return {
            id: data.user.id,
            name: data.user.username,
            avatar: data.user.avatar,
            introduce: '',
            joined_at: new Date(data.joined_at).getTime(),
            bot: data.user.bot,
            isMaster: masterID == data.user.id,
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
      mute: async (option?: { time?: number; cancel?: boolean }) => {
        if (option.cancel) {
          return await ClientQQ.muteApi
            .muteMember(guild_id, user_id, {
              seconds: String(option.time ?? 60000 / 1000)
            })
            .catch(everyoneError)
        } else {
          return await ClientQQ.muteApi
            .muteMember(guild_id, user_id, {
              seconds: '0'
            })
            .catch(everyoneError)
        }
      },
      /**
       * 踢出
       */
      remove: async () => {
        return await ClientQQ.guildApi
          .deleteGuildMember(guild_id, user_id)
          .catch(everyoneError)
      },
      /**
       * 身分组
       * @param role_id 身分组编号
       * @param is_add 默认添加行为
       * @returns
       */
      operate: async (role_id: string, add = true) => {
        if (add) {
          return await ClientQQ.memberApi
            .memberAddRole(guild_id, role_id, user_id, channel_id)
            .catch(everyoneError)
        } else {
          return await ClientQQ.memberApi
            .memberDeleteRole(guild_id, role_id, user_id, channel_id)
            .catch(everyoneError)
        }
      }
    }
  },
  Message: ({ guild_id, channel_id, msg_id, open_id, user_id }) => {
    return {
      reply: async (
        content: Buffer | string | number | (Buffer | number | string)[]
      ) => {
        if (open_id && open_id != '' && user_id) {
          return await directController(content, open_id, msg_id, {
            open_id: open_id,
            user_id: user_id
          }).catch(everyoneError)
        }
        return await replyController(content, channel_id, msg_id).catch(
          everyoneError
        )
      },
      quote: async (
        content: Buffer | string | number | (Buffer | number | string)[]
      ) => {
        return await replyController(content, channel_id, msg_id, {
          quote: msg_id
        }).catch(everyoneError)
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
        return await ClientQQ.messageApi
          .deleteMessage(channel_id, msg_id, hideTip)
          .catch(everyoneError)
      },
      pinning: async (cancel?: boolean) => {
        if (cancel) {
          return await ClientQQ.pinsMessageApi
            .deletePinsMessage(channel_id, msg_id)
            .catch(everyoneError)
        }
        return await ClientQQ.pinsMessageApi
          .putPinsMessage(channel_id, msg_id)
          .catch(everyoneError)
      },
      forward: async () => {
        return false
      },
      horn: async (cancel?: boolean) => {
        if (cancel) {
          return await ClientQQ.announceApi
            .deleteGuildAnnounce(guild_id, msg_id)
            .catch(everyoneError)
        }
        return await ClientQQ.announceApi
          .postGuildAnnounce(guild_id, channel_id, msg_id)
          .catch(everyoneError)
      },
      emoji: async (msg: any[], cancel?: boolean) => {
        const arr: any[] = []
        if (cancel) {
          for (const item of msg) {
            arr.push(
              await ClientQQ.reactionApi
                .deleteReaction(channel_id, {
                  message_id: msg_id,
                  ...item
                })
                .catch(everyoneError)
            )
          }
          return arr
        }
        for (const item of msg) {
          arr.push(
            await ClientQQ.reactionApi
              .postReaction(channel_id, {
                message_id: msg_id,
                ...item
              })
              .catch(everyoneError)
          )
        }
        return arr
      },
      /**
       * 音频
       * @param file
       * @param name
       */
      audio: async (file: Buffer | string, name?: string) => {
        return false
      },
      /**
       * 视频
       * @param file
       * @param name
       */
      video: async (file: Buffer | string, name?: string) => {
        return false
      },
      card: async (msg: any[]) => {
        // 卡片消息
        const arr: any[] = []
        for (const item of msg) {
          arr.push(
            await ClientQQ.messageApi
              .postMessage(channel_id, {
                msg_id: msg_id,
                ...item
              })
              .catch(everyoneError)
          )
        }
        return arr
      },
      allUsers: async (
        reactionObj: any,
        options = {
          cookie: '',
          limit: 20
        }
      ) => {
        return await ClientQQ.reactionApi
          .getReactionUserList(channel_id, reactionObj, options)
          .catch(everyoneError)
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
  guild_id: string
  channel_id: string
  msg_id: string
  user_id: string
}) => {
  return (select?: ControllerOption) => {
    const guild_id = select?.guild_id ?? data.guild_id
    const channel_id = select?.channel_id ?? data.channel_id
    const msg_id = select?.msg_id ?? data.msg_id
    const user_id = select?.user_id ?? data.user_id
    const open_id = select?.open_id
    return Controller.Message({
      guild_id,
      channel_id,
      user_id,
      msg_id,
      open_id
    })
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
