import {
  BaseConfig,
  MessageButtonType,
  MessageContentType
} from '../../../core/index.js'
import {
  type ControllerOption,
  type UserInformationType
} from '../../../core/index.js'
import { ClientDISOCRD } from '../index.js'
import { ABotConfig } from '../../../config/index.js'
import { replyController } from './reply.js'
export class Controllers extends BaseConfig<ControllerOption> {
  constructor(select?: ControllerOption) {
    super(select)
  }

  /**
   * 可行性
   */
  get feasibility() {
    if (this.get('platform') !== 'discord') return false
    return true
  }

  Member = {
    /**
     * 查看信息
     * @returns
     */
    information: async (): Promise<UserInformationType | false> => {
      if (!this.feasibility) return false
      const guildId = this.get('guild_id')
      const user_id = this.get('user_id')
      const data = await ClientDISOCRD.getGuildMember(guildId, user_id)
      if (data) {
        const cfg = ABotConfig.get('discord')
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
     *
     * 禁言
     * @param param0
     * @returns
     */
    mute: async (option?: { time?: number; cancel?: boolean }) => {
      if (!this.feasibility) return false
      return false
    },
    /**
     * 踢出
     */
    remove: async () => {
      if (!this.feasibility) return false
      const guildId = this.get('guild_id')
      const user_id = this.get('user_id')
      return await ClientDISOCRD.guildsMembersDelete(guildId, user_id)
    },
    /**
     * 身分组
     * @param role_id 身分组编号
     * @param is_add 默认添加行为
     * @returns
     */
    operate: async (role_id: string, add = true) => {
      if (!this.feasibility) return false
      const guildId = this.get('guild_id')
      const user_id = this.get('user_id')
      if (add) {
        return await ClientDISOCRD.guildsMEmbersRolesAdd(
          guildId,
          user_id,
          role_id
        )
      }
      return await ClientDISOCRD.guildsMembersRolesDelete(
        guildId,
        user_id,
        role_id
      )
    }
  }

  Message = {
    reply: async (
      content: MessageContentType,
      ...arg: MessageButtonType[][]
    ) => {
      if (!this.feasibility) {
        return {
          middle: [],
          backhaul: null
        }
      }
      const attribute = this.get('attribute')
      if (attribute == 'single') return
      const channel_id = this.get('channel_id')
      return await replyController(content, channel_id, {}, arg)
    },
    quote: async (content: MessageContentType) => {
      if (!this.feasibility) {
        return {
          middle: [],
          backhaul: null
        }
      }
      const msg_id = this.get('msg_id')
      const channel_id = this.get('channel_id')
      return await replyController(content, channel_id, {
        quote: msg_id
      })
    },
    /**
     * 更新信息
     * @param content
     * @returns
     */
    update: async (content: MessageContentType) => {
      if (!this.feasibility) return false
      return false
    },
    withdraw: async () => {
      if (!this.feasibility) return false
      const msg_id = this.get('msg_id')
      const channel_id = this.get('channel_id')
      return await ClientDISOCRD.deleteMessage(channel_id, msg_id)
    },
    pinning: async (cancel?: boolean, msgId?: string) => {
      if (!this.feasibility) return false
      const channel_id = this.get('channel_id')
      let msg_id = msgId ?? this.get('msg_id')
      if (cancel) {
        return await ClientDISOCRD.deletepinMessage(channel_id, msg_id)
      }
      return await ClientDISOCRD.pinMessage(channel_id, msg_id)
    },
    forward: async () => {
      if (!this.feasibility) return false
      return false
    },
    horn: async (cancel?: boolean) => {
      if (!this.feasibility) return false
      return false
    },
    emoji: async (msg: any[], cancel?: boolean) => {
      if (!this.feasibility) return []
      const arr: any[] = []
      return arr
    },
    /**
     * 音频
     * @param file
     * @param name
     */
    audio: async (file: Buffer | string, name?: string) => {
      if (!this.feasibility) return false
      return false
    },
    /**
     * 视频
     * @param file
     * @param name
     */
    video: async (file: Buffer | string, name?: string) => {
      if (!this.feasibility) return false
      return false
    },
    card: async (msg: any[]) => {
      if (!this.feasibility) return []
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
      if (!this.feasibility) return false
      return false
    },
    article: async (msg: any) => {
      if (!this.feasibility) return false
      return false
    }
  }
}
