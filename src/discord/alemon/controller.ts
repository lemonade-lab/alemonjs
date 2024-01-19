import { BaseConfig } from '../../core/index.js'
import {
  type ControllerOption,
  type UserInformationType
} from '../../core/index.js'
import { replyController } from './reply.js'
export class Controllers extends BaseConfig<ControllerOption> {
  constructor(select?: ControllerOption) {
    super(select)
  }

  Member = {
    /**
     * 查看信息
     * @returns
     */
    information: async (): Promise<UserInformationType | false> => {
      return false
    },
    /**
     * 禁言
     * @param param0
     * @returns
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

  Message = {
    reply: async (
      content: Buffer | string | number | (Buffer | number | string)[]
    ) => {
      const attribute = this.get('attribute')
      if (attribute == 'single') return
      const channel_id = this.get('channel_id')
      return await replyController(content, channel_id)
    },
    quote: async (
      content: Buffer | string | number | (Buffer | number | string)[]
    ) => {
      return false
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
      const arr: any[] = []
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
