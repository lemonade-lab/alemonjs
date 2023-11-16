import { ControllerOption, UserInformationType } from '../../core/index.js'

export const Controller = {
  Member: ({ guild_id, user_id }) => {
    return {
      /**
       * 查看信息
       * @returns
       */
      information: async (): Promise<UserInformationType | false> => {
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
      ) => {},
      quote: async (
        content: Buffer | string | number | (Buffer | number | string)[]
      ) => {},
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
      emoji: async (msg: any[], cancel?: boolean) => {
        return []
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
        return []
      },
      allEmoji: async () => {
        return false
      },
      allUsers: async (
        obj: any,
        options = {
          cookie: '',
          limit: 20
        }
      ) => {
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
  send_at: number
}) => {
  return (select?: ControllerOption) => {
    const guild_id = select?.guild_id ?? data.guild_id
    const channel_id = select?.channel_id ?? data.channel_id
    const msg_id = select?.msg_id ?? data.msg_id
    return Controller.Message({ guild_id, channel_id, msg_id })
  }
}
