import { replyController } from './reply.js'
import { ControllerOption, UserInformationType } from '../../../core/index.js'
import { getBotConfigByKey } from '../../../config/index.js'
import { ClientNTQQ } from '../../sdk/index.js'
export const Controller = {
  Member: () => {
    return {
      information: async (): Promise<UserInformationType | false> => {
        return false
      },
      mute: async (option?: { time?: number; cancel?: boolean }) => {
        return false
      },
      remove: async () => {
        return false
      },
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
      update: async (
        content: Buffer | string | number | (Buffer | number | string)[]
      ) => {
        return false
      },
      withdraw: async (hideTip: boolean) => {
        return false
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
      audio: async (file: Buffer | string, name?: string) => {
        if (typeof file == 'string') {
          return await ClientNTQQ.groupOpenMessages(guild_id, {
            content: '',
            media: {
              file_info: await ClientNTQQ.postRichMediaByGroup(guild_id, {
                srv_send_msg: false,
                file_type: 3,
                url: file
              }).then(res => res.file_info)
            },
            msg_id,
            msg_type: 7
          })
        }
        return false
      },
      video: async (file: Buffer | string, name?: string) => {
        if (typeof file == 'string') {
          return await ClientNTQQ.groupOpenMessages(guild_id, {
            content: '',
            media: {
              file_info: await ClientNTQQ.postRichMediaByGroup(guild_id, {
                srv_send_msg: false,
                file_type: 2,
                url: file
              }).then(res => res.file_info)
            },
            msg_id,
            msg_type: 7
          })
        }
        return false
      },
      emoji: async (msg: any[], cancel?: boolean) => {
        return []
      },
      card: async (msg: any[]) => {
        const arr = []
        for (const item of msg) {
          arr.push(
            ClientNTQQ.groupOpenMessages(guild_id, {
              msg_id,
              ...item
            })
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
        return false
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
  msg_id: string
}) => {
  return (select?: ControllerOption) => {
    const guild_id = select?.guild_id ?? data.guild_id
    const msg_id = select?.msg_id ?? data.msg_id
    return Controller.Message({ guild_id, msg_id })
  }
}

/**
 * 成员控制器
 * @param select
 * @returns
 */
export const ClientControllerOnMember = () => {
  return (select?: ControllerOption) => {
    return Controller.Member()
  }
}
