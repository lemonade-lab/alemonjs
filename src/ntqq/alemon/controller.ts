import { replyController } from './reply.js'
import {
  BaseConfig,
  type ControllerOption,
  type UserInformationType
} from '../../core/index.js'
import { ClientNTQQ } from '../sdk/index.js'

export class Controllers extends BaseConfig<ControllerOption> {
  constructor(select?: ControllerOption) {
    super(select)
  }
  Member = {
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
  Message = {
    reply: async (
      content: Buffer | string | number | (Buffer | number | string)[]
    ) => {
      const guild_id = this.get('guild_id')
      const msg_id = this.get('msg_id')
      return await replyController(content, guild_id, msg_id)
    },
    quote: async (
      content: Buffer | string | number | (Buffer | number | string)[]
    ) => {
      const guild_id = this.get('guild_id')
      const msg_id = this.get('msg_id')
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
      const guild_id = this.get('guild_id')
      const msg_id = this.get('msg_id')
      if (typeof file == 'string') {
        const file_info = await ClientNTQQ.postRichMediaByGroup(guild_id, {
          srv_send_msg: false,
          file_type: 3,
          url: file
        }).then(res => res?.file_info)
        if (!file_info) return false
        return await ClientNTQQ.groupOpenMessages(guild_id, {
          content: '',
          media: {
            file_info
          },
          msg_id,
          msg_type: 7,
          msg_seq: ClientNTQQ.getMsgSeq(msg_id)
        })
      }
      return false
    },
    video: async (file: Buffer | string, name?: string) => {
      const guild_id = this.get('guild_id')
      const msg_id = this.get('msg_id')
      if (typeof file == 'string') {
        const file_info = await ClientNTQQ.postRichMediaByGroup(guild_id, {
          srv_send_msg: false,
          file_type: 2,
          url: file
        }).then(res => res.file_info)
        if (!file_info) return false
        return await ClientNTQQ.groupOpenMessages(guild_id, {
          content: '',
          media: {
            file_info
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
      const guild_id = this.get('guild_id')
      const msg_id = this.get('msg_id')
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
