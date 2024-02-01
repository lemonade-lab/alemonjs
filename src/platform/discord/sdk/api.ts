import FormData from 'form-data'
import { createPicFrom } from '../../../core/index.js'
import axios from 'axios'
import { type AxiosRequestConfig } from 'axios'
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
  async applicationRoleConnectionsMetadata(application_id: string) {
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
  async applicationRoleConnectionsMetadataUpdate(application_id: string) {
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
  async userMessage(user_id: string) {
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
  async usersMeGuildsMember(guild_id: string) {
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
   * 获取频道成员
   * *********
   */
  async guildsMember(guild_id: string) {
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
  async usersMeGuildsDelete(guild_id: string) {
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
  async userMeChannels() {
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
  async applicationsMe() {
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
  async applicationsMeUpdate() {
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
  async usersMeConnections() {
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
  async usersMeApplicationsRoleConnection(application_id: string) {
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
  async usersMeApplicationsRoleConnectionUpdate(application_id: string) {
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
  async guildsCreate() {
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
  async guild(guild_id: string) {
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
  async guildsPreview(guild_id: string) {
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
  async guildsUpdate(guild_id: string) {
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
   * 删除频道
   * *********
   */
  async guildsDelete(guild_id: string) {
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
  async guildsThreadsActive(guild_id: string) {
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
   * 获取频道成员消息
   * *********
   */
  async getGuildMember(guild_id: string, user_id: string) {
    return this.request({
      method: 'get',
      url: `/guilds/${guild_id}/members/${user_id}`
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
  async guildsMembers(guild_id: string) {
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
  async guildsMembersSearch(guild_id: string) {
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
  async guildsMembersAdd(guild_id: string, user_id: string) {
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
  async guildsMembersUpdate(guild_id: string, user_id: string) {
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
  async guildsMembersMeNick(guild_id: string) {
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
  async guildsMembersMeNickUpdate(guild_id: string) {
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
  async guildsRoles(guild_id: string) {
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
  async guildsRolesCreate(guild_id: string) {
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
  async guildsRolesUpdate(guild_id: string) {
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
  async guildsRolesUpdateById(guild_id: string, role_id: string) {
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
  async guildsMEmbersRolesAdd(
    guild_id: string,
    user_id: string,
    role_id: string
  ) {
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
  async guildsMembersRolesDelete(
    guild_id: string,
    user_id: string,
    role_id: string
  ) {
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
  async guildsRolesDelete(guild_id: string, role_id: string) {
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
   * *********
   * 获取频道禁令
   * *********
   */
  async guildsBans(guild_id: string) {
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
  async guildsBansDelete(guild_id: string, user_id: string) {
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
  async guildsBansCreateByUserId(guild_id: string, user_id: string) {
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
  async guildsBansDeleteByUserId(guild_id: string, user_id: string) {
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
  async guildsMfa(guild_id: string) {
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
  async guildsPrune(guild_id: string) {
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
  async guildsPruneUpdate(guild_id: string) {
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
  async guildsInvites(guild_id: string) {
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
  async guildsIntegrations(guild_id: string) {
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
  async guildsDeleteByIntegrationsId(guild_id: string, integration_id: string) {
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
  async guildsWidget(guild_id: string) {
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
  async guildsWidgetUpdate(guild_id: string) {
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
  async guildsWidgetJSON(guild_id: string) {
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
  async guildVanityUrl(guild_id: string) {
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
  async guildsWidgetPNG(guild_id: string) {
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
  async guildsWelconScreen(guild_id: string) {
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
  async guildsWelconmeScreen(guild_id: string) {
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
  async guildsOnboarding(guild_id: string) {
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
  async guildsOnboardingUpdate(guild_id: string) {
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
  async guildsAuditLogs(guild_id: string) {
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
  async guildsAutoModerationsRules(
    guild_id: string,
    auto_moderation_rule_id: string
  ) {
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
  async guildsAutoModerationRulesCreate(guild_id: string) {
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
  async guildsAutoModerationsRulesUpdate(
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
  async guildsAutoModerationsRulesDelete(
    guild_id: string,
    auto_moderation_rule_id: string
  ) {
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
   * 获取所有子频道
   * *********
   */
  async guildsanyChannels(guild_id: string) {
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
   * 获取子频道
   * *********
   */
  async guildsChannels(channel_id: string) {
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
   * *********
   * 修改子频道
   * *********
   */
  async guildsChannelsUpdate(channel_id: string) {
    return this.request({
      method: 'PATCH',
      url: `/channels/${channel_id}`
    })
      .then(ApiLog)
      .catch(err => {
        console.error(err)
      })
  }
  /**
   * *********
   * 删除子频道
   * *********
   */
  async guildsChannelsDELETE(channel_id: string) {
    return this.request({
      method: 'DELETE',
      url: `/channels/${channel_id}`
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
  async guildsChannelsCreate(guild_id: string) {
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
  async guildsChannelsUpdateposi(guild_id: string) {
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
   * *********
   * 获取频道邀请
   * *********
   */
  async getChannelInvites(channel_id: string) {
    return this.request({
      method: 'get',
      url: `/channels/ ${channel_id} /invites`
    })
      .then(ApiLog)
      .catch(err => {
        console.error(err)
      })
  }
  /**
   * *********
   * 创建频道邀请
   * *********
   */
  async createChannelInvites(channel_id: string) {
    return this.request({
      method: 'POST',
      url: `/channels/ ${channel_id} /invites`
    })
      .then(ApiLog)
      .catch(err => {
        console.error(err)
      })
  }
  /**
   * *********
   * 删除频道邀请
   * *********
   */
  async deleteChannelInvites(channel_id: string) {
    return this.request({
      method: 'POST',
      url: `/channels/ ${channel_id} /invites`
    })
      .then(ApiLog)
      .catch(err => {
        console.error(err)
      })
  }

  /**
   * *********
   *触发输入指示器
   * *********
   */
  async triggerTypingIndicator(channel_id: string) {
    return this.request({
      method: 'POST',
      url: `/channels/ ${channel_id} /typing`
    })
      .then(ApiLog)
      .catch(err => {
        console.error(err)
      })
  }

  /**
   * *********
   *群组 DM 添加收件人
   * *********
   */
  async groupDMAddRecipient(channel_id: string, user_id: string) {
    return this.request({
      method: 'put',
      url: `/channels/ ${channel_id} /recipients/${user_id}`
    })
      .then(ApiLog)
      .catch(err => {
        console.error(err)
      })
  }
  /**
   * *********
   *群组DM删除收件人
   * *********
   */
  async groupDMdeleteRecipient(channel_id: string, user_id: string) {
    return this.request({
      method: 'delete',
      url: `/channels/ ${channel_id} /recipients/${user_id}`
    })
      .then(ApiLog)
      .catch(err => {
        console.error(err)
      })
  }
  /**
   * *********
   *启动消息开始线程
   * *********
   */
  async startThreadfromMessage(channel_id: string, message_id: string) {
    return this.request({
      method: 'post',
      url: `/channels/${channel_id} /messages/${message_id} /threads`
    })
      .then(ApiLog)
      .catch(err => {
        console.error(err)
      })
  }
  /**
   * *********
   *启动没有消息的线程
   * *********
   */
  async startThreadwithoutMessag(channel_id: string) {
    return this.request({
      method: 'post',
      url: `/channels/${channel_id}/threads`
    })
      .then(ApiLog)
      .catch(err => {
        console.error(err)
      })
  }
  /**
   * *********
   *在论坛或媒体频道中启动话题
   * *********
   */
  async startThreadinForum(channel_id: string) {
    return this.request({
      method: 'post',
      url: `/channels/${channel_id}/threads`
    })
      .then(ApiLog)
      .catch(err => {
        console.error(err)
      })
  }
  /**
   * *********
   *加入话题
   * *********
   */
  async joinThread(channel_id: string) {
    return this.request({
      method: 'PUT',
      url: `/channels/${channel_id}/thread-members/@me`
    })
      .then(ApiLog)
      .catch(err => {
        console.error(err)
      })
  }
  /**
   * *********
   *添加话题成员
   * *********
   */
  async addThreadMember(channel_id: string, user_id: string) {
    return this.request({
      method: 'PUT',
      url: `/channels/${channel_id}/thread-members/${user_id}`
    })
      .then(ApiLog)
      .catch(err => {
        console.error(err)
      })
  }
  /**
   * *********
   *删除话题
   * *********
   */
  async leavethread(channel_id: string) {
    return this.request({
      method: 'delete',
      url: `/channels/${channel_id}/thread-members/@me`
    })
      .then(ApiLog)
      .catch(err => {
        console.error(err)
      })
  }
  /**
   * *********
   *删除线程成员
   * *********
   */
  async removeThreadMember(channel_id: string, user_id: string) {
    return this.request({
      method: 'delete',
      url: `/channels/${channel_id}/thread-members/${user_id}`
    })
      .then(ApiLog)
      .catch(err => {
        console.error(err)
      })
  }
  /**
   * *********
   *获取线程成员
   * *********
   */
  async getThreadMember(channel_id: string, user_id: string) {
    return this.request({
      method: 'get',
      url: `/channels/${channel_id}/thread-members/${user_id}`
    })
      .then(ApiLog)
      .catch(err => {
        console.error(err)
      })
  }
  /**
   * *********
   *列出线程成员
   * *********
   */
  async listThreadMembers(channel_id: string) {
    return this.request({
      method: 'get',
      url: `/channels/${channel_id}/thread-members`
    })
      .then(ApiLog)
      .catch(err => {
        console.error(err)
      })
  }
  /**
   * *********
   *列出公共存档主题
   * *********
   */
  async listPublicArchivedThread(channel_id: string) {
    return this.request({
      method: 'get',
      url: `/channels/${channel_id}/threads/archived/public`
    })
      .then(ApiLog)
      .catch(err => {
        console.error(err)
      })
  }
  /**
   * *********
   *列出私有存档线程
   * *********
   */
  async listPrivateArchivedThreads(channel_id: string) {
    return this.request({
      method: 'get',
      url: `/channels/${channel_id}/threads/archived/private`
    })
      .then(ApiLog)
      .catch(err => {
        console.error(err)
      })
  }
  /**
   * *********
   *列出已加入的私人存档主题
   * *********
   */
  async listoinedPrivateThreads(channel_id: string) {
    return this.request({
      method: 'get',
      url: `/channels/${channel_id}/users/@me/threads/archived/private`
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
   * *********
   * 编辑频道权限
   * *********
   */
  async editChannelPermissions(channel_id: string, overwrite_id: string) {
    return this.request({
      method: 'PATCH',
      url: `/channels/ ${channel_id} /permissions/ ${overwrite_id}`
    })
      .then(ApiLog)
      .catch(err => {
        console.error(err)
      })
  }
  /**
   * *********
   * 删除频道权限
   * *********
   */
  async deleteChannelPermissions(channel_id: string, overwrite_id: string) {
    return this.request({
      method: 'delete',
      url: `/channels/ ${channel_id} /permissions/ ${overwrite_id}`
    })
      .then(ApiLog)
      .catch(err => {
        console.error(err)
      })
  }
  /**
   * *******
   * 消息api
   * ********
   */

  /**
   * *********
   * 获取子频道消息
   * *********
   */
  async guildsChannelsanymessages(channel_id: string) {
    return this.request({
      method: 'get',
      url: `/channels/${channel_id}/messages`
    })
      .then(ApiLog)
      .catch(err => {
        console.error(err)
      })
  }
  /**
   * *********
   * 获取单条子频道消息
   * *********
   */
  async guildsChannelsmessages(channel_id: string, message_id: string) {
    return this.request({
      method: 'get',
      url: `/channels/${channel_id}/messages/${message_id}`
    })
      .then(ApiLog)
      .catch(err => {
        console.error(err)
      })
  }
  /**
   * *********
   * 创建子频道消息
   * *********
   */
  async guildsChannelscreatmess(channel_id: string) {
    return this.request({
      method: 'post',
      url: `/channels/${channel_id}/messages`
    })
      .then(ApiLog)
      .catch(err => {
        console.error(err)
      })
  }
  /**
   * *********
   * 交叉发布消息
   * *********
   */
  async crosspostmessages(channel_id: string, message_id: string) {
    return this.request({
      method: 'POST',
      url: `/channels/ ${channel_id} /messages/ ${message_id} /crosspost`
    })
      .then(ApiLog)
      .catch(err => {
        console.error(err)
      })
  }

  /**
   * *********
   * 创造反应
   * *********
   */
  async createareaction(channel_id: string, message_id: string, emoji: string) {
    return this.request({
      method: 'PUT',
      url: `/channels/ ${channel_id} /messages/ ${message_id} /reactions/${emoji}/@me`
    })
      .then(ApiLog)
      .catch(err => {
        console.error(err)
      })
  }
  /**
   * *********
   * 删除自己的反应
   * *********
   */
  async deleteownreaction(
    channel_id: string,
    message_id: string,
    emoji: string
  ) {
    return this.request({
      method: 'DELETE',
      url: `/channels/ ${channel_id} /messages/ ${message_id} /reactions/${emoji}/@me`
    })
      .then(ApiLog)
      .catch(err => {
        console.error(err)
      })
  }
  /**
   * *********
   * 删除别人的反应
   * *********
   */
  async deleteareuserction(
    channel_id: string,
    message_id: string,
    emoji: string,
    user_id: string
  ) {
    return this.request({
      method: 'DELETE',
      url: `/channels/ ${channel_id} /messages/ ${message_id} /reactions/${emoji}/${user_id}`
    })
      .then(ApiLog)
      .catch(err => {
        console.error(err)
      })
  }
  /**
   * *********
   * 获取反应
   * *********
   */
  async getownreaction(channel_id: string, message_id: string, emoji: string) {
    return this.request({
      method: 'get',
      url: `/channels/ ${channel_id} /messages/ ${message_id} /reactions/${emoji}`
    })
      .then(ApiLog)
      .catch(err => {
        console.error(err)
      })
  }
  /**
   * *********
   * 删除所有反应
   * *********
   */
  async deleteAllreaction(channel_id: string, message_id: string) {
    return this.request({
      method: 'DELETE',
      url: `/channels/ ${channel_id} /messages/ ${message_id} /reactions`
    })
      .then(ApiLog)
      .catch(err => {
        console.error(err)
      })
  }
  /**
   * *********
   * 删除表情符号的所有反应
   * *********
   */
  async deleteAllreactionforEmoji(
    channel_id: string,
    message_id: string,
    emoji: string
  ) {
    return this.request({
      method: 'DELETE',
      url: `/channels/ ${channel_id} /messages/ ${message_id} /reactions/${emoji}`
    })
      .then(ApiLog)
      .catch(err => {
        console.error(err)
      })
  }
  /**
   * *********
   * 编辑消息
   * *********
   */
  async editMessage(channel_id: string, message_id: string) {
    return this.request({
      method: 'PATCH',
      url: `/channels/${channel_id}/messages/${message_id}`
    })
      .then(ApiLog)
      .catch(err => {
        console.error(err)
      })
  }
  /**
   * *********
   * 撤回消息
   * *********
   */
  async deleteMessage(channel_id: string, message_id: string) {
    return this.request({
      method: 'PATCH',
      url: `/channels/${channel_id}/messages/${message_id}`
    })
      .then(ApiLog)
      .catch(err => {
        console.error(err)
      })
  }
  /**
   * *********
   * 批量删除消息
   * *********
   */
  async bulkdeleteMessage(channel_id: string) {
    return this.request({
      method: 'post',
      url: `/channels/${channel_id}/messages/bulk-delete`
    })
      .then(ApiLog)
      .catch(err => {
        console.error(err)
      })
  }

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
   * *********
   * 关注公告频道
   * *********
   */
  async followAnnouncementChannel(channel_id: string) {
    return this.request({
      method: 'POST',
      url: `/channels/ ${channel_id} /followers`
    })
      .then(ApiLog)
      .catch(err => {
        console.error(err)
      })
  }
  /**
   * **********
   * 精华消息api
   * **********
   */

  /**
   * *********
   *获取置顶消息
   * *********
   */
  async getPinnedMessages(channel_id: string) {
    return this.request({
      method: 'get',
      url: `/channels/ ${channel_id}/pins`
    })
      .then(ApiLog)
      .catch(err => {
        console.error(err)
      })
  }

  /**
   * *********
   *置顶消息
   * *********
   */
  async pinMessage(channel_id: string, message_id: string) {
    return this.request({
      method: 'put',
      url: `/channels/ ${channel_id}/${message_id}`
    })
      .then(ApiLog)
      .catch(err => {
        console.error(err)
      })
  }
  /**
   * *********
   *取消置顶消息
   * *********
   */
  async deletepinMessage(channel_id: string, message_id: string) {
    return this.request({
      method: 'delete',
      url: `/channels/ ${channel_id}/${message_id}`
    })
      .then(ApiLog)
      .catch(err => {
        console.error(err)
      })
  }

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
   * *********
   *获取贴纸
   * *********
   */
  async getsticker(sticker_id: string) {
    return this.request({
      method: 'get',
      url: `/stickers/${sticker_id}`
    })
      .then(ApiLog)
      .catch(err => {
        console.error(err)
      })
  }
  /**
   * *********
   *列出贴纸包
   * *********
   */
  async listStickerPacks() {
    return this.request({
      method: 'get',
      url: `/stickers`
    })
      .then(ApiLog)
      .catch(err => {
        console.error(err)
      })
  }
  /**
   * *********
   *列出公会贴纸
   * *********
   */
  async listGuildStickers(sticker_id: string) {
    return this.request({
      method: 'get',
      url: `/stickers/${sticker_id}/stickers`
    })
      .then(ApiLog)
      .catch(err => {
        console.error(err)
      })
  }
  /**
   * *********
   *获取公会贴纸
   * *********
   */
  async getGuildSticker(guild_id: string, sticker_id: string) {
    return this.request({
      method: 'get',
      url: `/guilds/${guild_id}/stickers/${sticker_id}`
    })
      .then(ApiLog)
      .catch(err => {
        console.error(err)
      })
  }
  /**
   * *********
   *创建公会贴纸
   * *********
   */
  async createGuildSticker(guild_id: string) {
    return this.request({
      method: 'post',
      url: `/guilds/${guild_id}/stickers`
    })
      .then(ApiLog)
      .catch(err => {
        console.error(err)
      })
  }
  /**
   * *********
   *修改公会贴纸
   * *********
   */
  async modifyGuildSticker(guild_id: string, sticker_id: string) {
    return this.request({
      method: 'PATCH',
      url: `/guilds/${guild_id}/stickers/${sticker_id}`
    })
      .then(ApiLog)
      .catch(err => {
        console.error(err)
      })
  }
  /**
   * *********
   *删除公会贴纸
   * *********
   */
  async deleteGuildSticker(guild_id: string, sticker_id: string) {
    return this.request({
      method: 'delete',
      url: `/guilds/${guild_id}/stickers/${sticker_id}`
    })
      .then(ApiLog)
      .catch(err => {
        console.error(err)
      })
  }
  /**
   * *********
   *列出公会表情符号
   * *********
   */
  async listGuildEmojis(guild_id: string) {
    return this.request({
      method: 'get',
      url: `/guilds/ ${guild_id} /emojis`
    })
      .then(ApiLog)
      .catch(err => {
        console.error(err)
      })
  }
  /**
   * *********
   *获取公会表情符号
   * *********
   */
  async getGuildEmoji(guild_id: string, emoji_id: string) {
    return this.request({
      method: 'get',
      url: `/guilds/ ${guild_id} /emojis/ ${emoji_id}`
    })
      .then(ApiLog)
      .catch(err => {
        console.error(err)
      })
  }
  /**
   * *********
   *创建公会表情符号
   * *********
   */
  async createGuildEmoji(guild_id: string) {
    return this.request({
      method: 'post',
      url: `/guilds/ ${guild_id} /emojis`
    })
      .then(ApiLog)
      .catch(err => {
        console.error(err)
      })
  }
  /**
   * *********
   *修改公会表情
   * *********
   */
  async modifyGuildEmoji(guild_id: string, emoji_id: string) {
    return this.request({
      method: 'PATCH',
      url: `/guilds/ ${guild_id} /emojis/ ${emoji_id}`
    })
      .then(ApiLog)
      .catch(err => {
        console.error(err)
      })
  }
  /**
   * *********
   *删除公会表情符号
   * *********
   */
  async deleteGuildEmoji(guild_id: string, emoji_id: string) {
    return this.request({
      method: 'delete',
      url: `/guilds/ ${guild_id} /emojis/ ${emoji_id}`
    })
      .then(ApiLog)
      .catch(err => {
        console.error(err)
      })
  }

  /**
   * ***********
   * 音频api
   * **********
   */

  /**
   * *********
   * 列出语音区域
   * *********
   */
  async listVoiceRegions() {
    return this.request({
      method: 'get',
      url: `/voice/regions`
    })
      .then(ApiLog)
      .catch(err => {
        console.error(err)
      })
  }

  /**
   * *********
   * 获取频道语音区域
   * *********
   */
  async guildsRegions(guild_id: string) {
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
  async guildsVoiveStatesMe(guild_id: string) {
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
  async guildsVoiceStatesUpdate(guild_id: string, user_id: string) {
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
