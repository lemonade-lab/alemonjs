import FormData from 'form-data'
import axios, { type AxiosRequestConfig } from 'axios'
import { config } from './config.js'
import { createPicFrom } from '../../core/index.js'
import { ApiLog } from './log.js'
/**
 * api接口
 */
class ClientQq {
  /**
   * 基础请求
   * @param opstion
   * @returns
   */
  async request(opstion: AxiosRequestConfig) {
    const appID = config.get('appID')
    const token = config.get('token')
    const sandbox = config.get('sandbox')
    const service = await axios.create({
      baseURL: sandbox
        ? 'https://sandbox.api.sgroup.qq.com'
        : 'https://api.sgroup.qq.com',
      timeout: 20000,
      headers: {
        Authorization: `Bot ${appID}.${token}`
      }
    })
    return service(opstion)
  }

  /**
   * 创建form
   * @param image
   * @param msg_id
   * @param content
   * @param name
   * @returns
   */
  async createFrom(
    image: Buffer,
    msg_id: string,
    content: any,
    Name = 'image.jpg'
  ) {
    const from = await createPicFrom(image, Name)
    if (!from) return false
    const { picData, name } = from
    const formdata = new FormData()
    formdata.append('msg_id', msg_id)
    if (typeof content === 'string') formdata.append('content', content)
    formdata.append('file_image', picData, name)
    return formdata
  }

  /**
   * ************
   * 消息-图片接口
   * ***********
   */

  /**
   * 发送buffer图片
   * @param id 私信传频道id,公信传子频道id
   * @param message {消息编号,图片,内容}
   * @param isGroup 是否是群聊
   * @returns
   */
  async postImage(message: {
    id: string
    msg_id: string
    image: Buffer
    content?: string
    name?: string
  }): Promise<any> {
    const formdata = await this.createFrom(
      message.image,
      message.msg_id,
      message.content,
      message.name
    )
    const dary = formdata != false ? formdata.getBoundary() : ''
    return this.request({
      method: 'post',
      url: `/channels/${message.id}/messages`,
      headers: {
        'Content-Type': `multipart/form-data; boundary=${dary}`
      },
      data: formdata
    })
      .then(ApiLog)
      .catch(err => {
        console.error(err)
      })
  }

  /**
   * 私聊发送buffer图片
   * @param id 私信传频道id,公信传子频道id
   * @param message {消息编号,图片,内容}
   * @returns
   */
  async postDirectImage(message: {
    id: string
    msg_id: string
    image: Buffer
    content?: string
    name?: string
  }): Promise<any> {
    const formdata = await this.createFrom(
      message.image,
      message.msg_id,
      message.content,
      message.name
    )
    const dary = formdata != false ? formdata.getBoundary() : ''
    return this.request({
      method: 'post',
      url: `/dms/${message.id}/messages`,
      headers: {
        'Content-Type': `multipart/form-data; boundary=${dary}`
      },
      data: formdata
    })
      .then(ApiLog)
      .catch(err => {
        console.error(err)
      })
  }

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
  async usersMe() {
    return this.request({
      method: 'get',
      url: `/users/@me`
    })
      .then(ApiLog)
      .catch(err => {
        console.error(err)
      })
  }

  /**
   * 获取用户频道列表
   * @param message
   * @returns
   */
  async usersMeGuilds(params: {
    before: string
    after: string
    limit: number
  }) {
    return this.request({
      method: 'get',
      url: `/users/@me/guilds`,
      params
    })
      .then(ApiLog)
      .catch(err => {
        console.error(err)
      })
  }

  /**
   * **********
   * 频道api
   * **********
   */

  /**
   * 获取频道详细
   * @param guild_id
   * @returns
   */
  async guilds(guild_id: string) {
    return this.request({
      method: 'get',
      url: `/guilds/${guild_id}`
    })
      .then(ApiLog)
      .catch(err => {
        console.error(err)
      })
  }

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
   * 获得频道可用权限列表
   * @param guild_id
   * @returns
   */
  async guildApiPermission(guild_id: string) {
    return this.request({
      url: `/guilds/${guild_id}/api_permission`
    })
      .then(ApiLog)
      .catch(err => {
        console.error(err)
      })
  }

  /**
   * ********
   * 通讯api
   * *********
   */
  async geteway() {
    return this.request({
      url: '/gateway'
    })
      .then(ApiLog)
      .catch(err => {
        console.error(err)
      })
  }
}
/**
 * QQ接口
 */
export const ClientQQ = new ClientQq()
