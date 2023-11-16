import { ControllerOption, UserInformationType } from '../../core/index.js'

export const Controller = {
  Member: () => {
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
      mute: async (option?: { time?: number; cancel?: boolean }) => {
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
  Message: () => {
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
export const ClientController = () => {
  return (select?: ControllerOption) => {
    return Controller.Message()
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
