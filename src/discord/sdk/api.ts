import FormData from 'form-data'
import { createPicFrom } from '../../core/index.js'
import axios, { type AxiosRequestConfig } from 'axios'
import { config } from './config.js'
import { ApiLog } from './log.js'

/**
 * api接口
 */
class ClientDc {
  API_URL = 'https://discord.com/api/v10'

  CDB_URL = 'https://cdn.discordapp.com'

  /**
   * 基础请求
   * @param opstion
   * @returns
   */
  request(options: AxiosRequestConfig) {
    const token = config.get('token')
    const service = axios.create({
      baseURL: this.API_URL,
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
    const service = axios.create({
      baseURL: this.CDB_URL,
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
    return `${this.CDB_URL}/avatars/${user_id}/${avatar_hash}.png`
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
    })
      .then(ApiLog)
      .catch(err => {
        console.error(err)
      })
  }

  /**
   * 得到应用详细信息
   * @returns
   */
  async applicationsMe() {
    return this.request({
      method: 'get',
      url: '/applications/@me'
    })
      .then(ApiLog)
      .catch(err => {
        console.error(err)
      })
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
    })
      .then(ApiLog)
      .catch(err => {
        console.error(err)
      })
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
   * ***********
   * 应用程序角色连接元数据接口
   * **********
   */
  /**
   *
   * 获取应用程序角色连接元数据记录
   */
  async getApplication_Metadata(application_id: string) {
    return this.request({
      method: 'get',
      url: `/applications/${application_id}/role-connections/metadata`
    })
      .then(ApiLog)
      .catch(err => {
        console.error(err)
      })
  }
  /**
   *
   * 更新应用程序角色连接元数据记录
   */
  async updateApplication_Metadata(application_id: string) {
    return this.request({
      method: 'put',
      url: `/applications/${application_id}/role-connections/metadata`
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
   * 获取当前用户详情
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
   * 根据id获取用户详情
   * @param message
   * @returns
   */
  async usersMe_id(user_id: string) {
    return this.request({
      method: 'get',
      url: `/users/${user_id}`
    })
      .then(ApiLog)
      .catch(err => {
        console.error(err)
      })
  }

  /**
   * 获取当前用户频道
   * @param params :{获取该频道 ID 之前的频道,获取该频道ID后的频道,返回的最大频道数量 (1-200),在响应中包括大概的成员和存在计数 }
   * @returns
   */
  async usersMeGuilds(
    params: {
      before: string
      after: string
      limit: number
      with_counts: boolean
    } | null
  ) {
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
   * *********
   * 获取当前用户频道成员
   * *********
   */
  async current_User(guild_id: string) {
    return this.request({
      method: 'get',
      url: `/users/@me/guilds/${guild_id}/member`
    })
      .then(ApiLog)
      .catch(err => {
        console.error(err)
      })
  }
  /**
   * *********
   * 获取当前用户频道成员
   * *********
   */
  async user_Guilds(guild_id: string) {
    return this.request({
      method: 'get',
      url: `/guilds/${guild_id}/member`
    })
      .then(ApiLog)
      .catch(err => {
        console.error(err)
      })
  }
  /**
   * *********
   * 离开频道
   * *********
   */
  async leave_Guild(guild_id: string) {
    return this.request({
      method: 'DELETE',
      url: `/users/@me/guilds/${guild_id}`
    })
      .then(ApiLog)
      .catch(err => {
        console.error(err)
      })
  }
  /**
   * *********
   * 创建DM
   * *********
   */
  async create_DM() {
    return this.request({
      method: 'post',
      url: `/user/@me/channels`
    })
      .then(ApiLog)
      .catch(err => {
        console.error(err)
      })
  }

  /**
   * ********
   * 应用api
   * *******
   */

  /**
   * *********
   * 获取当前应用程序
   * *********
   */
  async current_Application() {
    return this.request({
      method: 'GET',
      url: `/applications/@me`
    })
      .then(ApiLog)
      .catch(err => {
        console.error(err)
      })
  }
  /**
   * *********
   * 编辑当前应用程序
   * *********
   */
  async editcurrent_Application() {
    return this.request({
      method: 'PATCH',
      url: `/applications/@me`
    })
      .then(ApiLog)
      .catch(err => {
        console.error(err)
      })
  }

  /**
   * *********
   * 获取当前用户连接
   * *********
   */
  async user_Connections() {
    return this.request({
      method: 'GET',
      url: `/users/@me/connections`
    })
      .then(ApiLog)
      .catch(err => {
        console.error(err)
      })
  }
  /**
   * *********
   * 获取当前用户应用程序角色连接
   * *********
   */
  async getUser_Application(application_id: string) {
    return this.request({
      method: 'GET',
      url: `/users/@me/applications/${application_id}/role-connection`
    })
      .then(ApiLog)
      .catch(err => {
        console.error(err)
      })
  }
  /**
   * *********
   * 更新当前用户应用程序角色连接
   * *********
   */
  async updateCurrent_User(application_id: string) {
    return this.request({
      method: 'PUT',
      url: `/users/@me/applications/${application_id}/role-connection`
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
   * *********
   * 创建频道
   * *********
   */
  async create_Guild() {
    return this.request({
      method: 'post',
      url: `/guilds`
    })
      .then(ApiLog)
      .catch(err => {
        console.error(err)
      })
  }
  /**
   * *********
   * 获取频道
   * *********
   */
  async get_Guild(guild_id: string) {
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
   * *********
   * 获取频道预览
   * *********
   */
  async get_GuildPreview(guild_id: string) {
    return this.request({
      method: 'get',
      url: `/guilds/${guild_id}/preview`
    })
      .then(ApiLog)
      .catch(err => {
        console.error(err)
      })
  }
  /**
   * *********
   * 修改频道
   * *********
   */
  async modify_Guild(guild_id: string) {
    return this.request({
      method: 'PATCH',
      url: `/guilds/${guild_id}`
    })
      .then(ApiLog)
      .catch(err => {
        console.error(err)
      })
  }

  /**
   * *********
   * 修改频道
   * *********
   */
  async delete_Guild(guild_id: string) {
    return this.request({
      method: 'DELETE',
      url: `/guilds/${guild_id}`
    })
      .then(ApiLog)
      .catch(err => {
        console.error(err)
      })
  }
  /**
   * *********
   * 列出活跃的频道线程
   * *********
   */
  async guild_Threads(guild_id: string) {
    return this.request({
      method: 'get',
      url: `/guilds/${guild_id}/threads/active`
    })
      .then(ApiLog)
      .catch(err => {
        console.error(err)
      })
  }
  /**
   * *********
   * 列出频道成员
   * *********
   */
  async listguild_Members(guild_id: string) {
    return this.request({
      method: 'get',
      url: `/guilds/${guild_id}/members`
    })
      .then(ApiLog)
      .catch(err => {
        console.error(err)
      })
  }
  /**
   * *********
   * 搜索频道成员
   * *********
   */
  async searchguild_members(guild_id: string) {
    return this.request({
      method: 'get',
      url: `/guilds/${guild_id}/members/search`
    })
      .then(ApiLog)
      .catch(err => {
        console.error(err)
      })
  }
  /**
   * *********
   * 添加频道成员
   * *********
   */
  async addguild_members(guild_id: string, user_id: string) {
    return this.request({
      method: 'put',
      url: `/guilds/${guild_id}/members/${user_id}`
    })
      .then(ApiLog)
      .catch(err => {
        console.error(err)
      })
  }
  /**
   * *********
   * 修改频道成员
   * *********
   */
  async modifyguild_members(guild_id: string, user_id: string) {
    return this.request({
      method: 'PATCH',
      url: `/guilds/${guild_id}/members/${user_id}`
    })
      .then(ApiLog)
      .catch(err => {
        console.error(err)
      })
  }

  /**
   * *********
   * 修改当前成员
   * *********
   */
  async modifyUser_Member(guild_id: string) {
    return this.request({
      method: 'PATCH',
      url: `/guilds/${guild_id}/members/@me/nick`
    })
      .then(ApiLog)
      .catch(err => {
        console.error(err)
      })
  }
  /**
   * *********
   * 修改当前用户昵称
   * *********
   */
  async modifyUser_Nick(guild_id: string) {
    return this.request({
      method: 'PATCH',
      url: `/guilds/${guild_id}/members/@me/nick`
    })
      .then(ApiLog)
      .catch(err => {
        console.error(err)
      })
  }
  /**
   * *********
   * 获取频道角色
   * *********
   */
  async getUser_Role(guild_id: string) {
    return this.request({
      method: 'get',
      url: `/guilds/${guild_id}/roles`
    })
      .then(ApiLog)
      .catch(err => {
        console.error(err)
      })
  }
  /**
   * *********
   * 创建频道角色
   * *********
   */
  async createUser_Role(guild_id: string) {
    return this.request({
      method: 'post',
      url: `/guilds/${guild_id}/roles`
    })
      .then(ApiLog)
      .catch(err => {
        console.error(err)
      })
  }
  /**
   * *********
   * 修改频道角色位置
   * *********
   */
  async modifyUser_RolePosi(guild_id: string) {
    return this.request({
      method: 'PATCH',
      url: `/guilds/${guild_id}/roles`
    })
      .then(ApiLog)
      .catch(err => {
        console.error(err)
      })
  }
  /**
   * *********
   * 修改频道角色
   * *********
   */
  async modifyUser_Role(guild_id: string, role_id: string) {
    return this.request({
      method: 'PATCH',
      url: `/guilds/${guild_id}/roles/${role_id}`
    })
      .then(ApiLog)
      .catch(err => {
        console.error(err)
      })
  }
  /**
   * *********
   * 添加频道成员角色
   * *********
   */
  async AddUser_Role(guild_id: string, user_id: string, role_id: string) {
    return this.request({
      method: 'put',
      url: `/guilds/${guild_id}/members/${user_id}/roles/${role_id}`
    })
      .then(ApiLog)
      .catch(err => {
        console.error(err)
      })
  }
  /**
   * *********
   * 删除频道成员角色
   * *********
   */
  async delUser_Role(guild_id: string, user_id: string, role_id: string) {
    return this.request({
      method: 'DELETE',
      url: `/guilds/${guild_id}/members/${user_id}/roles/${role_id}`
    })
      .then(ApiLog)
      .catch(err => {
        console.error(err)
      })
  }
  /**
   * *********
   * 删除频道角色
   * *********
   */
  async delguild_Role(guild_id: string, role_id: string) {
    return this.request({
      method: 'DELETE',
      url: `/guilds/${guild_id}/roles/${role_id}`
    })
      .then(ApiLog)
      .catch(err => {
        console.error(err)
      })
  }
  /**
   * *********
   * 删除频道成员
   * *********
   */
  async delUser_Member(guild_id: string, user_id: string) {
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
   * *********
   * 获取频道禁令
   * *********
   */
  async getGuild_Bans(guild_id: string) {
    return this.request({
      method: 'get',
      url: `/guilds/${guild_id}/bans`
    })
      .then(ApiLog)
      .catch(err => {
        console.error(err)
      })
  }
  /**
   * *********
   * 获得频道禁令
   * *********
   */
  async getGuild_Ban(guild_id: string, user_id: string) {
    return this.request({
      method: 'DELETE',
      url: `/guilds/${guild_id}/bans/${user_id}`
    })
      .then(ApiLog)
      .catch(err => {
        console.error(err)
      })
  }
  /**
   * *********
   * 创建频道禁令
   * *********
   */
  async creatGuild_Ban(guild_id: string, user_id: string) {
    return this.request({
      method: 'PUT',
      url: `/guilds/${guild_id}/bans/${user_id}`
    })
      .then(ApiLog)
      .catch(err => {
        console.error(err)
      })
  }
  /**
   * *********
   * 解除频道禁令
   * *********
   */
  async delGuild_Ban(guild_id: string, user_id: string) {
    return this.request({
      method: 'DELETE',
      url: `/guilds/${guild_id}/bans/${user_id}`
    })
      .then(ApiLog)
      .catch(err => {
        console.error(err)
      })
  }
  /**
   * *********
   * 修改频道MFA级别
   * *********
   */
  async modifyGuild_MFALevel(guild_id: string) {
    return this.request({
      method: 'post',
      url: `/guilds/${guild_id}/mfa`
    })
      .then(ApiLog)
      .catch(err => {
        console.error(err)
      })
  }
  /**
   * *********
   * 获取频道修剪数量
   * *********
   */
  async GetGuild_PruneCount(guild_id: string) {
    return this.request({
      method: 'get',
      url: `/guilds/${guild_id}/prune`
    })
      .then(ApiLog)
      .catch(err => {
        console.error(err)
      })
  }
  /**
   * *********
   * 开始频道修剪
   * *********
   */
  async beginGuild_Prune(guild_id: string) {
    return this.request({
      method: 'post',
      url: `/guilds/${guild_id}/prune`
    })
      .then(ApiLog)
      .catch(err => {
        console.error(err)
      })
  }
  /**
   * *********
   * 获取频道邀请
   * *********
   */
  async getGuild_Invites(guild_id: string) {
    return this.request({
      method: 'get',
      url: `/guilds/${guild_id}/invites`
    })
      .then(ApiLog)
      .catch(err => {
        console.error(err)
      })
  }
  /**
   * *********
   * 获取频道集成
   * *********
   */
  async getGuild_Integrations(guild_id: string) {
    return this.request({
      method: 'get',
      url: `/guilds/${guild_id}/integrations`
    })
      .then(ApiLog)
      .catch(err => {
        console.error(err)
      })
  }
  /**
   * *********
   * 删除频道集成
   * *********
   */
  async delGuild_Integrations(guild_id: string, integration_id: string) {
    return this.request({
      method: 'DELETE',
      url: `/guilds/${guild_id}/${integration_id}`
    })
      .then(ApiLog)
      .catch(err => {
        console.error(err)
      })
  }
  /**
   * *********
   * 获取频道小部件设置
   * *********
   */
  async getGuild_WidgetSettings(guild_id: string) {
    return this.request({
      method: 'get',
      url: `/guilds/${guild_id}/widget`
    })
      .then(ApiLog)
      .catch(err => {
        console.error(err)
      })
  }
  /**
   * *********
   * 修改频道小部件
   * *********
   */
  async modifyGuild_Widget(guild_id: string) {
    return this.request({
      method: 'PATCH',
      url: `/guilds/${guild_id}/widget`
    })
      .then(ApiLog)
      .catch(err => {
        console.error(err)
      })
  }
  /**
   * *********
   * 获取频道小部件
   * *********
   */
  async GetGuild_Widget(guild_id: string) {
    return this.request({
      method: 'get',
      url: `/guilds/${guild_id}/widget.json`
    })
      .then(ApiLog)
      .catch(err => {
        console.error(err)
      })
  }
  /**
   * *********
   * 获取频道个性网址
   * *********
   */
  async GetGuild_VanityURL(guild_id: string) {
    return this.request({
      method: 'get',
      url: `/guilds/${guild_id}/vanity-url`
    })
      .then(ApiLog)
      .catch(err => {
        console.error(err)
      })
  }
  /**
   * *********
   * 获取频道小部件图像
   * *********
   */
  async GetGuild_WidgetImage(guild_id: string) {
    return this.request({
      method: 'get',
      url: `/guilds/${guild_id}/widget.png`
    })
      .then(ApiLog)
      .catch(err => {
        console.error(err)
      })
  }
  /**
   * *********
   * 获取频道欢迎屏幕
   * *********
   */
  async GetGuild_welcomeScreen(guild_id: string) {
    return this.request({
      method: 'get',
      url: `/guilds/${guild_id}/welcome-screen`
    })
      .then(ApiLog)
      .catch(err => {
        console.error(err)
      })
  }
  /**
   * *********
   * 修改频道欢迎界面
   * *********
   */
  async modifyGuild_welcomeScreen(guild_id: string) {
    return this.request({
      method: 'PATCH',
      url: `/guilds/${guild_id}/welcome-screen`
    })
      .then(ApiLog)
      .catch(err => {
        console.error(err)
      })
  }
  /**
   * *********
   * 获取频道入职
   * *********
   */
  async getGuild_Onboarding(guild_id: string) {
    return this.request({
      method: 'get',
      url: `/guilds/${guild_id}/onboarding`
    })
      .then(ApiLog)
      .catch(err => {
        console.error(err)
      })
  }
  /**
   * *********
   * 修改频道入职
   * *********
   */
  async modifyGuild_Onboarding(guild_id: string) {
    return this.request({
      method: 'PUT',
      url: `/guilds/${guild_id}/onboarding`
    })
      .then(ApiLog)
      .catch(err => {
        console.error(err)
      })
  }
  /**
   * *********
   * 获取公会审核日志
   * *********
   */
  async getGuild_AuditLog(guild_id: string) {
    return this.request({
      method: 'get',
      url: `/guilds/${guild_id}/audit-logs`
    })
      .then(ApiLog)
      .catch(err => {
        console.error(err)
      })
  }
  /**
   * *********
   * 获取自动审核规则
   * *********
   */
  async getGuild_AutoRule(guild_id: string, auto_moderation_rule_id: string) {
    return this.request({
      method: 'get',
      url: `/guilds/${guild_id}/auto-moderation/rules/${auto_moderation_rule_id}`
    })
      .then(ApiLog)
      .catch(err => {
        console.error(err)
      })
  }
  /**
   * *********
   * 创建自动审核规则
   * *********
   */
  async creatGuild_AutoRule(guild_id: string) {
    return this.request({
      method: 'POST',
      url: `/guilds/${guild_id}/auto-moderation/rules`
    })
      .then(ApiLog)
      .catch(err => {
        console.error(err)
      })
  }
  /**
   * *********
   * 修改自动审核规则
   * *********
   */
  async modifyGuild_AutoRule(
    guild_id: string,
    auto_moderation_rule_id: string
  ) {
    return this.request({
      method: 'PATCH',
      url: `/guilds/${guild_id}/auto-moderation/rules/${auto_moderation_rule_id}`
    })
      .then(ApiLog)
      .catch(err => {
        console.error(err)
      })
  }
  /**
   * *********
   * 删除自动审核规则
   * *********
   */
  async delGuild_AutoRule(guild_id: string, auto_moderation_rule_id: string) {
    return this.request({
      method: 'DELETE',
      url: `/guilds/${guild_id}/auto-moderation/rules/${auto_moderation_rule_id}`
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
   * 获取子频道
   * *********
   */
  async get_Channels(guild_id: string) {
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
   * *********
   * 创建子频道
   * *********
   */
  async creat_Channels(guild_id: string) {
    return this.request({
      method: 'post',
      url: `/guilds/${guild_id}/channels`
    })
      .then(ApiLog)
      .catch(err => {
        console.error(err)
      })
  }
  /**
   * *********
   * 修改子频道位置
   * *********
   */
  async Modify_ChannelsPosi(guild_id: string) {
    return this.request({
      method: 'PATCH',
      url: `/guilds/${guild_id}/channels`
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
   * *********
   * 获取频道语音区域
   * *********
   */
  async getGuild_VoiceRegions(guild_id: string) {
    return this.request({
      method: 'get',
      url: `/guilds/${guild_id}/regions`
    })
      .then(ApiLog)
      .catch(err => {
        console.error(err)
      })
  }
  /**
   * *********
   * 修改当前用户语音状态
   * *********
   */
  async modifyCurrentUser_VoiceState(guild_id: string) {
    return this.request({
      method: 'PATCH',
      url: `/guilds/${guild_id}/voice-states/@me`
    })
      .then(ApiLog)
      .catch(err => {
        console.error(err)
      })
  }
  /**
   * *********
   * 修改用户语音状态
   * *********
   */
  async modifyUser_VoiceState(guild_id: string, user_id: string) {
    return this.request({
      method: 'PATCH',
      url: `/guilds/${guild_id}/voice-states/${user_id}`
    })
      .then(ApiLog)
      .catch(err => {
        console.error(err)
      })
  }

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
    })
      .then(ApiLog)
      .catch(err => {
        console.error(err)
      })
  }
}

/**
 * 接口
 */
export const ClientDISOCRD = new ClientDc()
