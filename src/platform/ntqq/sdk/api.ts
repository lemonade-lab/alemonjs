import { config } from './config.js'
import axios, { type AxiosRequestConfig } from 'axios'
import { FileType, MsgType } from './typings.js'
import { ApiLog } from './log.js'

interface ButtonType {
  // 编号
  id: string
  render_data: {
    // 标头
    label: string
    // 点击后的标头
    visited_label: string
    // 0 灰色
    // 1 蓝色
    // 风格
    style: number
  }
  action: {
    // 0 跳转按钮：http 或 小程序 客户端识别 scheme
    // 1 回调按钮：回调后台接口, data 传给后台
    // 2 指令按钮：自动在输入框插入 @bot data
    type: number
    permission: {
      // 0 指定用户可操作
      // 1 仅管理者可操作
      // 2 所有人可操作
      // 3 指定身份组可操作（仅频道可用）
      type: number
    }
    // 默认 false
    reply?: boolean
    // 自动发送
    enter?: boolean
    // 兼容性提示文本
    unsupport_tips: string
    // 内容
    data: string
  }
}

interface KeyboardType {
  content: {
    rows: { buttons: ButtonType[] }[]
  }
}

class ClientNtqq {
  /**
   * qq机器人
   */
  BOTS_API_RUL = 'https://bots.qq.com'

  /**
   * qq群
   */
  API_URL_SANDBOX = 'https://sandbox.api.sgroup.qq.com'
  API_URL = 'https://api.sgroup.qq.com'

  /**
   * 得到鉴权
   * @param appId
   * @param clientSecret
   * @param url
   * @returns
   */
  getAuthentication(appId: string, clientSecret: string) {
    return axios.post(`${this.BOTS_API_RUL}/app/getAppAccessToken`, {
      appId: appId,
      clientSecret: clientSecret
    })
  }

  /**
   * 创建axios实例
   * @param config
   * @returns
   */
  async GroupService(options: AxiosRequestConfig) {
    const appID = config.get('appID')
    const token = config.get('token')
    const service = await axios.create({
      baseURL: this.API_URL,
      timeout: 20000,
      headers: {
        'X-Union-Appid': appID,
        'Authorization': `QQBot ${token}`
      }
    })
    return service(options)
  }

  /**
   * 得到鉴权
   * @returns
   */
  async gateway() {
    return this.GroupService({
      url: '/gateway'
    })
      .then(ApiLog)
      .catch(error => {
        console.error('[getway] token ', error.message)
      })
  }

  /**
   * 发送私聊消息
   * @param openid
   * @param content
   * @param msg_id
   * @returns
   *   0 文本  1 图文 2 md 3 ark 4 embed
   */
  async usersOpenMessages(
    openid: string,
    data: {
      content?: string
      msg_type: MsgType
      markdown?: any
      keyboard?: KeyboardType
      media?: {
        file_info: string
      }
      ark?: any
      image?: any
      message_reference?: any
      event_id?: any
      msg_id?: string
      msg_seq?: number
    },
    msg_id?: string
  ): Promise<{ id: string; timestamp: number }> {
    return this.GroupService({
      url: `/v2/users/${openid}/messages`,
      method: 'post',
      data: data
    })
      .then(ApiLog)
      .catch(err => {
        console.error(err)
      })
  }

  // /\[🔗[^\]]+\]\([^)]+\)|@everyone/.test(content)

  #map: Map<string, number> = new Map()
  getMsgSeq(MsgId: string): number {
    let seq = this.#map.get(MsgId) || 0
    seq++
    this.#map.set(MsgId, seq)
    // 如果映射表大小超过 100，则删除最早添加的 MsgId
    if (this.#map.size > 100) {
      const firstKey = this.#map.keys().next().value
      this.#map.delete(firstKey)
    }
    return seq
  }

  /**
   * 发送群聊消息
   * @param group_openid
   * @param content
   * @param msg_id
   * @returns
   */
  async groupOpenMessages(
    group_openid: string,
    data: {
      content?: string
      msg_type: MsgType
      markdown?: any
      keyboard?: KeyboardType
      media?: {
        file_info: string
      }
      ark?: any
      image?: any
      message_reference?: any
      event_id?: any
      msg_id?: string
      msg_seq?: number
    }
  ): Promise<{ id: string; timestamp: number }> {
    return this.GroupService({
      url: `/v2/groups/${group_openid}/messages`,
      method: 'post',
      data: data
    })
      .then(ApiLog)
      .catch(err => {
        console.error(err)
      })
  }

  // markdown = {content}
  //

  /**
   * 发送私聊富媒体文件
   * @param openid
   * @param content
   * @param file_type
   * @returns
   *  1 图文 2 视频 3 语言 4 文件
   * 图片：png/jpg，视频：mp4，语音：silk
   */
  async postRichMediaByUsers(
    openid: string,
    data: {
      srv_send_msg: boolean
      file_type: FileType
      url: string
      file_data?: any
    }
  ): Promise<{ file_uuid: string; file_info: string; ttl: number }> {
    return this.GroupService({
      url: `/v2/users/${openid}/files`,
      method: 'post',
      data: data
    })
      .then(ApiLog)
      .catch(err => {
        console.error(err)
      })
  }

  /**
   * 发送群里文件
   * @param openid
   * @param content
   * @param file_type
   * @returns
   *  1 图文 2 视频 3 语言 4 文件
   * 图片：png/jpg，视频：mp4，语音：silk
   */
  async postRichMediaByGroup(
    openid: string,
    data: {
      srv_send_msg: boolean
      file_type: FileType
      url: string
      file_data?: any
    }
  ): Promise<{ file_uuid: string; file_info: string; ttl: number }> {
    return this.GroupService({
      url: `/v2/groups/${openid}/files`,
      method: 'post',
      data: data
    })
      .then(ApiLog)
      .catch(err => {
        console.error(err)
      })
  }
}

export const ClientNTQQ = new ClientNtqq()
