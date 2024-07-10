import { replyController } from './reply.js'
import {
  BaseConfig,
  MessageButtonType,
  MessageContentType,
  type ControllerOption,
  type UserInformationType
} from '../../../core/index.js'
import { ApiRequestData, ClientNTQQ, MarkdownType } from '../sdk/index.js'
import { directController } from './direct.js'
import { getKeyboardData } from './utils.js'

export class Controllers extends BaseConfig<ControllerOption> {
  constructor(select?: ControllerOption) {
    super(select)
  }

  /**
   * 可行性
   */
  get feasibility() {
    if (this.get('platform') !== 'ntqq') return false
    return true
  }

  Member = {
    information: async (): Promise<UserInformationType | false> => {
      if (!this.feasibility) return false
      return false
    },
    mute: async (option?: { time?: number; cancel?: boolean }) => {
      if (!this.feasibility) return false
      return false
    },
    remove: async () => {
      if (!this.feasibility) return false
      return false
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
      const guild_id = this.get('guild_id')
      const msg_id = this.get('msg_id')
      const open_id = this.get('open_id')
      const attribute = this.get('attribute')
      if (attribute == 'single') {
        return await directController(content, open_id, msg_id, arg)
      }
      return await replyController(content, guild_id, msg_id, arg)
    },
    quote: async (content: MessageContentType) => {
      if (!this.feasibility) {
        return {
          middle: [],
          backhaul: null
        }
      }
      const guild_id = this.get('guild_id')
      const msg_id = this.get('msg_id')
      const open_id = this.get('open_id')
      const attribute = this.get('attribute')
      if (attribute == 'single') {
        return await directController(content, open_id, msg_id)
      }
      return await replyController(content, guild_id, msg_id)
    },
    update: async (content: MessageContentType) => {
      if (!this.feasibility) return false
      return false
    },
    withdraw: async (hideTip: boolean) => {
      if (!this.feasibility) return false
      return false
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
    audio: async (file: Buffer | string, name?: string) => {
      if (!this.feasibility) return false
      const guild_id = this.get('guild_id')
      const msg_id = this.get('msg_id')
      if (typeof file == 'string') {
        const file_info = await ClientNTQQ.postRichMediaByGroup(guild_id, {
          srv_send_msg: false,
          file_type: 3,
          url: file
        }).then(res => res?.file_info)
        if (!file_info) return false
        const attribute = this.get('attribute')
        const open_id = this.get('open_id')
        if (attribute == 'single') {
          return await ClientNTQQ.usersOpenMessages(open_id, {
            content: '',
            media: {
              file_info
            },
            msg_id,
            msg_type: 7,
            msg_seq: ClientNTQQ.getMsgSeq(msg_id)
          })
        }
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
      if (!this.feasibility) return false
      const guild_id = this.get('guild_id')
      const msg_id = this.get('msg_id')
      if (typeof file == 'string') {
        const file_info = await ClientNTQQ.postRichMediaByGroup(guild_id, {
          srv_send_msg: false,
          file_type: 2,
          url: file
        }).then(res => res?.file_info)
        if (!file_info) return false
        const attribute = this.get('attribute')
        const open_id = this.get('open_id')
        if (attribute == 'single') {
          return await ClientNTQQ.usersOpenMessages(open_id, {
            content: '',
            media: {
              file_info
            },
            msg_id,
            msg_type: 7,
            msg_seq: ClientNTQQ.getMsgSeq(msg_id)
          })
        }
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
      if (!this.feasibility) return []
      return []
    },
    card: async (msg: any[]) => {
      if (!this.feasibility) return []
      const guild_id = this.get('guild_id')
      const msg_id = this.get('msg_id')
      const attribute = this.get('attribute')
      const open_id = this.get('open_id')
      const arr = []
      for (const item of msg) {
        const smg =
          attribute == 'single'
            ? await ClientNTQQ.usersOpenMessages(open_id, {
                msg_id,
                msg_seq: ClientNTQQ.getMsgSeq(msg_id),
                ...item
              })
            : await ClientNTQQ.groupOpenMessages(guild_id, {
                msg_id,
                ...item,
                msg_seq: ClientNTQQ.getMsgSeq(msg_id)
              })
        arr.push(smg)
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
      if (!this.feasibility) return false
      return false
    },
    article: async (msg: any) => {
      if (!this.feasibility) return false
      return false
    },
    /**
     * 发送markdown消息，需要申请模板
     * @param custom_template_id 
     * @param content 消息内容，如果是内邀用户直接传string，否则需要传递模版内变量与填充值的kv映射
     */
    markdown: async (markdown: MarkdownType, ...arg: ([string] | MessageButtonType[]) & MessageButtonType[][]) => {
      const guild_id = this.get('guild_id')
      const msg_id = this.get('msg_id')
      const attribute = this.get('attribute')
      const open_id = this.get('open_id')
      const data: ApiRequestData = { msg_id, msg_seq: ClientNTQQ.getMsgSeq(msg_id), msg_type: 2 as const, markdown }

      if (arg && arg.length > 0) {
        if (typeof arg[0] === 'string') {
          data.keyboard = { id: arg[0] }
        } else {
          data.keyboard = getKeyboardData(arg)
        }
      }

      return attribute == 'single'
      ? await ClientNTQQ.usersOpenMessages(open_id, data)
      : await ClientNTQQ.groupOpenMessages(guild_id, data)
    }
  }
}
