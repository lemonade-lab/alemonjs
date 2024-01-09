import { ClientVILLA } from '../sdk/index.js'
import { replyController } from './reply.js'
import { ControllerOption, UserInformationType } from '../../core/index.js'
import { BOTCONFIG } from '../../config/index.js'
import { everyoneError } from '../../log/index.js'
/**
 * 控制器
 */
export class Controllers {
  #data: ControllerOption
  constructor(select?: ControllerOption) {
    this.#data = select
  }
  /**
   * 消息控制器
   * @param param0
   * @returns
   */
  Message(select?: ControllerOption) {
    const guild_id = select.guild_id ?? this.#data?.guild_id
    const open_id = select.open_id ?? this.#data?.open_id
    const channel_id = select.channel_id ?? this.#data?.channel_id
    const msg_id = select.msg_id ?? this.#data?.msg_id
    return {
      /**
       * 回复
       * @param content
       * @returns
       */
      reply: async (
        content: Buffer | string | number | (Buffer | number | string)[]
      ) => {
        // villa未有回复api
        if (open_id) {
          console.error('VILLA 无私信')
          return false
        }
        return await replyController(guild_id, channel_id, content).catch(
          everyoneError
        )
      },
      /**
       * 引用
       * @param content
       * @returns
       */
      quote: async (
        content: Buffer | string | number | (Buffer | number | string)[]
      ) => {
        if (open_id) {
          console.error('VILLA 无私信')
          return false
        }
        return await replyController(guild_id, channel_id, content, {
          quote: msg_id
        }).catch(everyoneError)
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
        return await ClientVILLA.recallMessage(guild_id, {
          room_id: channel_id,
          msg_uid: msg_id
        }).catch(everyoneError)
      },
      /**
       *  钉选
       * @param cancel
       * @returns
       */
      pinning: async (cancel = false) => {
        return await ClientVILLA.pinMessage(guild_id, {
          room_id: channel_id,
          is_cancel: cancel,
          msg_uid: msg_id
        }).catch(everyoneError)
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
        const arr: any[] = []
        for (const item of msg) {
          arr.push(
            await ClientVILLA.sendCard(guild_id, channel_id, item).catch(
              everyoneError
            )
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

  /**
   * 成员控制器
   * @param param0
   * @returns
   */
  Member(select?: ControllerOption) {
    const guild_id = select?.guild_id ?? this.#data?.guild_id
    const user_id = select.user_id ?? this.#data.user_id
    return {
      /**
       * 查看信息
       * @returns
       */
      information: async (): Promise<UserInformationType | false> => {
        // 对进行进行过滤,并以固定格式返回
        const data = await ClientVILLA.getMember(guild_id, user_id)
          .then(res => res.data)
          .catch(everyoneError)
        if (!data) return false
        const cfg = BOTCONFIG.get('villa')
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
        return await ClientVILLA.deleteVillaMember(guild_id, user_id).catch(
          everyoneError
        )
      },
      /**
       * 身分组
       * @param role_id 身分组编号
       * @param is_add 默认添加行为
       * @returns
       */
      operate: async (role_id: string, add = true) => {
        return await ClientVILLA.operateMemberToRole(guild_id, {
          role_id,
          uid: user_id,
          is_add: add
        }).catch(everyoneError)
      }
    }
  }
}
