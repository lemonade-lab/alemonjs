import {
  type MessageContentType,
  type ControllerOption,
  type UserInformationType
} from '../../../core/index.js'
import { ABuffer, BaseConfig } from '../../../core/index.js'
import { ClientKOOK } from '../sdk/index.js'

/**
 * ******************
 * 子频道当 code 使用
 * ******************
 * 私聊会话 是子频道类型之一
 */
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
    reply: async (content: MessageContentType) => {
      const channel_id = this.get('channel_id')
      const open_id = this.get('open_id')
      return await directController(content, channel_id, open_id)
    },
    quote: async (content: MessageContentType) => {
      const channel_id = this.get('channel_id')
      const open_id = this.get('open_id')
      return await directController(content, channel_id, open_id)
    },
    /**
     * 更新信息
     * @param content
     * @returns
     */
    update: async (content: MessageContentType) => {
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

/**
 * 回复控制器
 * @param msg
 * @param channel_id
 * @param room_id
 * @returns
 */
export async function directController(
  msg: MessageContentType,
  channel_id: string,
  open_id: string
): Promise<{
  middle: any[]
  backhaul: any
}> {
  /**
   * isbuffer
   */
  if (Buffer.isBuffer(msg)) {
    const ret = await ClientKOOK.postImage(msg)
    if (ret && ret.data) {
      return {
        middle: [],
        backhaul: await ClientKOOK.createDirectMessage({
          type: 2,
          target_id: channel_id,
          chat_code: open_id,
          content: ret.data.url
        })
      }
    }
    return {
      middle: [],
      backhaul: false
    }
  }
  /**
   * string[] arr and find buffer
   */
  if (Array.isArray(msg) && msg.find(item => Buffer.isBuffer(item))) {
    // 找到其中一个buffer
    const isBuffer = msg.findIndex(item => Buffer.isBuffer(item))
    // 删除所有buffer
    const content = msg
      .map(item => {
        if (typeof item === 'number') return String(item)
        return item
      })
      .filter(element => typeof element === 'string')
      .join('')
    // 转存
    const ret = await ClientKOOK.postImage(msg[isBuffer] as Buffer)
    if (!ret) {
      return {
        middle: [],
        backhaul: false
      }
    }
    // 私聊
    await ClientKOOK.createDirectMessage({
      type: 9,
      target_id: channel_id,
      chat_code: open_id,
      content: content
    })
    return {
      middle: [],
      backhaul: await ClientKOOK.createDirectMessage({
        type: 2,
        target_id: channel_id,
        chat_code: open_id,
        content: String(ret.data.url)
      })
    }
  }
  const content = Array.isArray(msg)
    ? msg.join('')
    : typeof msg === 'string'
    ? msg
    : typeof msg === 'number'
    ? `${msg}`
    : ''

  if (content == '') {
    return {
      middle: [],
      backhaul: false
    }
  }

  const match = content.match(/<http>(.*?)<\/http>/)
  if (match) {
    const getUrl = match[1]
    const msg = await ABuffer.getUrl(getUrl)
    if (!msg) {
      return {
        middle: [],
        backhaul: false
      }
    }
    const ret = await ClientKOOK.postImage(msg)
    if (!ret) {
      return {
        middle: [],
        backhaul: false
      }
    }
    if (msg && ret) {
      return {
        middle: [],
        backhaul: await ClientKOOK.createDirectMessage({
          type: 2,
          target_id: channel_id,
          chat_code: open_id,
          content: ret.data.url
        })
      }
    }
  }
  return {
    middle: [],
    backhaul: await ClientKOOK.createDirectMessage({
      type: 9,
      target_id: channel_id,
      chat_code: open_id,
      content
    })
  }
}
