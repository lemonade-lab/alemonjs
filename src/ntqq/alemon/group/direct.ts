import {
  ControllerOption,
  UserInformationType,
  getUrlbuffer
} from '../../../core/index.js'
import { ClientNTQQ } from '../../sdk/index.js'
import IMGS from 'image-size'
import { ClientKOA } from '../../../koa/index.js'
import { everyoneError } from '../../../log/index.js'

const Controller = {
  Member: () => {
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
  },
  Message: ({ open_id, msg_id }) => {
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
        if (typeof file == 'string') {
          return await ClientNTQQ.postRichMediaByGroup(open_id, {
            srv_send_msg: true,
            url: file,
            file_type: 3
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
        if (typeof file == 'string') {
          return await ClientNTQQ.postRichMediaByGroup(open_id, {
            srv_send_msg: true,
            url: file,
            file_type: 2
          })
        }
      },
      card: async (msg: any[]) => {
        const arr = []
        for (const item of msg) {
          arr.push(
            ClientNTQQ.usersOpenMessages(open_id, {
              msg_id,
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
}

/**
 * 客户端控制器
 * @param select
 * @returns
 */
export const ClientDirectController = (data: {
  open_id: string
  msg_id: string
}) => {
  return (select?: ControllerOption) => {
    const open_id = select?.open_id ?? data.open_id
    const msg_id = select?.msg_id ?? data.msg_id
    return Controller.Message({ open_id, msg_id })
  }
}

/**
 * 成员控制器
 * @param select
 * @returns
 */
export const ClientControllerOnMember = () => {
  return (select?: ControllerOption) => {
    return Controller.Member()
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
      return await ClientNTQQ.postRichMediaByUsers(open_id, {
        srv_send_msg: true,
        file_type: 1,
        url
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
    try {
      const dimensions = IMGS.imageSize(msg[isBuffer] as Buffer)
      const url = await ClientKOA.getFileUrl(msg[isBuffer] as Buffer)
      if (!url) return false
      return await ClientNTQQ.usersOpenMessages(open_id, {
        markdown: {
          content: `${cont}  ![text #${dimensions.width}px #${dimensions.height}px](${url})`
        },
        msg_id,
        msg_type: 2 //md
        // timestamp: Math.floor(Date.now() / 1000)
      }).catch(everyoneError)
    } catch (err) {
      console.error(err)
      return err
    }
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
    const msg = await getUrlbuffer(getUrl)
    if (Buffer.isBuffer(msg)) {
      const url = await ClientKOA.getFileUrl(msg)
      if (!url) return false
      return await ClientNTQQ.postRichMediaByUsers(open_id, {
        srv_send_msg: true,
        file_type: 1,
        url
      }).catch(everyoneError)
    }
  }

  return await ClientNTQQ.usersOpenMessages(open_id, {
    content,
    msg_id,
    msg_type: 0
  }).catch(everyoneError)
}
