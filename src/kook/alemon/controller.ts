import { ClientKOOK } from '../sdk/index.js'
import { replyController } from './reply.js'
import {
  BaseConfig,
  type ControllerOption,
  type UserInformationType
} from '../../core/index.js'
import { ABotConfig } from '../../config/index.js'
import { directController } from './direct.js'

export class Controllers extends BaseConfig<ControllerOption> {
  constructor(select?: ControllerOption) {
    super(select)
  }

  Member = {
    information: async (): Promise<UserInformationType | false> => {
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
      return false
    },
    remove: async () => {
      const guild_id = this.get('guild_id')
      const user_id = this.get('user_id')
      return await ClientKOOK.guildKickout(guild_id, user_id)
    },
    operate: async (role_id: string, add = true) => {
      return false
    }
  }
  Message = {
    reply: async (
      content: Buffer | string | number | (Buffer | number | string)[]
    ) => {
      const attribute = this.get('attribute')
      const channel_id = this.get('channel_id')
      if (attribute == 'single') {
        const open_id = this.get('open_id')
        return await directController(content, channel_id, open_id)
      }
      return await replyController(content, channel_id)
    },
    quote: async (
      content: Buffer | string | number | (Buffer | number | string)[]
    ) => {
      const channel_id = this.get('channel_id')
      const attribute = this.get('attribute')
      if (attribute == 'single') {
        const open_id = this.get('open_id')
        return await directController(content, channel_id, open_id)
      }
      return await replyController(content, channel_id)
    },
    update: async (
      content: Buffer | string | number | (Buffer | number | string)[]
    ) => {
      const msg_id = this.get('msg_id')
      return await ClientKOOK.messageUpdate({ msg_id, content })
    },
    withdraw: async (hideTip: boolean) => {
      const msg_id = this.get('msg_id')
      return await ClientKOOK.messageDelete(msg_id)
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
      const msg_id = this.get('msg_id')
      return await ClientKOOK.messageReactionList({ msg_id, emoji })
    },
    article: async (msg: any) => {
      return false
    }
  }
}
