import { BaseConfig } from '../../../core/index.js'
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

  Member = {
    /**
     * 查看信息
     * @returns
     */
    information: async (): Promise<UserInformationType | false> => {
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
    update: async (
      content: Buffer | string | number | (Buffer | number | string)[]
    ) => {
      return false
    },
    withdraw: async (msgId?: string) => {
      const msg_id = msgId ?? this.get('msg_id')
      const channel_id = this.get('channel_id')
      return await ClientDISOCRD.deleteMessage(channel_id, msg_id)
    },
    pinning: async (cancel?: boolean, msgId?: string) => {
      const channel_id = this.get('channel_id')
      let msg_id = msgId ?? this.get('msg_id')
      if (cancel) {
        return await ClientDISOCRD.deletepinMessage(channel_id, msg_id)
      }
      return await ClientDISOCRD.pinMessage(channel_id, msg_id)
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
