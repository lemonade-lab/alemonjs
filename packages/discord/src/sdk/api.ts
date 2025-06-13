import FormData from 'form-data'
import axios from 'axios'
import { type AxiosRequestConfig } from 'axios'
import { config } from './config.js'
import { createPicFrom } from './core/from.js'
import { Readable } from 'stream'

type MessageData = {
  content?: string
  tts?: boolean
  embeds?: {
    title?: string
    description?: string
  }[]
  components?: {
    type: number
    components:
      | {
          type: number
          style: number
          label?: string
          emoji?: any
          custom_id?: string // 非高级按钮所必要的
          sku_id?: any // 和所有的互斥（高级按钮）
          url?: string // 和 custom_id 互斥
          disabled?: boolean
        }[]
      | {
          type: number
          // style: number
          custom_id?: string // 非高级按钮所必要的
          options?: {
            label: string
            value: string
            description?: string
            emoji?: {
              name?: string
              id?: string
            }
          }[]
        }[]
      | {
          custom_id: string
          max_values: number
          min_values: number
          options: {
            description?: string
            emoji?: {
              name?: string
              id?: string
            }
            label: string
            value: string
          }[]
        }[]
      | {
          type: number
          custom_id: string
          label: string
          style: number
          min_length: number
          max_length: number
          placeholder: string
          required: boolean
        }[]
  }[]
  files?: any[]
}

export const API_URL = 'https://discord.com/api/v10'
export const CDB_URL = 'https://cdn.discordapp.com'

/**
 * api接口
 */
export class DCAPI {
  /**
   * 基础请求
   * @param opstion
   * @returns
   */
  request(options: AxiosRequestConfig) {
    const token = config.get('token')
    const service = axios.create({
      baseURL: API_URL,
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
      baseURL: CDB_URL,
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
    return `${CDB_URL}/avatars/${user_id}/${avatar_hash}.png`
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
    }).then(res => res?.data)
  }

  /**
   *
   * @param channel_id
   * @param data
   * @param headers
   * @returns
   */
  async channelsMessages(
    channel_id: string,
    data: MessageData,
    headers?: AxiosRequestConfig['headers']
  ) {
    return this.request({
      url: `channels/${channel_id}/messages`,
      method: 'post',
      headers: headers,
      data
    }).then(res => res?.data)
  }

  /**
   *
   * @param channel_id
   * @param img
   * @returns
   */
  async channelsMessagesImage(
    channel_id: string,
    img: string | Buffer | Readable,
    param?: MessageData
  ) {
    const from = await createPicFrom(img)
    if (!from) return
    const { picData, name } = from
    const formData = new FormData()
    if (param) {
      for (const key in param) {
        if (param[key]) {
          formData.append(key, param[key])
        }
      }
    }
    formData.append('file', picData, name)
    return this.request({
      method: 'post',
      url: `channels/${channel_id}/messages`,
      data: formData,
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    }).then(res => res.data)
  }

