import { replyController } from './reply.js'
import {
  type ControllerOption,
  type UserInformationType
} from '../../core/index.js'
import { ClientNTQQ } from '../sdk/index.js'

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
            msg_type: 7,
            msg_seq: ClientNTQQ.getMsgSeq(msg_id)
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
            msg_type: 7,
            msg_seq: ClientNTQQ.getMsgSeq(msg_id)
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
            await ClientNTQQ.groupOpenMessages(guild_id, {
              msg_id,
              ...item,
              msg_seq: ClientNTQQ.getMsgSeq(msg_id)
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
