import {
  type ControllerOption,
  type UserInformationType,
  BUFFER
} from '../../core/index.js'
import { ClientNTQQ } from '../sdk/index.js'
import { ClientKOA } from '../../koa/index.js'
import { everyoneError } from '../../log/index.js'

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
        return await directController(content, open_id, msg_id).catch(
          everyoneError
        )
      },
      quote: async (
        content: Buffer | string | number | (Buffer | number | string)[]
      ) => {
        return await directController(content, open_id, msg_id).catch(
          everyoneError
        )
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
        if (typeof file == 'string') {
          await ClientNTQQ.usersOpenMessages(open_id, {
            content: '',
            media: {
              file_info: await ClientNTQQ.postRichMediaByGroup(open_id, {
                srv_send_msg: false,
                file_type: 3,
                url: file
              })
                .then(res => res.file_info)
                .catch(everyoneError)
            },
            msg_id,
            msg_type: 7,
            msg_seq: ClientNTQQ.getMsgSeq(msg_id)
          }).catch(everyoneError)
        }
        return false
      },
      /**
       * 视频
       * @param file
       * @param name
       */
      video: async (file: Buffer | string, name?: string) => {
        if (typeof file == 'string') {
          await ClientNTQQ.usersOpenMessages(open_id, {
            content: '',
            media: {
              file_info: await ClientNTQQ.postRichMediaByGroup(open_id, {
                srv_send_msg: false,
                file_type: 2,
                url: file
              })
                .then(res => res.file_info)
                .catch(everyoneError)
            },
            msg_id,
            msg_type: 7,
            msg_seq: ClientNTQQ.getMsgSeq(msg_id)
          }).catch(everyoneError)
        }
        return
      },
      card: async (msg: any[]) => {
        const arr = []
        for (const item of msg) {
          arr.push(
            await ClientNTQQ.usersOpenMessages(open_id, {
              msg_id,
              msg_seq: ClientNTQQ.getMsgSeq(msg_id),
              ...item
            }).catch(everyoneError)
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
  msg_id: string
) {
  // isBuffer
  if (Buffer.isBuffer(msg)) {
    try {
      const url = await ClientKOA.getFileUrl(msg).catch(everyoneError)
      if (!url) return false
      return await ClientNTQQ.usersOpenMessages(open_id, {
        content: '',
        media: {
          file_info: await ClientNTQQ.postRichMediaByGroup(open_id, {
            srv_send_msg: false,
            file_type: 1,
            url: url
          })
            .then(res => res.file_info)
            .catch(everyoneError)
        },
        msg_id,
        msg_type: 7,
        msg_seq: ClientNTQQ.getMsgSeq(msg_id)
      }).catch(everyoneError)
    } catch (err) {
      console.error(err)
      return err
    }
  }
  /**
   * isString arr and find buffer
   */
  if (Array.isArray(msg) && msg.find(item => Buffer.isBuffer(item))) {
    const isBuffer = msg.findIndex(item => Buffer.isBuffer(item))
    const cont = msg
      .map(item => {
        if (typeof item === 'number') return String(item)
        return item
      })
      .filter(element => typeof element === 'string')
      .join('')
    const url = await ClientKOA.getFileUrl(msg[isBuffer] as Buffer).catch(
      everyoneError
    )
    if (!url) return false
    return await ClientNTQQ.usersOpenMessages(open_id, {
      content: cont,
      media: {
        file_info: await ClientNTQQ.postRichMediaByGroup(open_id, {
          srv_send_msg: false,
          file_type: 1,
          url: url
        })
          .then(res => res.file_info)
          .catch(everyoneError)
      },
      msg_id,
      msg_type: 7,
      msg_seq: ClientNTQQ.getMsgSeq(msg_id)
    }).catch(everyoneError)
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
   * https
   */
  const match = content.match(/<http>(.*?)<\/http>/)
  if (match) {
    const getUrl = match[1]
    const msg = await BUFFER.getUrl(getUrl).catch(everyoneError)
    if (Buffer.isBuffer(msg)) {
      const url = await ClientKOA.getFileUrl(msg).catch(everyoneError)
      if (!url) return false
      return await ClientNTQQ.usersOpenMessages(open_id, {
        content: '',
        media: {
          file_info: await ClientNTQQ.postRichMediaByGroup(open_id, {
            srv_send_msg: false,
            file_type: 1,
            url: url
          })
            .then(res => res.file_info)
            .catch(everyoneError)
        },
        msg_id,
        msg_type: 7,
        msg_seq: ClientNTQQ.getMsgSeq(msg_id)
      }).catch(everyoneError)
    }
  }

  return await ClientNTQQ.usersOpenMessages(open_id, {
    content,
    msg_id,
    msg_type: 0,
    msg_seq: ClientNTQQ.getMsgSeq(msg_id)
  }).catch(everyoneError)
}