  /**
   * ************
   * 消息-图片接口
   * ***********
   */
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
   * 发送buffer图片
   * @param id 传子频道id
   * @param message {消息编号,图片,内容}
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
    }).then(res => res?.data)
  }

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
    }).then(res => res?.data)
  }
  /**
   *
   * 更新应用程序角色连接元数据记录
   */
  async applicationRoleConnectionsMetadataUpdate(application_id: string) {
    return this.request({
      method: 'put',
      url: `/applications/${application_id}/role-connections/metadata`
    }).then(res => res?.data)
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
    }).then(res => res?.data)
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
    }).then(res => res?.data)
  }

  /**
   * 获取当前用户频道
   * @param params :{获取该频道 Id 之前的频道,获取该频道Id后的频道,返回的最大频道数量 (1-200),在响应中包括大概的成员和存在计数 }
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
    }).then(res => res?.data)
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
    }).then(res => res?.data)
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
    }).then(res => res?.data)
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
    }).then(res => res?.data)
  }
  /**
   * *********
   * 创建DM
   * *********
   */
  async userMeChannels(recipient_id: string) {
    return this.request({
      method: 'post',
      url: `/user/@me/channels`,
      data: {
        recipient_id
      }
    }).then(res => res?.data)
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
    }).then(res => res?.data)
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
    }).then(res => res?.data)
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
    }).then(res => res?.data)
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
    }).then(res => res?.data)
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
    }).then(res => res?.data)
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
    }).then(res => res?.data)
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
    }).then(res => res?.data)
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
    }).then(res => res?.data)
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
    }).then(res => res?.data)
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
    }).then(res => res?.data)
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
    }).then(res => res?.data)
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
    }).then(res => res?.data)
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
    }).then(res => res?.data)
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
    }).then(res => res?.data)
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
    }).then(res => res?.data)
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
    }).then(res => res?.data)
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
    }).then(res => res?.data)
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
    }).then(res => res?.data)
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
    }).then(res => res?.data)
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
    }).then(res => res?.data)
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
    }).then(res => res?.data)
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
    }).then(res => res?.data)
  }
  /**
   * *********
   * 添加频道成员角色
   * *********
   */
  async guildsMEmbersRolesAdd(guild_id: string, user_id: string, role_id: string) {
    return this.request({
      method: 'put',
      url: `/guilds/${guild_id}/members/${user_id}/roles/${role_id}`
    }).then(res => res?.data)
  }
  /**
   * *********
   * 删除频道成员角色
   * *********
   */
  async guildsMembersRolesDelete(guild_id: string, user_id: string, role_id: string) {
    return this.request({
      method: 'DELETE',
      url: `/guilds/${guild_id}/members/${user_id}/roles/${role_id}`
    }).then(res => res?.data)
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
    }).then(res => res?.data)
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
    }).then(res => res?.data)
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
    }).then(res => res?.data)
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
    }).then(res => res?.data)
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
    }).then(res => res?.data)
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
    }).then(res => res?.data)
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
    }).then(res => res?.data)
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
    }).then(res => res?.data)
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
    }).then(res => res?.data)
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
    }).then(res => res?.data)
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
    }).then(res => res?.data)
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
    }).then(res => res?.data)
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
    }).then(res => res?.data)
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
    }).then(res => res?.data)
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
    }).then(res => res?.data)
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
    }).then(res => res?.data)
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
    }).then(res => res?.data)
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
    }).then(res => res?.data)
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
    }).then(res => res?.data)
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
    }).then(res => res?.data)
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
    }).then(res => res?.data)
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
    }).then(res => res?.data)
  }
  /**
   * *********
   * 获取自动审核规则
   * *********
   */
  async guildsAutoModerationsRules(guild_id: string, auto_moderation_rule_id: string) {
    return this.request({
      method: 'get',
      url: `/guilds/${guild_id}/auto-moderation/rules/${auto_moderation_rule_id}`
    }).then(res => res?.data)
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
    }).then(res => res?.data)
  }
  /**
   * *********
   * 修改自动审核规则
   * *********
   */
  async guildsAutoModerationsRulesUpdate(guild_id: string, auto_moderation_rule_id: string) {
    return this.request({
      method: 'PATCH',
      url: `/guilds/${guild_id}/auto-moderation/rules/${auto_moderation_rule_id}`
    }).then(res => res?.data)
  }
  /**
   * *********
   * 删除自动审核规则
   * *********
   */
  async guildsAutoModerationsRulesDelete(guild_id: string, auto_moderation_rule_id: string) {
    return this.request({
      method: 'DELETE',
      url: `/guilds/${guild_id}/auto-moderation/rules/${auto_moderation_rule_id}`
    }).then(res => res?.data)
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
    }).then(res => res?.data)
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
    }).then(res => res?.data)
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
    }).then(res => res?.data)
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
    }).then(res => res?.data)
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
    }).then(res => res?.data)
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
    }).then(res => res?.data)
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
    }).then(res => res?.data)
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
    }).then(res => res?.data)
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
    }).then(res => res?.data)
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
    }).then(res => res?.data)
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
    }).then(res => res?.data)
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
    }).then(res => res?.data)
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
    }).then(res => res?.data)
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
    }).then(res => res?.data)
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
    }).then(res => res?.data)
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
    }).then(res => res?.data)
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
    }).then(res => res?.data)
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
    }).then(res => res?.data)
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
    }).then(res => res?.data)
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
    }).then(res => res?.data)
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
    }).then(res => res?.data)
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
    }).then(res => res?.data)
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
    }).then(res => res?.data)
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
    }).then(res => res?.data)
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
    }).then(res => res?.data)
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
    }).then(res => res?.data)
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
    }).then(res => res?.data)
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
    }).then(res => res?.data)
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
    }).then(res => res?.data)
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
    }).then(res => res?.data)
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
    }).then(res => res?.data)
  }
  /**
   * *********
   * 删除自己的反应
   * *********
   */
  async deleteownreaction(channel_id: string, message_id: string, emoji: string) {
    return this.request({
      method: 'DELETE',
      url: `/channels/ ${channel_id} /messages/ ${message_id} /reactions/${emoji}/@me`
    }).then(res => res?.data)
  }
  /**
   * *********
   * 删除别人的反应
   * *********
   */
  async deleteareuserction(channel_id: string, message_id: string, emoji: string, user_id: string) {
    return this.request({
      method: 'DELETE',
      url: `/channels/ ${channel_id} /messages/ ${message_id} /reactions/${emoji}/${user_id}`
    }).then(res => res?.data)
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
    }).then(res => res?.data)
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
    }).then(res => res?.data)
  }
  /**
   * *********
   * 删除表情符号的所有反应
   * *********
   */
  async deleteAllreactionforEmoji(channel_id: string, message_id: string, emoji: string) {
    return this.request({
      method: 'DELETE',
      url: `/channels/ ${channel_id} /messages/ ${message_id} /reactions/${emoji}`
    }).then(res => res?.data)
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
    }).then(res => res?.data)
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
    }).then(res => res?.data)
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
    }).then(res => res?.data)
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
    }).then(res => res?.data)
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
    }).then(res => res?.data)
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
    }).then(res => res?.data)
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
    }).then(res => res?.data)
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
    }).then(res => res?.data)
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
    }).then(res => res?.data)
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
    }).then(res => res?.data)
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
    }).then(res => res?.data)
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
    }).then(res => res?.data)
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
    }).then(res => res?.data)
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
    }).then(res => res?.data)
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
    }).then(res => res?.data)
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
    }).then(res => res?.data)
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
    }).then(res => res?.data)
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
    }).then(res => res?.data)
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
    }).then(res => res?.data)
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
    }).then(res => res?.data)
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
    }).then(res => res?.data)
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
    }).then(res => res?.data)
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
    }).then(res => res?.data)
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
    }).then(res => res?.data)
  }

  /**
   *
   */
  async interactionsCallback(id: string, token: string, content: string) {
    return this.request({
      method: 'POST',
      url: `/interactions/${id}/${token}/callback`,
      data: {
        type: 4, // CHANNEL_MESSAGE_WITH_SOURCE
        data: {
          content: content,
          flags: 64 // EPHEMERAL（仅发送者可见）
        }
      }
    }).then(res => res.data)
  }
}
