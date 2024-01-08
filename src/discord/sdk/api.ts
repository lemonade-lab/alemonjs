import FormData from 'form-data'
import { createPicFrom } from '../../core/index.js'
import axios, { type AxiosRequestConfig } from 'axios'
import { config } from './config.js'
import { ApiLog } from './log.js'

/**
 * api接口
 */
class ClientDc {
  /**
   * 基础请求
   * @param opstion
   * @returns
   */
  request(options: AxiosRequestConfig) {
    const token = config.get('token')
    const service = axios.create({
      baseURL: 'https://discord.com/api/v10',
      timeout: 6000,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bot ${token}`
      }
    })
    return service(options)
  }

  /**
   * cdn基础请求
   * @param options
   * @returns
   */
  requestCDN(options: AxiosRequestConfig) {
    const token = config.get('token')
    const BaseUrl = config.get('BaseUrl')
    const service = axios.create({
      baseURL: BaseUrl,
      timeout: 6000,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bot ${token}`
      }
    })
    return service(options)
  }

  /**
   * 创建用户url地址
   * @param user_id
   * @param avatar_hash
   * @returns
   */
  userAvatar(user_id: string, avatar_hash: string) {
    const BaseUrl = config.get('BaseUrl')
    return `${BaseUrl}/avatars/${user_id}/${avatar_hash}.png`
  }

  /**
   *
   * @param user_id
   * @param avatar_hash
   * @returns
   */
  async getUserUrl(user_id: string, avatar_hash: string) {
    const url = `/avatars/${user_id}/${avatar_hash}.png`
    return this.requestCDN({
      url: url,
      method: 'get'
    }).then(ApiLog)
  }

  /**
   * 得到应用详细信息
   * @returns
   */
  async applicationsMe() {
    return this.request({
      method: 'get',
      url: '/applications/@me'
    }).then(ApiLog)
  }

  /**
   *
   * @param user_id
   * @param avatar_hash
   * @returns
   */
  async channelsMessages(
    channel_id: string,
    data: {
      content?: string
      tts?: boolean
      embeds?: {
        title?: string
        description?: string
      }[]
      files?: any[]
    },
    headers?: AxiosRequestConfig['headers']
  ) {
    return this.request({
      url: `channels/${channel_id}/messages`,
      method: 'post',
      headers: headers,
      data
    }).then(ApiLog)
  }

  /**
   *
   * @param channel_id
   * @param img
   * @returns
   */
  async channelsMessagesImage(channel_id: string, img: any, content?: string) {
    const from = await createPicFrom(img)
    if (!from) return
    const { picData, name } = from
    const formData = new FormData()
    if (content) {
      formData.append('content', content)
    }
    formData.append('file', picData, name)
    return this.request({
      method: 'post',
      url: `channels/${channel_id}/messages`,
      data: formData,
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    })
  }

  /**
   * ************
   * 消息-图片接口
   * ***********
   */

  /**
   * ********
   * 用户api
   * *******
   */

  /**
   * 获取用户详情
   * @param message
   * @returns
   */

  /**
   * 获取用户频道列表
   * @param message
   * @returns
   */

  /**
   * **********
   * 频道api
   * **********
   */

  /**
   * ************
   * 子频道api
   * ***********
   */

  /**
   * *********
   * 成员api
   * *********
   */

  /**
   * ***********
   * 频道身份api
   * ***********
   */

  /**
   * **********
   * 子频道权限api
   * **********
   */

  /**
   * *******
   * 消息api
   * ********
   */

  /**
   * ************
   * 消息频率api
   * **********
   */

  /**
   * ***********
   * 私信api
   * **********
   */

  /**
   * *********
   * 禁言api
   * *******
   */

  /**
   * *******
   * 公告api
   * *******
   */

  /**
   * **********
   * 精华消息api
   * **********
   */

  /**
   * ********
   * 日程api
   * *******
   */

  /**
   * ***********
   * 表情表态api
   * ***********
   */

  /**
   * ***********
   * 音频api
   * **********
   */

  /**
   * **********
   * 帖子api
   * **********
   */

  /**
   * ********
   * 接口权限api
   * **********
   */

  /**
   * ********
   * 通讯api
   * *********
   */

  async gateway(): Promise<{
    url: string
  }> {
    return this.request({
      method: 'get',
      url: '/gateway'
    }).then(ApiLog)
  }
}

/**
 * 接口
 */
export const ClientDISOCRD = new ClientDc()
