import { replyController } from './reply.js'
import { ControllerOption, type UserInformationType } from '../../core/index.js'
import { BOTCONFIG } from '../../config/index.js'
import { directController } from './direct.js'
import { everyoneError } from '../../log/index.js'
import { ClientQQ } from '../sdk/index.js'

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
      /**
       * 查看信息
       * @returns
       */
      information: async (): Promise<UserInformationType | false> => {
        const data: any = {}
        if (data) {
          const cfg = BOTCONFIG.get('qq')
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
        if (option.cancel) {
          //
        } else {
          //
        }
      },
      /**
       * 踢出
       */
      remove: async () => {
        //
      },
      /**
       * 身分组
       * @param role_id 身分组编号
       * @param is_add 默认添加行为
       * @returns
       */
      operate: async (role_id: string, add = true) => {
        if (add) {
          //
        } else {
          //
        }
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
        if (open_id && open_id != '' && user_id) {
          return await directController(content, open_id, msg_id, {
            open_id: open_id,
            user_id: user_id
          }).catch(everyoneError)
        }
        return await replyController(content, channel_id, msg_id).catch(
          everyoneError
        )
      },
      quote: async (
        content: Buffer | string | number | (Buffer | number | string)[]
      ) => {
        return await replyController(content, channel_id, msg_id, {
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
      withdraw: async (hideTip = true) => {},
      pinning: async (cancel?: boolean) => {
        if (cancel) {
          //
        }
      },
      forward: async () => {
        return false
      },
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
        for (const item of msg) {
          arr.push()
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
        //
      },
      article: async (msg: any) => {
        return false
      }
    }
  }
}
