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
  async postImage(
    channel_id: string,
    message: {
      msg_id: string
      image: Buffer
      content?: string
      name?: string
    }
  ): Promise<any> {
    const formdata = await this.createFrom(
      message.image,
      message.msg_id,
      message.content,
      message.name
    )
    const dary = formdata != false ? formdata.getBoundary() : ''
    return this.request({
      method: 'post',
      url: `/channels/${channel_id}/messages`,
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
  async postDirectImage(
    guild_id: string,
    message: {
      msg_id: string
      image: Buffer
      content?: string
      name?: string
    }
  ): Promise<any> {
    const formdata = await this.createFrom(
      message.image,
      message.msg_id,
      message.content,
      message.name
    )
    const dary = formdata != false ? formdata.getBoundary() : ''
    return this.request({
      method: 'post',
      url: `/dms/${guild_id}/messages`,
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
   * 获取子频道列表
   * @param guild_id
   * @returns
   */
  async guildsChannels(guild_id: string) {
    return this.request({
      method: 'get',
      url: `/guilds/${guild_id}/channels`
    })
      .then(ApiLog)
      .catch(err => {
        console.error(err)
      })
  }

  /**
   * 获取子频道详情
   * @param channel_id
   * @returns
   */
  async channels(channel_id: string) {
    return this.request({
      method: 'get',
      url: `/channels/${channel_id}`
    })
      .then(ApiLog)
      .catch(err => {
        console.error(err)
      })
  }

  /**
   * 创建子频道
   * @param guild_id
   * @returns
   */
  async guildsChannelsCreate(
    guild_id: string,
    data: {
      name: string
      type: number
      sub_type: number
      position: number
      parent_id: string
      private_type: number
      private_user_ids: string[]
      speak_permission: number
      application_id: string
    }
  ) {
    return this.request({
      method: 'post',
      url: `/guilds/${guild_id}/channels`,
      data
    })
      .then(ApiLog)
      .catch(err => {
        console.error(err)
      })
  }

  /**
   * 创建子频道
   * @param channel_id
   * @returns
   */
  async guildsChannelsUpdate(
    channel_id: string,
    data: {
      name: string
      position: number
      parent_id: string
      private_type: number
      speak_permission: number
    }
  ) {
    return this.request({
      method: 'PATCH',
      url: `/channels/${channel_id}`,
      data
    })
      .then(ApiLog)
      .catch(err => {
        console.error(err)
      })
  }

  /**
   * 删除子频道
   * @param channel_id
   * @param data
   * @returns
   */
  async guildsChannelsdelete(
    channel_id: string,
    data: {
      name: string
      position: number
      parent_id: string
      private_type: number
      speak_permission: number
    }
  ) {
    return this.request({
      method: 'DELETE',
      url: `/channels/${channel_id}`,
      data
    })
      .then(ApiLog)
      .catch(err => {
        console.error(err)
      })
  }

  /**
   * 获取在线成员数
   * @param channel_id
   * @returns
   */
  async channelsChannelOnlineNums(channel_id: string) {
    return this.request({
      method: 'GET',
      url: `/channels/${channel_id}/online_nums`
    })
      .then(ApiLog)
      .catch(err => {
        console.error(err)
      })
  }

  /**
   * *********
   * 成员api
   * *********
   */

  /**
   * 获取频道成员列表
   * @param guild_id
   * @returns
   */
  async guildsMembers(
    guild_id: string,
    params: {
      after: string
      limit: number
    }
  ) {
    return this.request({
      method: 'GET',
      url: `/guilds/${guild_id}/members`,
      params
    })
      .then(ApiLog)
      .catch(err => {
        console.error(err)
      })
  }

  /**
   * 获取频道身份组成员列表
   * @param guild_id
   * @param role_id
   * @param params
   * @returns
   */
  async guildsRolesMembers(
    guild_id: string,
    role_id: string,
    params: {
      start_index: string
      limit: number
    }
  ) {
    return this.request({
      method: 'GET',
      url: `/guilds/${guild_id}/roles/${role_id}/members`,
      params
    })
      .then(ApiLog)
      .catch(err => {
        console.error(err)
      })
  }

  /**
   * 获取成员详情
   * @param guild_id
   * @param user_id
   * @returns
   */
  async guildsMembersMessage(guild_id: string, user_id: string) {
    return this.request({
      method: 'GET',
      url: `/guilds/${guild_id}/members/${user_id}`
    })
      .then(ApiLog)
      .catch(err => {
        console.error(err)
      })
  }

  /**
   * 删除频道成员
   * @param guild_id
   * @param user_id
   * @returns
   */
  async guildsMembersDelete(guild_id: string, user_id: string) {
    return this.request({
      method: 'DELETE',
      url: `/guilds/${guild_id}/members/${user_id}`
    })
      .then(ApiLog)
      .catch(err => {
        console.error(err)
      })
  }

  /**
   * ***********
   * 频道身份api
   * ***********
   */

  /**
   * 获取指定消息
   * @param channel_id
   * @param message_id
   * @returns
   */
  async channelsMessages(channel_id: string, message_id: string) {
    return this.request({
      method: 'GET',
      url: `/channels/${channel_id}/messages/${message_id}`
    })
      .then(ApiLog)
      .catch(err => {
        console.error(err)
      })
  }

  /**
   * 发送消息
   * @param channel_id
   * @param message_id
   * @param data
   * @returns
   */
  async channelsMessagesPost(
    channel_id: string,
    data: {
      content?: string
      embed?: any
      ark?: any
      message_reference?: any
      image?: string
      msg_id?: string
      event_id?: string
      markdown?: any
    }
  ) {
    return this.request({
      method: 'POST',
      url: `/channels/${channel_id}/messages`,
      data
    })
      .then(ApiLog)
      .catch(err => {
        console.error(err)
      })
  }

  /**
   * 撤回消息
   * @param channel_id
   * @param message_id
   * @param hidetip
   * @returns
   */
  async channelsMessagesDelete(
    channel_id: string,
    message_id: string,
    hidetip: boolean
  ) {
    return this.request({
      method: 'DELETE',
      url: `/channels/${channel_id}/messages/${message_id}?hidetip=${hidetip}`
    })
      .then(ApiLog)
      .catch(err => {
        console.error(err)
      })
  }

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
