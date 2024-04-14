import { replyController } from './reply.js'
import {
  BaseConfig,
  ControllerOption,
  MessageButtonType,
  MessageContentType,
  type UserInformationType
} from '../../../core/index.js'
import { ABotConfig } from '../../../config/index.js'
import { directController } from './direct.js'
import { ClientQQ } from '../index.js'

export class Controllers extends BaseConfig<ControllerOption> {
  constructor(select?: ControllerOption) {
    super(select)
  }
  /**
   *
   */
  Member = {
    /**
     * 查看信息
     * @returns
     */
    information: async (): Promise<UserInformationType | false> => {
      const userId = this.get('user_id')
      const guildId = this.get('guild_id')
      const data = await ClientQQ.guildsMembersMessage(guildId, userId)
      if (data) {
        const cfg = ABotConfig.get('qq')
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
     * @param {object} option 选项
     * @param {string} option.time 禁言时间 0为解除禁言
     * @param {string} option.mute_end_timestamp 禁言结束时间 0为解除禁言
     * @param {string} option.userId 禁言用户ID
     * @param {boolean} option.all 是否全体禁言
     * @param {string[]} option.userlist 批量禁言成员列表
     * @returns
     */
    mute: async (option?: { time?: number; cancel?: boolean }) => {
      const guildId = this.get('guild_id')
      const userId = this.get('user_id')
      const time = option.time || '0'
      return await ClientQQ.guildsMemberMute(guildId, userId, {
        mute_seconds: String(time)
      })
    },
    /**
     * 踢出成员
     * @returns
     */
    remove: async () => {
      const guildId = this.get('guild_id')
      const user_id = this.get('user_id')
      return await ClientQQ.guildsMembersDelete(guildId, user_id)
    },
    /**
     * 将用户添加或移除指定身份组
     * @param user_id 用户ID
     * @param role_id 身份组ID
     * @param add 为true时添加，为false时移除 默认为true
     * @returns
     */
    operate: async (role_id: string, add: boolean = true) => {
      const guildId = this.get('guild_id')
      const channel_id = this.get('channel_id')
      const user_id = this.get('user_id')
      if (add) {
        return await ClientQQ.guildsRolesMembersPut(
          guildId,
          channel_id,
          user_id,
          role_id
        )
      }
      return await ClientQQ.guildsRolesMembersDelete(
        guildId,
        channel_id,
        user_id,
        role_id
      )
    }
  }

  /**
   *
   */
  Message = {
    /**
     *
     * @param content
     * @returns
     */
    reply: async (
      content: MessageContentType,
      ...arg: MessageButtonType[][]
    ) => {
      const open_id = this.get('open_id')
      const user_id = this.get('user_id')
      const msg_id = this.get('msg_id')
      const channel_id = this.get('channel_id')
      const attribute = this.get('attribute')
      if (attribute == 'single') {
        return await directController(content, open_id, msg_id, {
          open_id: open_id,
          user_id: user_id
        })
      }
      return await replyController(content, channel_id, msg_id)
    },
    /**
     *
     * @param content
     * @returns
     */
    quote: async (content: MessageContentType) => {
      const msg_id = this.get('msg_id')
      const channel_id = this.get('channel_id')
      return await replyController(content, channel_id, msg_id, {
        quote: msg_id
      })
    },
    /**
     * 撤回消息
     * @param msgId 消息ID(不填则为当前消息)
     * @param hideTip 是否隐藏提示
     */
    withdraw: async (hideTip: boolean = true) => {
      const msg_id = this.get('msg_id')
      const channel_id = this.get('channel_id')
      return await ClientQQ.channelsMessagesDelete(channel_id, msg_id, hideTip)
    },
    /**
     * 设置精华消息
     * @param msgId 消息ID(不填则为当前消息)
     * @param cancel 为true时取消精华 默认为false
     * @param all cancel为true时有效，为true时取消所有精华消息 默认为false
     * @returns
     */
    pinning: async (
      cancel: boolean = false,
      msgId?: string,
      all: boolean = false
    ) => {
      const channel_id = this.get('channel_id')
      let msg_id = msgId ?? this.get('msg_id')
      if (cancel) {
        if (all) msg_id = 'all'
        return await ClientQQ.channelsPinsDelete(channel_id, msg_id)
      }
      return await ClientQQ.channelsPinsPut(channel_id, msg_id)
    },
    /**
     * 转发消息
     * @param channel_id 频道ID
     * @param msgId 消息ID(不填则为当前消息)
     * @returns
     */
    forward: async () => {},
    audio: async () => {},
    video: async () => {},
    update: async () => {},
    horn: async (cancel?: boolean) => {
      if (cancel) {
        //
      }
    },
    emoji: async (msg: any[], cancel?: boolean) => {
      const arr: any[] = []
      if (cancel) {
        for (const item of msg) {
          arr.push()
        }
        return arr
      }
      for (const item of msg) {
        arr.push()
      }
      return arr
    },
    card: async (msg: any[]) => {
      // 卡片消息
      const arr: any[] = []
      for (const item of msg) {
        arr.push()
      }
      return ClientQQ.channelsMessagesPost(this.get('channel_id'), arr as any)
    },

    /**
     * 一条消息某一表情表态的用户列表
     * @param type 表情类型 1：系统表情 2：emoji表情
     * @param id 表情id 参考https://bot.q.qq.com/wiki/develop/api-v2/openapi/emoji/model.html#Emoji%20%E5%88%97%E8%A1%A8
     * @param {object} option 选项
     * @param {object} option.cookie 返回的cookie 第一次请求不传，后续请求传上次返回的cookie
     * @param {object} option.limit 返回的用户数量 默认20 最大50
     * @returns
     */
    allUsers: async (
      msg: {
        type: 1 | 2
        id: string
        msgId?: string
      },
      option: {
        limit?: number
        cookie?: string
      } = {}
    ) => {
      const channel_id = this.get('channel_id')
      const msg_id = msg.msgId ?? this.get('msg_id')
      return ClientQQ.channelsMessagesReactionsUsers(
        channel_id,
        msg_id,
        msg.type,
        msg.id,
        option
      )
    },
    /**
     *
     * @param msg
     * @returns
     */
    article: async (msg: any) => {
      return false
    }
  }
}
