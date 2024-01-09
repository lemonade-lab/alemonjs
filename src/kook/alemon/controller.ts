import { ClientKOOK } from '../sdk/index.js'
import { replyController } from './reply.js'
import {
  type ControllerOption,
  type UserInformationType
} from '../../core/index.js'
import { BOTCONFIG } from '../../config/index.js'

export class Controllers {
  select: ControllerOption
  constructor(select?: ControllerOption) {
    this.select = select
  }
  Member(select?: ControllerOption) {
    const guild_id = select.guild_id ?? this.select?.guild_id
    const open_id = select.open_id ?? this.select?.open_id
    const channel_id = select.channel_id ?? this.select?.channel_id
    const msg_id = select.msg_id ?? this.select?.msg_id
    const user_id = select.user_id ?? this.select?.user_id
    return {
      information: async (): Promise<UserInformationType | false> => {
        const data = await ClientKOOK.userView(guild_id, user_id).then(
          res => res.data
        )

        if (data) {
          const cfg = BOTCONFIG.get('qq')
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
        return await ClientKOOK.guildKickout(guild_id, user_id)
      },
      operate: async (role_id: string, add = true) => {
        return false
      }
    }
  }
  Message(select?: ControllerOption) {
    const guild_id = select.guild_id ?? this.select?.guild_id
    const open_id = select.open_id ?? this.select?.open_id
    const channel_id = select.channel_id ?? this.select?.channel_id
    const msg_id = select.msg_id ?? this.select?.msg_id
    const user_id = select.user_id ?? this.select?.user_id
    return {
      reply: async (
        content: Buffer | string | number | (Buffer | number | string)[]
      ) => {
        return await replyController(content, channel_id)
      },
      quote: async (
        content: Buffer | string | number | (Buffer | number | string)[]
      ) => {
        return await replyController(content, channel_id)
      },
      update: async (
        content: Buffer | string | number | (Buffer | number | string)[]
      ) => {
        return await ClientKOOK.messageUpdate({ msg_id, content })
      },
      withdraw: async (hideTip: boolean) => {
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
        // 该消息下 指定emoji的所有用户
        return await ClientKOOK.messageReactionList({ msg_id, emoji })
      },
      article: async (msg: any) => {
        return false
      }
    }
  }
}
