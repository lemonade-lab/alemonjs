import { config } from './config.js'
import axios, { type AxiosRequestConfig } from 'axios'
import { FileType, MsgType } from './typings.js'
import { ApiLog } from './log.js'

class ClientNtqq {
  API_BOTS = 'https://bots.qq.com'
  API_SGROUP = 'https://api.sgroup.qq.com'
  API_SGROUP_SANDBOX = 'https://sandbox.api.sgroup.qq.com'

  /**
   * 得到鉴权
   * @param appId
   * @param clientSecret
   * @param url
   * @returns
   */
  getAuthentication(appId: string, clientSecret: string) {
    return axios.post(`${this.API_BOTS}/app/getAppAccessToken`, {
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
      baseURL: this.API_SGROUP,
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
      .then(data => {
        const { url } = data
        if (url) {
          return url
        } else {
          console.error('[getway] http err:', null)
        }
      })
      .catch(error => {
        console.error('[getway] token err:', error.message)
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
      keyboard?: any
      media?: any
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
    }).then(ApiLog)
  }

  // /\[🔗[^\]]+\]\([^)]+\)|@everyone/.test(content)

  // map会越来越大,应该自动delte第一个key
  private map = {}

  /**
   * 得到消息计数器
   * @param MsgId
   * @returns
   */
  getMsgSeq(MsgId: string) {
    if (Object.prototype.hasOwnProperty.call(this.map, MsgId)) {
      this.map[MsgId] = this.map[MsgId] + 1
    } else {
      this.map[MsgId] = 1
    }
    const arr = Object.keys(this.map)
    if (arr.length > 15) {
      const firstKey = arr[0]
      delete this.map[firstKey]
    }
    return this.map[MsgId]
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
      keyboard?: any
      media?: any
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
    }).then(ApiLog)
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
    }).then(ApiLog)
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
    }).then(ApiLog)
  }
}

export const ClientNTQQ = new ClientNtqq()
