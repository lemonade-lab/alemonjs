import {
  type ControllerOption,
  type UserInformationType,
  ABuffer,
  BaseConfig
} from '../../core/index.js'
import { ClientNTQQ } from '../sdk/index.js'
import { ClientKOA } from '../../koa/index.js'

export class Controllers extends BaseConfig<ControllerOption> {
  constructor(select?: ControllerOption) {
    super(select)
  }

  Member = {
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

  Message = {
    reply: async (
      content: Buffer | string | number | (Buffer | number | string)[]
    ) => {
      const open_id = this.get('open_id')
      const msg_id = this.get('msg_id')
      return await directController(content, open_id, msg_id)
    },
    quote: async (
      content: Buffer | string | number | (Buffer | number | string)[]
    ) => {
      const open_id = this.get('open_id')
      const msg_id = this.get('msg_id')
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
      const open_id = this.get('open_id')
      const msg_id = this.get('msg_id')
      if (typeof file == 'string') {
        const file_info = await ClientNTQQ.postRichMediaByGroup(open_id, {
          srv_send_msg: false,
          file_type: 3,
          url: file
        }).then(res => res.file_info)
        if (!file_info) return false
        await ClientNTQQ.usersOpenMessages(open_id, {
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
    /**
     * 视频
     * @param file
     * @param name
     */
    video: async (file: Buffer | string, name?: string) => {
      const open_id = this.get('open_id')
      const msg_id = this.get('msg_id')
      if (typeof file == 'string') {
        const file_info = await ClientNTQQ.postRichMediaByGroup(open_id, {
          srv_send_msg: false,
          file_type: 2,
          url: file
        }).then(res => res.file_info)
        if (!file_info) return false
        await ClientNTQQ.usersOpenMessages(open_id, {
          content: '',
          media: {
            file_info
          },
          msg_id,
          msg_type: 7,
          msg_seq: ClientNTQQ.getMsgSeq(msg_id)
        })
      }
      return
    },
    card: async (msg: any[]) => {
      const open_id = this.get('open_id')
      const msg_id = this.get('msg_id')
      const arr = []
      for (const item of msg) {
        arr.push(
          await ClientNTQQ.usersOpenMessages(open_id, {
            msg_id,
            msg_seq: ClientNTQQ.getMsgSeq(msg_id),
            ...item
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
      const url = await ClientKOA.getFileUrl(msg)
      if (!url) return false
      const file_info = await ClientNTQQ.postRichMediaByGroup(open_id, {
        srv_send_msg: false,
        file_type: 1,
        url: url
      }).then(res => res.file_info)
      if (!file_info) return false
      return await ClientNTQQ.usersOpenMessages(open_id, {
        content: '',
        media: {
          file_info
        },
        msg_id,
        msg_type: 7,
        msg_seq: ClientNTQQ.getMsgSeq(msg_id)
      })
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
    const url = await ClientKOA.getFileUrl(msg[isBuffer] as Buffer)
    if (!url) return false
    const file_info = await ClientNTQQ.postRichMediaByGroup(open_id, {
      srv_send_msg: false,
      file_type: 1,
      url: url
    }).then(res => res.file_info)
    if (!file_info) return false
    return await ClientNTQQ.usersOpenMessages(open_id, {
      content: cont,
      media: {
        file_info
      },
      msg_id,
      msg_type: 7,
      msg_seq: ClientNTQQ.getMsgSeq(msg_id)
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
   * https
   */
  const match = content.match(/<http>(.*?)<\/http>/)
  if (match) {
    const getUrl = match[1]
    const msg = await ABuffer.getUrl(getUrl)
    if (Buffer.isBuffer(msg)) {
      const url = await ClientKOA.getFileUrl(msg)
      if (!url) return false
      const file_info = await ClientNTQQ.postRichMediaByGroup(open_id, {
        srv_send_msg: false,
        file_type: 1,
        url: url
      }).then(res => res.file_info)
      if (!file_info) return false
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
  }

  return await ClientNTQQ.usersOpenMessages(open_id, {
    content,
    msg_id,
    msg_type: 0,
    msg_seq: ClientNTQQ.getMsgSeq(msg_id)
  })
}
