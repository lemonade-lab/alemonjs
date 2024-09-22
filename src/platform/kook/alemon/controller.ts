import { ClientKOOK } from '../sdk/index.js'
import { replyController } from './reply.js'
import {
  MessageButtonType,
  MessageContentType,
  type ControllerOption,
  type UserInformationType
} from '../../../core/index.js'
import { BaseConfig } from '../../../core/index.js'
import { ABotConfig } from '../../../config/index.js'
import { directController } from './direct.js'

export class Controllers extends BaseConfig<ControllerOption> {
  constructor(select?: ControllerOption) {
    super(select)
  }

  /**
   * 可行性
   */
  get feasibility() {
    if (this.get('platform') !== 'kook') return false
    return true
  }

  Member = {
    information: async (): Promise<UserInformationType | false> => {
      if (!this.feasibility) return false
      const guild_id = this.get('guild_id')
      const user_id = this.get('user_id')
      const data = await ClientKOOK.userView(guild_id, user_id).then(
        res => res.data
      )

      if (data) {
        const cfg = ABotConfig.get('qq')
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
      if (!this.feasibility) return false
      return false
    },
    remove: async () => {
      if (!this.feasibility) return false
      const guild_id = this.get('guild_id')
      const user_id = this.get('user_id')
      return await ClientKOOK.guildKickout(guild_id, user_id)
    },
    operate: async (role_id: string, add = true) => {
      if (!this.feasibility) return false
      return false
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
      const channel_id = this.get('channel_id')
      if (attribute == 'single') {
        const open_id = this.get('open_id')
        return await directController(content, channel_id, open_id)
      }
      return await replyController(content, channel_id)
    },
    quote: async (content: MessageContentType) => {
      if (!this.feasibility) {
        return {
          middle: [],
          backhaul: null
        }
      }
      const channel_id = this.get('channel_id')
      const attribute = this.get('attribute')
      if (attribute == 'single') {
        const open_id = this.get('open_id')
        return await directController(content, channel_id, open_id)
      }
      return await replyController(content, channel_id)
    },
    update: async (content: MessageContentType) => {
      if (!this.feasibility) return false
      const msg_id = this.get('msg_id')
      return await ClientKOOK.messageUpdate({ msg_id, content })
    },
    withdraw: async (hideTip: boolean) => {
      if (!this.feasibility) return false
      const msg_id = this.get('msg_id')
      return await ClientKOOK.messageDelete(msg_id)
    },
    pinning: async (cancel?: boolean) => {
      if (!this.feasibility) return false
      return false
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
      const msg_id = this.get('msg_id')
      const user_id = this.get('user_id')
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
    audio: async (file: Buffer | string, name?: string) => {
      if (!this.feasibility) return false
      const channel_id = this.get('channel_id')
      if (typeof file == 'string') {
        return await ClientKOOK.createMessage({
          type: 3,
          target_id: channel_id,
          content: file
        })
      }
      const ret = await ClientKOOK.postFile(file, name)
      if (!ret) return false
      return await ClientKOOK.createMessage({
        type: 3,
        target_id: channel_id,
        content: ret.data.url
      })
    },
    video: async (file: Buffer | string, name?: string) => {
      if (!this.feasibility) return false
      const channel_id = this.get('channel_id')
      if (typeof file == 'string') {
        return await ClientKOOK.createMessage({
          type: 3,
          target_id: channel_id,
          content: file
        })
      }
      const ret = await ClientKOOK.postFile(file, name)
      if (!ret) return false
      return await ClientKOOK.createMessage({
        type: 3,
        target_id: channel_id,
        content: ret.data.url
      })
    },
    card: async (msg: any[]) => {
      if (!this.feasibility) return []
      const channel_id = this.get('channel_id')
      return [
        await ClientKOOK.createMessage({
          type: 10,
          target_id: channel_id,
          content: JSON.stringify(msg)
        })
      ]
    },
    allUsers: async (
      emoji?: any,
      options = {
        cookie: '',
        limit: 20
      }
    ) => {
      if (!this.feasibility) return false
      const msg_id = this.get('msg_id')
      return await ClientKOOK.messageReactionList({ msg_id, emoji })
    },
    article: async (msg: any) => {
      if (!this.feasibility) return false
      return false
    }
  }
}
