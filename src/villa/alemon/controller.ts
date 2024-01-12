import { ClientVILLA } from '../sdk/index.js'
import { replyController } from './reply.js'
import {
  BaseConfig,
  ControllerOption,
  UserInformationType
} from '../../core/index.js'
import { ABotConfig } from '../../config/index.js'

/**
 * 控制器
 */
export class Controllers extends BaseConfig<ControllerOption> {
  constructor(select?: ControllerOption) {
    super(select)
  }
  /**
   * 消息控制器
   * @param param0
   * @returns
   */
  Message = {
    /**
     * 回复
     * @param content
     * @returns
     */
    reply: async (
      content: Buffer | string | number | (Buffer | number | string)[]
    ) => {
      const guild_id = this.get('guild_id')
      const channel_id = this.get('channel_id')
      return await replyController(guild_id, channel_id, content)
    },
    /**
     * 引用
     * @param content
     * @returns
     */
    quote: async (
      content: Buffer | string | number | (Buffer | number | string)[]
    ) => {
      const guild_id = this.get('guild_id')
      const channel_id = this.get('channel_id')
      const msg_id = this.get('msg_id')
      return await replyController(guild_id, channel_id, content, {
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
    /**
     * 撤回
     * @returns
     */
    withdraw: async (hideTip: boolean) => {
      const guild_id = this.get('guild_id')
      const channel_id = this.get('channel_id')
      const msg_id = this.get('msg_id')
      return await ClientVILLA.recallMessage(guild_id, {
        room_id: channel_id,
        msg_uid: msg_id
      })
    },
    /**
     *  钉选
     * @param cancel
     * @returns
     */
    pinning: async (cancel = false) => {
      const guild_id = this.get('guild_id')
      const channel_id = this.get('channel_id')
      const msg_id = this.get('msg_id')
      return await ClientVILLA.pinMessage(guild_id, {
        room_id: channel_id,
        is_cancel: cancel,
        msg_uid: msg_id
      })
    },
    /**
     *  喇叭
     * @param cancel
     * @returns
     */
    horn: async (cancel = false) => {
      return false
    },
    /**
     * 转发
     * @returns
     */
    forward: async () => {
      return false
    },
    /**
     *
     * 表态
     * @param msg
     * @param cancel
     * @returns
     */
    emoji: async (msg: any[], cancel?: boolean) => {
      return []
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
    /**
     * 卡片
     * @param msg
     * @returns
     */
    card: async (msg: any[]) => {
      const guild_id = this.get('guild_id')
      const channel_id = this.get('channel_id')
      const arr: any[] = []
      for (const item of msg) {
        arr.push(await ClientVILLA.sendCard(guild_id, channel_id, item))
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

  /**
   * 成员控制器
   * @param param0
   * @returns
   */
  Member = {
    /**
     * 查看信息
     * @returns
     */
    information: async (): Promise<UserInformationType | false> => {
      const guild_id = this.get('guild_id')
      const user_id = this.get('user_id')
      // 对进行进行过滤,并以固定格式返回
      const data = await ClientVILLA.getMember(guild_id, user_id).then(
        res => res.data
      )
      if (!data) return false
      const cfg = ABotConfig.get('villa')
      const masterID = cfg.masterID
      return {
        id: data.member.basic.uid,
        name: data.member.basic.nickname,
        introduce: data.member.basic.introduce,
        avatar: data.member.basic.avatar_url,
        joined_at: Number(data.member.joined_at),
        bot: false,
        isMaster: masterID == data.member.basic.uid,
        role: data.member.role_list
      }
    },
    /**
     * 禁言
     */
    mute: async (option?: { time?: number; cancel?: boolean }) => {
      //
    },
    /**
     * 踢出
     */
    remove: async () => {
      const guild_id = this.get('guild_id')
      const user_id = this.get('user_id')
      return await ClientVILLA.deleteVillaMember(guild_id, user_id)
    },
    /**
     * 身分组
     * @param role_id 身分组编号
     * @param is_add 默认添加行为
     * @returns
     */
    operate: async (role_id: string, add = true) => {
      const guild_id = this.get('guild_id')
      const user_id = this.get('user_id')
      return await ClientVILLA.operateMemberToRole(guild_id, {
        role_id,
        uid: user_id,
        is_add: add
      })
    }
  }
}
