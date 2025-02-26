import axios, { type AxiosRequestConfig } from 'axios'
import { ApiRequestData, FileType } from './typing.js'
import { config } from './config.js'
import FormData from 'form-data'
import { createPicFrom } from './from'

export class QQBotAPI {
  /**
   * qq机器人
   */
  BOTS_API_RUL = 'https://bots.qq.com'

  /**
   * qq群 沙河接口
   */
  API_URL_SANDBOX = 'https://sandbox.api.sgroup.qq.com'

  /**
   * qq群
   */
  API_URL = 'https://api.sgroup.qq.com'

  /**
   * 得到鉴权
   * @param appId
   * @param clientSecret
   * @param url
   * @returns
   */
  getAuthentication(app_id: string, clientSecret: string) {
    return axios.post(`${this.BOTS_API_RUL}/app/getAppAccessToken`, {
      appId: app_id,
      clientSecret: clientSecret
    })
  }

  /**
   * group
   * @param config
   * @returns
   */
  async groupService(options: AxiosRequestConfig) {
    const app_id = config.get('app_id')
    // 群聊是加密token
    const token = config.get('access_token')
    const service = await axios.create({
      baseURL: this.API_URL,
      timeout: 20000,
      headers: {
        'X-Union-Appid': app_id,
        'Authorization': `QQBot ${token}`
      }
    })
    return service(options)
  }

  /**
   * guild
   * @param opstion
   * @returns
   */
  async guildServer(opstion: AxiosRequestConfig) {
    const app_id = config.get('app_id')
    const token = config.get('token')
    const sandbox = config.get('sandbox')
    const service = await axios.create({
      baseURL: sandbox ? this.API_URL_SANDBOX : this.API_URL,
      timeout: 20000,
      headers: {
        Authorization: `Bot ${app_id}.${token}`
      }
    })
    return service(opstion)
  }

  /**
   * 得到鉴权
   * @returns
   */
  async gateway() {
    let service = ''
    switch (config.get('mode')) {
      case 'group':
        service = 'groupService'
        break
      case 'guild':
        service = 'guildServer'
        break
      default:
        service = 'groupService'
    }
    return this[service]({
      url: '/gateway'
    }).then(res => res?.data)
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
    data: ApiRequestData,
    _msg_id?: string
  ): Promise<{ id: string; timestamp: number }> {
    return this.groupService({
      url: `/v2/users/${openid}/messages`,
      method: 'post',
      data: data
    }).then(res => res?.data)
  }

  // /\[🔗[^\]]+\]\([^)]+\)|@everyone/.test(content)

  #map: Map<string, number> = new Map()

