import { ABuffer } from '../../core/index.js'
import { ClientQQ } from '../sdk/index.js'

import { ControllerOption, type UserInformationType } from '../../core/index.js'

export class Controllers {
  select: ControllerOption
  constructor(select?: ControllerOption) {
    this.select = select
  }

  Member(select?: ControllerOption) {
    return {
      /**
       * 查看信息
       * @returns
       */
      information: async (): Promise<UserInformationType | false> => {
        return false
      },
      /**
       * 禁言
       */
      mute: async (option?: { time?: number; cancel?: boolean }) => {
        return false
      },
      /**
       * 踢出
       */
      remove: async () => {
        return false
      },
      /**
       * 身分组
       * @param role_id 身分组编号
       * @param is_add 默认添加行为
       * @returns
       */
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
        return await directController(content, open_id, msg_id)
      },
      quote: async (
        content: Buffer | string | number | (Buffer | number | string)[]
      ) => {
        return await directController(content, open_id, msg_id)
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
      withdraw: async (hideTip = true) => {
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
      emoji: async (msg: any[], cancel?: boolean) => {
        // 不同的场景下 api不同  私聊是不具有这么多功能的
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
      card: async (msg: any[]) => {
        // 卡片消息
        return []
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

/**
 * 回复控制器
 * @param msg
 * @param villa_id
 * @param room_id
 * @returns
 */
export async function directController(
  msg: Buffer | string | number | (Buffer | number | string)[],
  open_id: string,
  msg_id: string,
  select?: {
    withdraw?: number
    open_id?: string
    user_id?: string
  }
) {
  if (select?.open_id && select?.user_id) {
    const {
      data: { guild_id }
    }: any = {}
    if (!guild_id) return false
    open_id = guild_id
  }
  // isBuffer
  // if withdraw == 0 ， false 不撤回
  if (Buffer.isBuffer(msg)) {
    return await ClientQQ.postDirectImage(open_id, {
      msg_id: msg_id, //消息id, 必须
      image: msg //buffer
    })
  }
  // arr && find buffer
  if (Array.isArray(msg) && msg.find(item => Buffer.isBuffer(item))) {
    const isBuffer = msg.findIndex(item => Buffer.isBuffer(item))
    const cont = msg
      .map(item => {
        if (typeof item === 'number') return String(item)
        return item
      })
      .filter(element => typeof element === 'string')
      .join('')
    return await ClientQQ.postDirectImage(open_id, {
      msg_id: msg_id, //消息id, 必须
      image: msg[isBuffer] as Buffer, //buffer
      content: cont
    })
  }
  const content = Array.isArray(msg)
    ? msg.join('')
    : typeof msg === 'string'
    ? msg
    : typeof msg === 'number'
    ? `${msg}`
    : ''
  if (content == '') return false
  /**
   * http
   */
  const match = content.match(/<http>(.*?)<\/http>/)
  if (match) {
    const getUrl = match[1]
    const msg = await ABuffer.getUrl(getUrl)
    if (msg) {
      return await ClientQQ.postImage(open_id, {
        msg_id: msg_id, //消息id, 必须
        image: msg //buffer
      })
    }
  }

  return ClientQQ.dmsMessage(open_id, {
    content,
    msg_id
  })
}