  /**
   * 得到消息序列
   * @param MessageId
   * @returns
   */
  getMessageSeq(MessageId: string): number {
    let seq = this.#map.get(MessageId) || 0
    seq++
    this.#map.set(MessageId, seq)
    // 如果映射表大小超过 100，则删除最早添加的 MessageId
    if (this.#map.size > 100) {
      const firstKey = this.#map.keys().next().value
      if (firstKey) this.#map.delete(firstKey)
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
    data: ApiRequestData
  ): Promise<{ id: string; timestamp: number }> {
    return this.groupService({
      url: `/v2/groups/${group_openid}/messages`,
      method: 'post',
      data: data
    }).then(res => res?.data)
  }

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
      srv_send_msg?: boolean
      file_type: FileType
      url?: string
      file_data?: any
    }
  ): Promise<{ file_uuid: string; file_info: string; ttl: number }> {
    return this.groupService({
      url: `/v2/users/${openid}/files`,
      method: 'post',
      data: data
    }).then(res => res?.data)
  }

  /**
   * 发送私聊富媒体文件
   * @param openid
   * @param content
   * @param file_type
   * @returns
   *  1 图文 2 视频 3 语言 4 文件
   * 图片：png/jpg，视频：mp4，语音：silk
   */
  async userFiles(
    openid: string,
    data: {
      srv_send_msg: boolean
      file_type: FileType
      url: string
      file_data?: any
    }
  ): Promise<{ file_uuid: string; file_info: string; ttl: number }> {
    return this.groupService({
      url: `/v2/users/${openid}/files`,
      method: 'post',
      data: data
    }).then(res => res?.data)
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
      srv_send_msg?: boolean
      file_type: FileType
      url?: string
      file_data?: any
    }
  ): Promise<{ file_uuid: string; file_info: string; ttl: number }> {
    return this.groupService({
      url: `/v2/groups/${openid}/files`,
      method: 'post',
      data: {
        srv_send_msg: false,
        ...data
      }
    }).then(res => res?.data)
  }

  /**
   *
   * @param openid
   * @param data
   * @returns
   */
  async groupsFiles(
    openid: string,
    data: {
      srv_send_msg?: boolean
      file_type: FileType
      url?: string
      file_data?: any
    }
  ): Promise<{ file_uuid: string; file_info: string; ttl: number }> {
    return this.groupService({
      url: `/v2/groups/${openid}/files`,
      method: 'post',
      data: {
        srv_send_msg: false,
        ...data
      }
    }).then(res => res?.data)
  }

  /**
   * 创建模板
   * *********
   * 使用该方法,你需要申请模板Id
   * 并设置markdown源码为{{.text_0}}{{.text_1}}
   * {{.text_2}}{{.text_3}}{{.text_4}}{{.text_5}}
   * {{.text_6}}{{.text_7}}{{.text_8}}{{.text_9}}
   * 当前,你也可以传递回调对key和values进行休整
   * @param custom_template_id
   * @param mac 默认 9
   * @param callBack 默认 (key,values)=>({key,values})
   * @returns
   */
  createTemplate(
    custom_template_id: string,
    mac = 10,
    callBack = (key: string, values: string[]) => ({ key, values })
  ) {
    let size = -1
    const params: { key: string; values: string[] }[] = []
    const Id = custom_template_id
    /**
     * 消耗一个参数
     * @param value 值
     * @param change 是否换行
     * @returns
     */
    const text = (value: string, change = false) => {
      // 仅限push
      if (size > mac - 1) return
      size++
      params.push(callBack(`text_${size}`, [`${value}${change ? '\r' : ''}`]))
    }

    /**
     * 消耗一个参数
     * @param start  开始的值
     * @param change 是否换行
     * @returns
     */
    const prefix = (start: string, label: string) => {
      text(`${start}[${label}]`)
    }

    /**
     * 消耗一个参数
     * @param param0.value 发送的值
     * @param param0.enter 是否自动发送
     * @param param0.reply 是否回复
     * @param param0.change 是否换行
     * @param param0.end 尾部字符串
     */
    const suffix = ({ value, enter = true, reply = false, change = false, end = '' }) => {
      text(
        `(mqqapi://aio/inlinecmd?command=${value}&enter=${enter}&reply=${reply})${end}${
          change ? '\r' : ''
        }`
      )
    }

    /**
     * 消耗2个参数
     * @param param0.label 显示的值
     * @param param0.value 发送的值
     * @param param0.enter 是否自动发送
     * @param param0.reply 是否回复
     * @param param0.change 是否换行
     * @param param0.start 头部字符串
     * @param param0.end 尾部字符串
     */
    const button = ({
      label,
      value,
      start = '',
      end = '',
      enter = true,
      reply = false,
      change = false
    }) => {
      // size 只少留两个
      if (size > mac - 1 - 2) return
      prefix(start, label)
      suffix({ value, enter, reply, change, end })
    }

    /**
     * **********
     * 代码块
     * **********
     * 跟在后面
     * 前面需要设置换行
     * 消耗4个参数
     * @param val
     * @returns
     */
    const code = (val: string) => {
      // size 至少留4个
      if (size > mac - 1 - 4) return
      text('``')
      text('`javascript\r' + val)
      text('\r`')
      text('``\r')
    }

    const getParam = () => {
      return {
        msg_type: 2,
        markdown: {
          custom_template_id: Id,
          params
        }
      }
    }

    return {
      size,
      text,
      prefix,
      suffix,
      button,
      code,
      getParam
    }
  }

  /**
   *
   * @param openid
   * @param message_id
   * @returns
   */
  userMessageDelete(openid: string, message_id: string) {
    return this.groupService({
      url: `/v2/users/${openid}/messages/${message_id}`,
      method: 'delete'
    }).then(res => res?.data)
  }

  /**
   *
   * @param group_openid
   * @param message_id
   * @returns
   */
  grouMessageDelte(group_openid: string, message_id: string) {
    return this.groupService({
      url: `/v2/groups/${group_openid}/messages/${message_id}`,
      method: 'delete'
    }).then(res => res?.data)
  }

  /**
   * 创建form
   * @param image
   * @param msg_id
   * @param content
   * @param name
   * @returns
   */
  async createFrom(image: Buffer, msg_id: string, content: any, Name = 'image.jpg') {
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
    return this.guildServer({
      method: 'post',
      url: `/channels/${channel_id}/messages`,
      headers: {
        'Content-Type': `multipart/form-data; boundary=${dary}`
      },
      data: formdata
    }).then(res => res?.data)
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
    return this.guildServer({
      method: 'post',
      url: `/dms/${guild_id}/messages`,
      headers: {
        'Content-Type': `multipart/form-data; boundary=${dary}`
      },
      data: formdata
    }).then(res => res?.data)
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
    return this.guildServer({
      method: 'get',
      url: `/users/@me`
    }).then(res => res?.data)
  }

  /**
   * 获取用户频道列表
   * @param message
   * @returns
   */
  async usersMeGuilds(params: { before: string; after: string; limit: number }) {
    return this.guildServer({
      method: 'get',
      url: `/users/@me/guilds`,
      params
    }).then(res => res?.data)
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
    return this.guildServer({
      method: 'get',
      url: `/guilds/${guild_id}`
    }).then(res => res?.data)
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
    return this.guildServer({
      method: 'get',
      url: `/guilds/${guild_id}/channels`
    }).then(res => res?.data)
  }

  /**
   * 获取子频道详情
   * @param channel_id
   * @returns
   */
  async channels(channel_id: string) {
    return this.guildServer({
      method: 'get',
      url: `/channels/${channel_id}`
    }).then(res => res?.data)
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
    return this.guildServer({
      method: 'post',
      url: `/guilds/${guild_id}/channels`,
      data
    }).then(res => res?.data)
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
    return this.guildServer({
      method: 'PATCH',
      url: `/channels/${channel_id}`,
      data
    }).then(res => res?.data)
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
    return this.guildServer({
      method: 'DELETE',
      url: `/channels/${channel_id}`,
      data
    }).then(res => res?.data)
  }

  /**
   * 获取在线成员数
   * @param channel_id
   * @returns
   */
  async channelsChannelOnlineNums(channel_id: string) {
    return this.guildServer({
      method: 'GET',
      url: `/channels/${channel_id}/online_nums`
    }).then(res => res?.data)
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
    return this.guildServer({
      method: 'GET',
      url: `/guilds/${guild_id}/members`,
      params
    }).then(res => res?.data)
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
    return this.guildServer({
      method: 'GET',
      url: `/guilds/${guild_id}/roles/${role_id}/members`,
      params
    }).then(res => res?.data)
  }

  /**
   * 获取成员详情
   * @param guild_id
   * @param user_id
   * @returns
   */
  async guildsMembersMessage(guild_id: string, user_id: string) {
    return this.guildServer({
      method: 'GET',
      url: `/guilds/${guild_id}/members/${user_id}`
    }).then(res => res?.data)
  }

  /**
   * 删除频道成员
   * @param guild_id
   * @param user_id
   * @returns
   */
  async guildsMembersDelete(guild_id: string, user_id: string) {
    return this.guildServer({
      method: 'DELETE',
      url: `/guilds/${guild_id}/members/${user_id}`
    }).then(res => res?.data)
  }

  /**
   * 获取指定消息
   * @param channel_id
   * @param message_id
   * @returns
   */
  async channelsMessages(channel_id: string, message_id: string) {
    return this.guildServer({
      method: 'GET',
      url: `/channels/${channel_id}/messages/${message_id}`
    }).then(res => res?.data)
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
    return this.guildServer({
      method: 'POST',
      url: `/channels/${channel_id}/messages`,
      data
    }).then(res => res?.data)
  }

  /**
   * 撤回消息
   * @param channel_id
   * @param message_id
   * @param hidetip
   * @returns
   */
  async channelsMessagesDelete(channel_id: string, message_id: string, hidetip: boolean = true) {
    return this.guildServer({
      method: 'DELETE',
      url: `/channels/${channel_id}/messages/${message_id}?hidetip=${hidetip}`
    }).then(res => res?.data)
  }

  /**
   * ***********
   * 频道身份api
   * ***********
   */

  /**
   * 获取频道身份组列表
   * @param guild_id 频道id
   * @returns
   */
  async guildsRoles(guild_id: string) {
    return this.guildServer({
      method: 'GET',
      url: `/guilds/${guild_id}/roles`
    }).then(res => res?.data)
  }

  /**
   * 创建频道身份组
   * @param guild_id 频道id
   * @param {object} data 参数
   * @param {object?} data.name 身份组名称
   * @param {object?} data.color ARGB 的 HEX 十六进制颜色值转换后的十进制数值
   * @param {object?} data.hoist 在成员列表中单独展示: 0-否, 1-是
   * @returns
   */
  async guildsRolesPost(
    guild_id: string,
    data: {
      name?: string
      color?: number
      hoist?: 0 | 1
    }
  ) {
    return this.guildServer({
      method: 'POST',
      url: `/guilds/${guild_id}/roles`,
      data
    }).then(res => res?.data)
  }

  /**
   * 修改频道身份组
   * @param guild_id 频道id
   * @param {object} data 参数
   * @param {object?} data.name 身份组名称
   * @param {object?} data.color ARGB 的 HEX 十六进制颜色值转换后的十进制数值
   * @param {object?} data.hoist 在成员列表中单独展示: 0-否, 1-是
   * @returns
   */
  async guildsRolesPatch(
    guild_id: string,
    role_id: string,
    data: {
      name?: string
      color?: number
      hoist?: 0 | 1
    }
  ) {
    return this.guildServer({
      method: 'PATCH',
      url: `/guilds/${guild_id}/roles/${role_id}`,
      data
    }).then(res => res?.data)
  }

  /**
   * 删除频道身份组
   * @param guild_id 频道id
   * @param role_id 身份组id
   */
  async guildsRolesDelete(guild_id: string, role_id: string) {
    return this.guildServer({
      method: 'DELETE',
      url: `/guilds/${guild_id}/roles/${role_id}`
    }).then(res => res?.data)
  }

  /**
   * 将成员添加到频道身份组
   * @param guild_id 频道id
   * @param channel_id 子频道id
   * @param user_id 用户id
   * @param role_id 身份组id
   * @returns
   */

  async guildsRolesMembersPut(
    guild_id: string,
    channel_id: string,
    user_id: string,
    role_id: string
  ) {
    return this.guildServer({
      method: 'PUT',
      url: `/guilds/${guild_id}/members/${user_id}/roles/${role_id}`,
      data: {
        channel: {
          id: channel_id
        }
      }
    }).then(res => res?.data)
  }

  /**
   * 将成员从频道身份组移除
   * @param guild_id 频道id
   * @param channel_id 子频道id
   * @param user_id 用户id
   * @param role_id 身份组id
   * @returns
   */

  async guildsRolesMembersDelete(
    guild_id: string,
    channel_id: string,
    user_id: string,
    role_id: string
  ) {
    return this.guildServer({
      method: 'DELETE',
      url: `/guilds/${guild_id}/members/${user_id}/roles/${role_id}`,
      data: {
        channel: {
          id: channel_id
        }
      }
    }).then(res => res?.data)
  }

  /**
   * **********
   * 子频道权限api
   * **********
   */
  /**
   * 获取子频道用户权限
   * @param channel_id 子频道id
   * @param user_id 用户id
   */
  async channelsPermissions(channel_id: string, user_id: string) {
    return this.guildServer({
      method: 'GET',
      url: `/channels/${channel_id}/members/${user_id}/permissions`
    }).then(res => res?.data)
  }

  /**
   * 修改子频道用户权限
   * @param channel_id 子频道id
   * @param user_id 用户id
   * @param 参数包括add和remove两个字段分别表示授予的权限以及删除的权限。要授予用户权限即把add对应位置 1，删除用户权限即把remove对应位置 1。当两个字段同一位都为 1，表现为删除权限。
   */
  async channelsPermissionsPut(channel_id: string, user_id: string, add: string, remove: string) {
    return this.guildServer({
      method: 'PUT',
      url: `/channels/${channel_id}/members/${user_id}/permissions`,
      data: {
        add,
        remove
      }
    }).then(res => res?.data)
  }

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
   * 查询频道消息频率限制
   * @param guild_id 频道id
   * @returns
   */
  async guildsMessageSetting(guild_id: string) {
    return this.guildServer({
      method: 'GET',
      url: `/guilds/${guild_id}/message/setting`
    }).then(res => res?.data)
  }
  /**
   * ***********
   * 私信api
   * **********
   */

  /**
   * 创建私信会话
   * @param recipient_id 接收者 id
   * @param source_guild_id 源频道 id
   * @returns
   */
  async usersMeDms() {
    return this.guildServer({
      method: 'POST',
      url: `/users/@me/dms`
    }).then(res => res?.data)
  }

  /**
   * 发送私信
   * @param guild_id
   * @returns
   */
  async dmsMessage(
    guild_id: string,
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
    return this.guildServer({
      method: 'POST',
      url: `/dms/${guild_id}/messages`,
      data
    }).then(res => res?.data)
  }

  /**
   * 撤回私信
   * @param guild_id
   * @param data
   * @returns
   */
  async dmsMessageDelete(guild_id: string, message_id: string, hidetip: boolean = true) {
    return this.guildServer({
      method: 'DELETE',
      url: `/dms/${guild_id}/messages/${message_id}?hidetip=${hidetip}`
    }).then(res => res?.data)
  }

  /**
   * *********
   * 禁言api
   * *******
   */

  /**
   * 全体禁言（非管理员）
   * @param guild_id 频道id
   * @param data { mute_end_timestamp:禁言结束时间戳, mute_seconds:禁言时长 } 两个参数必须传一个 优先级 mute_end_timestamp > mute_seconds
   * 将mute_end_timestamp或mute_seconds传值为字符串'0'，则表示解除全体禁言
   */
  async guildsMuteAll(
    guild_id: string,
    data: { mute_end_timestamp?: string; mute_seconds?: string }
  ) {
    return this.guildServer({
      method: 'PATCH',
      url: `/guilds/${guild_id}/mute`,
      data
    }).then(res => res?.data)
  }

  /**
   * 频道指定成员禁言
   * @param guild_id 频道id
   * @param user_id 用户id
   * @param data { mute_end_timestamp:禁言结束时间戳, mute_seconds:禁言时长 } 两个参数必须传一个 优先级 mute_end_timestamp > mute_seconds
   * 将mute_end_timestamp或mute_seconds传值为字符串'0'，则表示解除禁言
   * @returns
   */
  async guildsMemberMute(
    guild_id: string,
    user_id: string,
    data: { mute_end_timestamp?: string; mute_seconds?: string }
  ) {
    return this.guildServer({
      method: 'PATCH',
      url: `/guilds/${guild_id}/members/${user_id}/mute`,
      data
    }).then(res => res?.data)
  }

  /**
   * 频道批量禁言
   * @param guild_id 频道id
   * @param data { mute_end_timestamp:禁言结束时间戳, mute_seconds:禁言时长, user_ids:用户id数组 } 两个参数必须传一个 优先级 mute_end_timestamp > mute_seconds
   * 将mute_end_timestamp或mute_seconds传值为字符串'0'，则表示解除禁言
   */
  async guildsMute(
    guild_id: string,
    data: {
      mute_end_timestamp?: string
      mute_seconds?: string
      user_ids: string[]
    }
  ) {
    return this.guildServer({
      method: 'PATCH',
      url: `/guilds/${guild_id}/mute`,
      data
    }).then(res => res?.data)
  }

  /**
   * *******
   * 公告api
   * *******
   */

  /**
   * 创建频道公告
   * 公告类型分为 消息类型的频道公告 和 推荐子频道类型的频道公告
   * 详见 https://bot.q.qq.com/wiki/develop/api-v2/server-inter/channel/content/announces/post_guild_announces.html#%E5%8A%9F%E8%83%BD%E6%8F%8F%E8%BF%B0
   * @param guild_id 频道id
   * @param data { message_id:消息id, channel_id:频道id, announces_type:公告类型, recommend_channels:推荐频道id数组 }
   * @param channel_id 子频道id 消息id存在时必须传
   * @param announces_type 0:成员公告 1:欢迎公告 默认为 0
   * @param recommend_channels 推荐频道id数组 "recommend_channels": [{ "channel_id": "xxxx","introduce": "推荐语" }]
   * @returns 返回Announces 对象 （https://bot.q.qq.com/wiki/develop/api-v2/server-inter/channel/content/announces/model.html#Announces）
   */
  async guildsAnnounces(
    guild_id: string,
    data: {
      message_id?: string
      channel_id?: string
      announces_type?: 0 | 1
      recommend_channels?: string[]
    }
  ) {
    return this.guildServer({
      method: 'POST',
      url: `/guilds/${guild_id}/announces`,
      data
    }).then(res => res?.data)
  }
  /**
   * 删除频道公告
   * @param guild_id 频道id
   * @param message_id 消息id message_id 有值时，会校验 message_id 合法性，若不校验校验 message_id，请将 message_id 设置为 all
   * @returns
   */

  async guildsAnnouncesDelete(guild_id: string, message_id: string) {
    return this.guildServer({
      method: 'DELETE',
      url: `/guilds/${guild_id}/announces/${message_id}`
    }).then(res => res?.data)
  }

  /**
   * **********
   * 精华消息api
   * **********
   */

  /**
   * 添加精华消息
   * @param channel_id 频道id
   * @param message_id 消息id
   * @returns  返回 PinsMessage对象 {  "guild_id": "xxxxxx",  "channel_id": "xxxxxx",  "message_ids": ["xxxxx"]}
   * @returns message_ids 为当前请求后子频道内所有精华消息 message_id 数组
   */
  async channelsPinsPut(channel_id: string, message_id: string) {
    return this.guildServer({
      method: 'PUT',
      url: `/channels/${channel_id}/pins/${message_id}`
    }).then(res => res?.data)
  }
  /**
   * 删除精华消息
   * @param channel_id 子频道id
   * @param message_id 消息id
   * 删除子频道内全部精华消息，请将 message_id 设置为 all
   * @returns
   */

  async channelsPinsDelete(channel_id: string, message_id: string) {
    return this.guildServer({
      method: 'DELETE',
      url: `/channels/${channel_id}/pins/${message_id}`
    }).then(res => res?.data)
  }

  /**
   * 获取精华消息
   * @param channel_id 子频道id
   * @returns 返回 PinsMessage对象 {  "guild_id": "xxxxxx",  "channel_id": "xxxxxx",  "message_ids": ["xxxxx"]}
   * @returns message_ids 为当前请求后子频道内所有精华消息 message_id 数组
   */
  async channelsPins(channel_id: string) {
    return this.guildServer({
      method: 'GET',
      url: `/channels/${channel_id}/pins`
    }).then(res => res?.data)
  }

  /**
   * ********
   * 日程api
   * *******
   */

  /**
   * 获取频道日程列表
   * @param channel_id 子频道id
   * @returns 返回 Schedule 对象数组(详见https://bot.q.qq.com/wiki/develop/api-v2/server-inter/channel/content/schedule/model.html#schedule)
   */

  async channelsSchedules(channel_id: string) {
    return this.guildServer({
      method: 'GET',
      url: `/channels/${channel_id}/schedules`
    }).then(res => res?.data)
  }

  /**
   * 获取频道日程详情
   * @param channel_id 子频道id
   * @param schedule_id 日程id
   * @returns 返回 Schedule 对象(详见https://bot.q.qq.com/wiki/develop/api-v2/server-inter/channel/content/schedule/model.html#schedule)
   */

  async channelsSchedulesSchedule(channel_id: string, schedule_id: string) {
    return this.guildServer({
      method: 'GET',
      url: `/channels/${channel_id}/schedules/${schedule_id}`
    }).then(res => res?.data)
  }

  /**
   * 创建频道日程
   * @param channel_id 子频道id
   * @param name 日程名称
   * @param description 日程描述
   * @param start_timestamp 日程开始时间戳
   * @param end_timestamp 日程结束时间戳
   * @param jump_channel_id 日程开始时跳转的子频道id
   * @param remind_type 日程提醒类型
   *  0	不提醒
   *  1	开始时提醒
   *  2	开始前 5 分钟提醒
   *  3	开始前 15 分钟提醒
   *  4	开始前 30 分钟提醒
   *  5	开始前 60 分钟提醒
   * @returns 返回 Schedule 对象(详见https://bot.q.qq.com/wiki/develop/api-v2/server-inter/channel/content/schedule/model.html#schedule)
   */

  async channelsSchedulesPost(
    channel_id: string,
    data: {
      schedule: {
        name: string
        description?: string
        start_timestamp: string
        end_timestamp: string
        jump_channel_id: string
        remind_type: number
      }
    }
  ) {
    return this.guildServer({
      method: 'POST',
      url: `/channels/${channel_id}/schedules`,
      data
    }).then(res => res?.data)
  }

  /**
   * 修改频道日程
   * @param channel_id 子频道id
   * @param schedule_id 日程id
   * @param name 日程名称
   * @param description 日程描述
   * @param start_timestamp 日程开始时间戳
   * @param end_timestamp 日程结束时间戳
   * @param jump_channel_id 日程开始时跳转的子频道id
   * @param remind_type 日程提醒类型
   * 0	不提醒
   * 1	开始时提醒
   * 2	开始前 5 分钟提醒
   * 3	开始前 15 分钟提醒
   * 4	开始前 30 分钟提醒
   * 5	开始前 60 分钟提醒
   * @returns 返回 Schedule 对象(详见https://bot.q.qq.com/wiki/develop/api-v2/server-inter/channel/content/schedule/model.html#schedule)
   */
  async channelsSchedulesSchedulePatch(
    channel_id: string,
    schedule_id: string,
    data: {
      schedule: {
        name: string
        description?: string
        start_timestamp: string
        end_timestamp: string
        jump_channel_id: string
        remind_type: number
      }
    }
  ) {
    return this.guildServer({
      method: 'PATCH',
      url: `/channels/${channel_id}/schedules/${schedule_id}`,
      data
    }).then(res => res?.data)
  }

  /**
   * 删除频道日程
   * @param channel_id 子频道id
   * @param schedule_id 日程id
   * @returns
   */

  async channelsSchedulesScheduleDelete(channel_id: string, schedule_id: string) {
    return this.guildServer({
      method: 'DELETE',
      url: `/channels/${channel_id}/schedules/${schedule_id}`
    }).then(res => res?.data)
  }

  /**
   * ***********
   * 表情表态api
   * ***********
   */

  /**
   * 机器人发表表情表态
   * @param channel_id 子频道id
   * @param message_id 消息id
   * @param type 表情类型 1：系统表情 2：emoji表情
   * @param id 表情id 参考https://bot.q.qq.com/wiki/develop/api-v2/openapi/emoji/model.html#Emoji%20%E5%88%97%E8%A1%A8
   * @returns
   */

  async channelsMessagesReactionsPut(
    channel_id: string,
    message_id: string,
    type: 1 | 2,
    id: string
  ) {
    return this.guildServer({
      method: 'PUT',
      url: `/channels/${channel_id}/messages/${message_id}/reactions/${type}/${id}`
    }).then(res => res?.data)
  }

  /**
   * 删除机器人发表的表情表态
   * @param channel_id 子频道id
   * @param message_id 消息id
   * @param type 表情类型 1：系统表情 2：emoji表情
   * @param id 表情id 参考https://bot.q.qq.com/wiki/develop/api-v2/openapi/emoji/model.html#Emoji%20%E5%88%97%E8%A1%A8
   * @returns
   */

  async channelsMessagesReactionsDelete(
    channel_id: string,
    message_id: string,
    type: 1 | 2,
    id: string
  ) {
    return this.guildServer({
      method: 'DELETE',
      url: `/channels/${channel_id}/messages/${message_id}/reactions/${type}/${id}`
    }).then(res => res?.data)
  }

  /**
   * 获取消息表情表态的用户列表
   * @param channel_id 子频道id
   * @param message_id 消息id
   * @param type 表情类型 1：系统表情 2：emoji表情
   * @param id 表情id 参考https://bot.q.qq.com/wiki/develop/api-v2/openapi/emoji/model.html#Emoji%20%E5%88%97%E8%A1%A8
   * @param {object} data
   * @param {object} data.cookie 返回的cookie 第一次请求不传，后续请求传上次返回的cookie
   * @param {object} data.limit 返回的用户数量 默认20 最大50
   * @returns data:{ users:User[], cookie:string,is_end:true|false }
   */
  async channelsMessagesReactionsUsers(
    channel_id: string,
    message_id: string,
    type: 1 | 2,
    id: string,
    data: {
      cookie?: string
      limit?: number
    }
  ) {
    return this.guildServer({
      method: 'GET',
      url: `/channels/${channel_id}/messages/${message_id}/reactions/${type}/${id}`,
      data
    }).then(res => res?.data)
  }

  /**
   * ***********
   * 音频api
   * 音频接口：仅限音频类机器人才能使用，后续会根据机器人类型自动开通接口权限，现如需调用，需联系平台申请权限
   * **********
   */

  /**
   * 音频控制
   * @param channel_id 子频道id
   * @param audio_url 音频url status为0时传
   * @param status  0:开始 1:暂停 2:继续 3:停止
   * @param text 状态文本（比如：简单爱-周杰伦），可选，status为0时传，其他操作不传
   * @returns
   */
  async channelsAudioPost(
    channel_id: string,
    data: {
      audio_url?: string
      text?: string
      status: 0 | 1 | 2 | 3
    }
  ) {
    return this.guildServer({
      method: 'POST',
      url: `/channels/${channel_id}/audio`,
      data
    }).then(res => res?.data)
  }

  /**
   * 机器人上麦
   * @param channel_id 语音子频道id
   * @returns {}
   */
  async channelsMicPut(channel_id: string) {
    return this.guildServer({
      method: 'PUT',
      url: `/channels/${channel_id}/mic`
    }).then(res => res?.data)
  }
  /**
   * 机器人下麦
   * @param channel_id 语音子频道id
   * @returns {}
   */

  async channelsMicDelete(channel_id: string) {
    return this.guildServer({
      method: 'DELETE',
      url: `/channels/${channel_id}/mic`
    }).then(res => res?.data)
  }
  /**
   * **********
   * 帖子api
   * 注意
   * 公域机器人暂不支持申请，仅私域机器人可用，选择私域机器人后默认开通。
   * 注意: 开通后需要先将机器人从频道移除，然后重新添加，方可生效。
   * **********
   */

  /**
   * 获取帖子列表
   * @param channel_id 子频道id
   * @returns {threads:Thread[],is_finish:0|1}
   * @returns 返回 Thread 对象数组(详见https://bot.q.qq.com/wiki/develop/api-v2/server-inter/channel/content/forum/model.html#Thread)
   * @returns is_finish 为 1 时，表示已拉取完 为 0 时，表示未拉取完
   */
  async channelsThreads(channel_id: string) {
    return this.guildServer({
      method: 'GET',
      url: `/channels/${channel_id}/threads`
    }).then(res => res?.data)
  }

  /**
   * 获取帖子详情
   * @param channel_id 子频道id
   * @param thread_id 帖子id
   * @returns 返回 帖子详情对象(详见https://bot.q.qq.com/wiki/develop/api-v2/server-inter/channel/content/forum/model.html#ThreadInfo)
   * 其中content字段可参考 https://bot.q.qq.com/wiki/develop/api-v2/server-inter/channel/content/forum/model.html#RichText
   */
  async channelsThreadsThread(channel_id: string, thread_id: string) {
    return this.guildServer({
      method: 'GET',
      url: `/channels/${channel_id}/threads/${thread_id}`
    }).then(res => res?.data)
  }

  /**
   * 发表帖子
   * @param channel_id 子频道id
   * @param title 帖子标题
   * @param content 帖子内容
   * @param format 帖子内容格式 1:纯文本 2:HTML 3:Markdown 4:JSON
   * @returns 返回 {task_id:string,create_time:string} 其中 task_id 为帖子id，create_time 发帖时间戳
   */

  async channelsThreadsPut(
    channel_id: string,
    data: {
      title: string
      content: string
      format: 1 | 2 | 3 | 4
    }
  ) {
    return this.guildServer({
      method: 'PUT',
      url: `/channels/${channel_id}/threads`,
      data
    }).then(res => res?.data)
  }
  /**
   * 删除帖子
   * @param channel_id 子频道id
   * @param thread_id 帖子id
   * @returns
   */

  async channelsThreadsDelete(channel_id: string, thread_id: string) {
    return this.guildServer({
      method: 'DELETE',
      url: `/channels/${channel_id}/threads/${thread_id}`
    }).then(res => res?.data)
  }
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
    return this.guildServer({
      url: `/guilds/${guild_id}/api_permission`
    }).then(res => res?.data)
  }
}
