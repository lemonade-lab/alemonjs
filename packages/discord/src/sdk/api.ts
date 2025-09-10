import FormData from 'form-data';
import axios from 'axios';
import { type AxiosRequestConfig } from 'axios';
import { Readable } from 'stream';
import { MessageData } from './typings.js';
import { getDiscordConfig } from '../config.js';
import { HttpsProxyAgent } from 'https-proxy-agent';
import { createPicFrom } from './createPicFrom.js';
export const API_URL = 'https://discord.com/api/v10';
export const CDN_URL = 'https://cdn.discordapp.com';

function filterHeaders(headers) {
  if (!headers) {
    return headers;
  }
  const filtered = {};
  const sensitiveKeys = [/^authorization$/i, /^cookie$/i, /^set-cookie$/i, /token/i, /key/i, /jwt/i, /^session[-_]id$/i, /^uid$/i, /^user[-_]id$/i];

  for (const key in headers) {
    if (/^_/.test(key)) {
      continue; // 跳过 _ 开头
    }
    // 如果是敏感字段全部替换为 ******
    if (sensitiveKeys.some(re => re.test(key))) {
      filtered[key] = '******';
    } else {
      filtered[key] = headers[key];
    }
  }

  return filtered;
}

/**
 * api接口
 */
export class DCAPI {
  /**
   * 基础请求
   * @param opstion
   * @returns
   */
  request(options: AxiosRequestConfig): Promise<any> {
    const value = getDiscordConfig();
    const token = value.token;
    const requestConfig = value.request_config || {};

    if (value.request_proxy) {
      requestConfig.httpsAgent = new HttpsProxyAgent(value.request_proxy);
    }
    const service = axios.create({
      ...requestConfig,
      baseURL: API_URL,
      timeout: 6000,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bot ${token}`
      }
    });

    return new Promise((resolve, reject) => {
      service(options)
        .then(res => resolve(res?.data ?? {}))
        .catch(err => {
          // 错误时的请求头
          logger.error('[axios] error', {
            config: {
              headers: filterHeaders(err?.config?.headers),
              params: err?.config?.params,
              data: err?.config?.data
            },
            response: err?.response,
            message: err?.message
          });
          // 丢出错误中携带的响应数据
          reject(err?.response?.data);
        });
    });
  }

  /**
   * cdn基础请求
   * @param options
   * @returns
   */
  requestCDN(options: AxiosRequestConfig) {
    return this.request({
      baseURL: CDN_URL,
      ...options
    });
  }

  /**
   * 创建用户url地址
   * @param user_id
   * @param avatar_hash
   * @returns
   */
  userAvatar(user_id: string, avatar_hash: string) {
    return `${CDN_URL}/avatars/${user_id}/${avatar_hash}.png`;
  }

  /**
   *
   * @param user_id
   * @param avatar_hash
   * @returns
   */
  getUserUrl(user_id: string, avatar_hash: string) {
    const url = `/avatars/${user_id}/${avatar_hash}.png`;

    return this.requestCDN({
      url: url,
      method: 'get'
    });
  }

  /**
   *
   * @param channel_id
   * @param data
   * @param headers
   * @returns
   */
  async channelsMessagesForm(channel_id: string, param: MessageData = {}, img?: string | Buffer | Readable) {
    const formData = new FormData();

    for (const key in param) {
      if (param[key]) {
        formData.append(key, param[key]);
      }
    }
    if (img) {
      const from = await createPicFrom(img);

      if (from) {
        const { picData, name } = from;

        formData.append('file', picData, name);
      }
    }

    return this.request({
      method: 'post',
      url: `channels/${channel_id}/messages`,
      data: formData,
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
  }

  /**
   *
   * @param channel_id
   * @param data
   * @param headers
   * @returns
   */
  channelsMessages(channel_id: string, data: MessageData = {}) {
    return this.request({
      method: 'post',
      url: `channels/${channel_id}/messages`,
      data: data
    });
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
    const from = await createPicFrom(image, Name);

    if (!from) {
      return false;
    }
    const { picData, name } = from;
    const formdata = new FormData();

    formdata.append('msg_id', msg_id);
    if (typeof content === 'string') {
      formdata.append('content', content);
    }
    formdata.append('file_image', picData, name);

    return formdata;
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
      msg_id: string;
      image: Buffer;
      content?: string;
      name?: string;
    }
  ): Promise<any> {
    const formdata = await this.createFrom(message.image, message.msg_id, message.content, message.name);
    const dary = formdata !== false ? formdata.getBoundary() : '';

    return this.request({
      method: 'post',
      url: `/channels/${channel_id}/messages`,
      headers: {
        'Content-Type': `multipart/form-data; boundary=${dary}`
      },
      data: formdata
    });
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
  applicationRoleConnectionsMetadata(application_id: string) {
    return this.request({
      method: 'get',
      url: `/applications/${application_id}/role-connections/metadata`
    });
  }
  /**
   *
   * 更新应用程序角色连接元数据记录
   */
  applicationRoleConnectionsMetadataUpdate(application_id: string) {
    return this.request({
      method: 'put',
      url: `/applications/${application_id}/role-connections/metadata`
    });
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
  usersMe() {
    return this.request({
      method: 'get',
      url: '/users/@me'
    });
  }

  /**
   * 根据id获取用户详情
   * @param message
   * @returns
   */
  userMessage(user_id: string) {
    return this.request({
      method: 'get',
      url: `/users/${user_id}`
    });
  }

  /**
   * 获取当前用户频道
   * @param params :{获取该频道 Id 之前的频道,获取该频道Id后的频道,返回的最大频道数量 (1-200),在响应中包括大概的成员和存在计数 }
   * @returns
   */
  usersMeGuilds(
    params: {
      before: string;
      after: string;
      limit: number;
      with_counts: boolean;
    } | null
  ) {
    return this.request({
      method: 'get',
      url: '/users/@me/guilds',
      params
    });
  }
  /**
   * *********
   * 获取当前用户频道成员
   * *********
   */
  usersMeGuildsMember(guild_id: string) {
    return this.request({
      method: 'get',
      url: `/users/@me/guilds/${guild_id}/member`
    });
  }
  /**
   * *********
   * 获取频道成员
   * *********
   */
  guildsMember(guild_id: string) {
    return this.request({
      method: 'get',
      url: `/guilds/${guild_id}/member`
    });
  }
  /**
   * *********
   * 离开频道
   * *********
   */
  usersMeGuildsDelete(guild_id: string) {
    return this.request({
      method: 'DELETE',
      url: `/users/@me/guilds/${guild_id}`
    });
  }
  /**
   * *********
   * 创建DM
   * *********
   */
  userMeChannels(recipient_id: string) {
    return this.request({
      method: 'post',
      url: '/user/@me/channels',
      data: {
        recipient_id
      }
    });
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
  applicationsMe() {
    return this.request({
      method: 'GET',
      url: '/applications/@me'
    });
  }

  /**
   * *********
   * 编辑当前应用程序
   * *********
   */
  applicationsMeUpdate() {
    return this.request({
      method: 'PATCH',
      url: '/applications/@me'
    });
  }

  /**
   * *********
   * 获取当前用户连接
   * *********
   */
  usersMeConnections() {
    return this.request({
      method: 'GET',
      url: '/users/@me/connections'
    });
  }
  /**
   * *********
   * 获取当前用户应用程序角色连接
   * *********
   */
  usersMeApplicationsRoleConnection(application_id: string) {
    return this.request({
      method: 'GET',
      url: `/users/@me/applications/${application_id}/role-connection`
    });
  }
  /**
   * *********
   * 更新当前用户应用程序角色连接
   * *********
   */
  usersMeApplicationsRoleConnectionUpdate(application_id: string) {
    return this.request({
      method: 'PUT',
      url: `/users/@me/applications/${application_id}/role-connection`
    });
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
  guildsCreate() {
    return this.request({
      method: 'post',
      url: '/guilds'
    });
  }
  /**
   * *********
   * 获取频道
   * *********
   */
  guild(guild_id: string) {
    return this.request({
      method: 'get',
      url: `/guilds/${guild_id}`
    });
  }
  /**
   * *********
   * 获取频道预览
   * *********
   */
  guildsPreview(guild_id: string) {
    return this.request({
      method: 'get',
      url: `/guilds/${guild_id}/preview`
    });
  }
  /**
   * *********
   * 修改频道
   * *********
   */
  guildsUpdate(guild_id: string) {
    return this.request({
      method: 'PATCH',
      url: `/guilds/${guild_id}`
    });
  }

  /**
   * *********
   * 删除频道
   * *********
   */
  guildsDelete(guild_id: string) {
    return this.request({
      method: 'DELETE',
      url: `/guilds/${guild_id}`
    });
  }
  /**
   * *********
   * 列出活跃的频道线程
   * *********
   */
  guildsThreadsActive(guild_id: string) {
    return this.request({
      method: 'get',
      url: `/guilds/${guild_id}/threads/active`
    });
  }
  /**
   * *********
   * 获取频道成员消息
   * *********
   */
  getGuildMember(guild_id: string, user_id: string) {
    return this.request({
      method: 'get',
      url: `/guilds/${guild_id}/members/${user_id}`
    });
  }
  /**
   * *********
   * 列出频道成员
   * *********
   */
  guildsMembers(guild_id: string) {
    return this.request({
      method: 'get',
      url: `/guilds/${guild_id}/members`
    });
  }
  /**
   * *********
   * 搜索频道成员
   * *********
   */
  guildsMembersSearch(guild_id: string) {
    return this.request({
      method: 'get',
      url: `/guilds/${guild_id}/members/search`
    });
  }
  /**
   * *********
   * 添加频道成员
   * *********
   */
  guildsMembersAdd(guild_id: string, user_id: string) {
    return this.request({
      method: 'put',
      url: `/guilds/${guild_id}/members/${user_id}`
    });
  }

  /**
   * *********
   * 修改频道成员
   * *********
   */
  guildsMembersUpdate(guild_id: string, user_id: string) {
    return this.request({
      method: 'PATCH',
      url: `/guilds/${guild_id}/members/${user_id}`
    });
  }

  /**
   * *********
   * 修改当前成员
   * *********
   */
  guildsMembersMeNick(guild_id: string) {
    return this.request({
      method: 'PATCH',
      url: `/guilds/${guild_id}/members/@me/nick`
    });
  }
  /**
   * *********
   * 修改当前用户昵称
   * *********
   */
  guildsMembersMeNickUpdate(guild_id: string) {
    return this.request({
      method: 'PATCH',
      url: `/guilds/${guild_id}/members/@me/nick`
    });
  }
  /**
   * *********
   * 获取频道角色
   * *********
   */
  guildsRoles(guild_id: string) {
    return this.request({
      method: 'get',
      url: `/guilds/${guild_id}/roles`
    });
  }
  /**
   * *********
   * 创建频道角色
   * *********
   */
  guildsRolesCreate(guild_id: string) {
    return this.request({
      method: 'post',
      url: `/guilds/${guild_id}/roles`
    });
  }
  /**
   * *********
   * 修改频道角色位置
   * *********
   */
  guildsRolesUpdate(guild_id: string) {
    return this.request({
      method: 'PATCH',
      url: `/guilds/${guild_id}/roles`
    });
  }
  /**
   * *********
   * 修改频道角色
   * *********
   */
  guildsRolesUpdateById(guild_id: string, role_id: string) {
    return this.request({
      method: 'PATCH',
      url: `/guilds/${guild_id}/roles/${role_id}`
    });
  }
  /**
   * *********
   * 添加频道成员角色
   * *********
   */
  guildsMEmbersRolesAdd(guild_id: string, user_id: string, role_id: string) {
    return this.request({
      method: 'put',
      url: `/guilds/${guild_id}/members/${user_id}/roles/${role_id}`
    });
  }
  /**
   * *********
   * 删除频道成员角色
   * *********
   */
  guildsMembersRolesDelete(guild_id: string, user_id: string, role_id: string) {
    return this.request({
      method: 'DELETE',
      url: `/guilds/${guild_id}/members/${user_id}/roles/${role_id}`
    });
  }
  /**
   * *********
   * 删除频道角色
   * *********
   */
  guildsRolesDelete(guild_id: string, role_id: string) {
    return this.request({
      method: 'DELETE',
      url: `/guilds/${guild_id}/roles/${role_id}`
    });
  }
  /**
   * *********
   * 删除频道成员
   * *********
   */
  guildsMembersDelete(guild_id: string, user_id: string) {
    return this.request({
      method: 'DELETE',
      url: `/guilds/${guild_id}/members/${user_id}`
    });
  }
  /**
   * *********
   * 获取频道禁令
   * *********
   */
  guildsBans(guild_id: string) {
    return this.request({
      method: 'get',
      url: `/guilds/${guild_id}/bans`
    });
  }
  /**
   * *********
   * 获得频道禁令
   * *********
   */
  guildsBansDelete(guild_id: string, user_id: string) {
    return this.request({
      method: 'DELETE',
      url: `/guilds/${guild_id}/bans/${user_id}`
    });
  }

  /**
   * *********
   * 创建频道禁令
   * *********
   */
  guildsBansCreateByUserId(guild_id: string, user_id: string) {
    return this.request({
      method: 'PUT',
      url: `/guilds/${guild_id}/bans/${user_id}`
    });
  }
  /**
   * *********
   * 解除频道禁令
   * *********
   */
  guildsBansDeleteByUserId(guild_id: string, user_id: string) {
    return this.request({
      method: 'DELETE',
      url: `/guilds/${guild_id}/bans/${user_id}`
    });
  }
  /**
   * *********
   * 修改频道MFA级别
   * *********
   */
  guildsMfa(guild_id: string) {
    return this.request({
      method: 'post',
      url: `/guilds/${guild_id}/mfa`
    });
  }
  /**
   * *********
   * 获取频道修剪数量
   * *********
   */
  guildsPrune(guild_id: string) {
    return this.request({
      method: 'get',
      url: `/guilds/${guild_id}/prune`
    });
  }
  /**
   * *********
   * 开始频道修剪
   * *********
   */
  guildsPruneUpdate(guild_id: string) {
    return this.request({
      method: 'post',
      url: `/guilds/${guild_id}/prune`
    });
  }
  /**
   * *********
   * 获取频道邀请
   * *********
   */
  guildsInvites(guild_id: string) {
    return this.request({
      method: 'get',
      url: `/guilds/${guild_id}/invites`
    });
  }
  /**
   * *********
   * 获取频道集成
   * *********
   */
  guildsIntegrations(guild_id: string) {
    return this.request({
      method: 'get',
      url: `/guilds/${guild_id}/integrations`
    });
  }
  /**
   * *********
   * 删除频道集成
   * *********
   */
  guildsDeleteByIntegrationsId(guild_id: string, integration_id: string) {
    return this.request({
      method: 'DELETE',
      url: `/guilds/${guild_id}/${integration_id}`
    });
  }
  /**
   * *********
   * 获取频道小部件设置
   * *********
   */
  guildsWidget(guild_id: string) {
    return this.request({
      method: 'get',
      url: `/guilds/${guild_id}/widget`
    });
  }
  /**
   * *********
   * 修改频道小部件
   * *********
   */
  guildsWidgetUpdate(guild_id: string) {
    return this.request({
      method: 'PATCH',
      url: `/guilds/${guild_id}/widget`
    });
  }
  /**
   * *********
   * 获取频道小部件
   * *********
   */
  guildsWidgetJSON(guild_id: string) {
    return this.request({
      method: 'get',
      url: `/guilds/${guild_id}/widget.json`
    });
  }
  /**
   * *********
   * 获取频道个性网址
   * *********
   */
  guildVanityUrl(guild_id: string) {
    return this.request({
      method: 'get',
      url: `/guilds/${guild_id}/vanity-url`
    });
  }
  /**
   * *********
   * 获取频道小部件图像
   * *********
   */
  guildsWidgetPNG(guild_id: string) {
    return this.request({
      method: 'get',
      url: `/guilds/${guild_id}/widget.png`
    });
  }
  /**
   * *********
   * 获取频道欢迎屏幕
   * *********
   */
  guildsWelconScreen(guild_id: string) {
    return this.request({
      method: 'get',
      url: `/guilds/${guild_id}/welcome-screen`
    });
  }
  /**
   * *********
   * 修改频道欢迎界面
   * *********
   */
  guildsWelconmeScreen(guild_id: string) {
    return this.request({
      method: 'PATCH',
      url: `/guilds/${guild_id}/welcome-screen`
    });
  }
  /**
   * *********
   * 获取频道入职
   * *********
   */
  guildsOnboarding(guild_id: string) {
    return this.request({
      method: 'get',
      url: `/guilds/${guild_id}/onboarding`
    });
  }
  /**
   * *********
   * 修改频道入职
   * *********
   */
  guildsOnboardingUpdate(guild_id: string) {
    return this.request({
      method: 'PUT',
      url: `/guilds/${guild_id}/onboarding`
    });
  }
  /**
   * *********
   * 获取公会审核日志
   * *********
   */
  guildsAuditLogs(guild_id: string) {
    return this.request({
      method: 'get',
      url: `/guilds/${guild_id}/audit-logs`
    });
  }
  /**
   * *********
   * 获取自动审核规则
   * *********
   */
  guildsAutoModerationsRules(guild_id: string, auto_moderation_rule_id: string) {
    return this.request({
      method: 'get',
      url: `/guilds/${guild_id}/auto-moderation/rules/${auto_moderation_rule_id}`
    });
  }
  /**
   * *********
   * 创建自动审核规则
   * *********
   */
  guildsAutoModerationRulesCreate(guild_id: string) {
    return this.request({
      method: 'POST',
      url: `/guilds/${guild_id}/auto-moderation/rules`
    });
  }
  /**
   * *********
   * 修改自动审核规则
   * *********
   */
  guildsAutoModerationsRulesUpdate(guild_id: string, auto_moderation_rule_id: string) {
    return this.request({
      method: 'PATCH',
      url: `/guilds/${guild_id}/auto-moderation/rules/${auto_moderation_rule_id}`
    });
  }
  /**
   * *********
   * 删除自动审核规则
   * *********
   */
  guildsAutoModerationsRulesDelete(guild_id: string, auto_moderation_rule_id: string) {
    return this.request({
      method: 'DELETE',
      url: `/guilds/${guild_id}/auto-moderation/rules/${auto_moderation_rule_id}`
    });
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
  guildsanyChannels(guild_id: string) {
    return this.request({
      method: 'get',
      url: `/guilds/${guild_id}/channels`
    });
  }
  /**
   * *********
   * 获取子频道
   * *********
   */
  guildsChannels(channel_id: string) {
    return this.request({
      method: 'get',
      url: `/channels/${channel_id}`
    });
  }
  /**
   * *********
   * 修改子频道
   * *********
   */
  guildsChannelsUpdate(channel_id: string) {
    return this.request({
      method: 'PATCH',
      url: `/channels/${channel_id}`
    });
  }
  /**
   * *********
   * 删除子频道
   * *********
   */
  guildsChannelsDELETE(channel_id: string) {
    return this.request({
      method: 'DELETE',
      url: `/channels/${channel_id}`
    });
  }
  /**
   * *********
   * 创建子频道
   * *********
   */
  guildsChannelsCreate(guild_id: string) {
    return this.request({
      method: 'post',
      url: `/guilds/${guild_id}/channels`
    });
  }
  /**
   * *********
   * 修改子频道位置
   * *********
   */
  guildsChannelsUpdateposi(guild_id: string) {
    return this.request({
      method: 'PATCH',
      url: `/guilds/${guild_id}/channels`
    });
  }

  /**
   * *********
   * 获取频道邀请
   * *********
   */
  getChannelInvites(channel_id: string) {
    return this.request({
      method: 'get',
      url: `/channels/${channel_id}/invites`
    });
  }
  /**
   * *********
   * 创建频道邀请
   * *********
   */
  createChannelInvites(channel_id: string) {
    return this.request({
      method: 'POST',
      url: `/channels/${channel_id}/invites`
    });
  }
  /**
   * *********
   * 删除频道邀请
   * *********
   */
  deleteChannelInvites(channel_id: string) {
    return this.request({
      method: 'POST',
      url: `/channels/${channel_id}/invites`
    });
  }

  /**
   * *********
   *触发输入指示器
   * *********
   */
  triggerTypingIndicator(channel_id: string) {
    return this.request({
      method: 'POST',
      url: `/channels/${channel_id}/typing`
    });
  }

  /**
   * *********
   *群组 DM 添加收件人
   * *********
   */
  groupDMAddRecipient(channel_id: string, user_id: string) {
    return this.request({
      method: 'put',
      url: `/channels/${channel_id}/recipients/${user_id}`
    });
  }
  /**
   * *********
   *群组DM删除收件人
   * *********
   */
  groupDMdeleteRecipient(channel_id: string, user_id: string) {
    return this.request({
      method: 'delete',
      url: `/channels/${channel_id}/recipients/${user_id}`
    });
  }
  /**
   * *********
   *启动消息开始线程
   * *********
   */
  startThreadfromMessage(channel_id: string, message_id: string) {
    return this.request({
      method: 'post',
      url: `/channels/${channel_id}/messages/${message_id}/threads`
    });
  }
  /**
   * *********
   *启动没有消息的线程
   * *********
   */
  startThreadwithoutMessag(channel_id: string) {
    return this.request({
      method: 'post',
      url: `/channels/${channel_id}/threads`
    });
  }
  /**
   * *********
   *在论坛或媒体频道中启动话题
   * *********
   */
  startThreadinForum(channel_id: string) {
    return this.request({
      method: 'post',
      url: `/channels/${channel_id}/threads`
    });
  }
  /**
   * *********
   *加入话题
   * *********
   */
  joinThread(channel_id: string) {
    return this.request({
      method: 'PUT',
      url: `/channels/${channel_id}/thread-members/@me`
    });
  }
  /**
   * *********
   *添加话题成员
   * *********
   */
  addThreadMember(channel_id: string, user_id: string) {
    return this.request({
      method: 'PUT',
      url: `/channels/${channel_id}/thread-members/${user_id}`
    });
  }
  /**
   * *********
   *删除话题
   * *********
   */
  leavethread(channel_id: string) {
    return this.request({
      method: 'delete',
      url: `/channels/${channel_id}/thread-members/@me`
    });
  }
  /**
   * *********
   *删除线程成员
   * *********
   */
  removeThreadMember(channel_id: string, user_id: string) {
    return this.request({
      method: 'delete',
      url: `/channels/${channel_id}/thread-members/${user_id}`
    });
  }
  /**
   * *********
   *获取线程成员
   * *********
   */
  getThreadMember(channel_id: string, user_id: string) {
    return this.request({
      method: 'get',
      url: `/channels/${channel_id}/thread-members/${user_id}`
    });
  }
  /**
   * *********
   *列出线程成员
   * *********
   */
  listThreadMembers(channel_id: string) {
    return this.request({
      method: 'get',
      url: `/channels/${channel_id}/thread-members`
    });
  }
  /**
   * *********
   *列出公共存档主题
   * *********
   */
  listPublicArchivedThread(channel_id: string) {
    return this.request({
      method: 'get',
      url: `/channels/${channel_id}/threads/archived/public`
    });
  }
  /**
   * *********
   *列出私有存档线程
   * *********
   */
  listPrivateArchivedThreads(channel_id: string) {
    return this.request({
      method: 'get',
      url: `/channels/${channel_id}/threads/archived/private`
    });
  }
  /**
   * *********
   *列出已加入的私人存档主题
   * *********
   */
  listoinedPrivateThreads(channel_id: string) {
    return this.request({
      method: 'get',
      url: `/channels/${channel_id}/users/@me/threads/archived/private`
    });
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
  editChannelPermissions(channel_id: string, overwrite_id: string) {
    return this.request({
      method: 'PATCH',
      url: `/channels/${channel_id}/permissions/${overwrite_id}`
    });
  }
  /**
   * *********
   * 删除频道权限
   * *********
   */
  deleteChannelPermissions(channel_id: string, overwrite_id: string) {
    return this.request({
      method: 'delete',
      url: `/channels/${channel_id}/permissions/${overwrite_id}`
    });
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
  guildsChannelsanymessages(channel_id: string) {
    return this.request({
      method: 'get',
      url: `/channels/${channel_id}/messages`
    });
  }
  /**
   * *********
   * 获取单条子频道消息
   * *********
   */
  guildsChannelsmessages(channel_id: string, message_id: string) {
    return this.request({
      method: 'get',
      url: `/channels/${channel_id}/messages/${message_id}`
    });
  }
  /**
   * *********
   * 创建子频道消息
   * *********
   */
  guildsChannelscreatmess(channel_id: string) {
    return this.request({
      method: 'post',
      url: `/channels/${channel_id}/messages`
    });
  }
  /**
   * *********
   * 交叉发布消息
   * *********
   */
  crosspostmessages(channel_id: string, message_id: string) {
    return this.request({
      method: 'POST',
      url: `/channels/${channel_id}/messages/${message_id}/crosspost`
    });
  }

  /**
   * *********
   * 创造反应
   * *********
   */
  createareaction(channel_id: string, message_id: string, emoji: string) {
    return this.request({
      method: 'PUT',
      url: `/channels/${channel_id}/messages/${message_id}/reactions/${emoji}/@me`
    });
  }
  /**
   * *********
   * 删除自己的反应
   * *********
   */
  deleteownreaction(channel_id: string, message_id: string, emoji: string) {
    return this.request({
      method: 'DELETE',
      url: `/channels/${channel_id}/messages/${message_id}/reactions/${emoji}/@me`
    });
  }
  /**
   * *********
   * 删除别人的反应
   * *********
   */
  deleteareuserction(channel_id: string, message_id: string, emoji: string, user_id: string) {
    return this.request({
      method: 'DELETE',
      url: `/channels/${channel_id}/messages/${message_id}/reactions/${emoji}/${user_id}`
    });
  }
  /**
   * *********
   * 获取反应
   * *********
   */
  getownreaction(channel_id: string, message_id: string, emoji: string) {
    return this.request({
      method: 'get',
      url: `/channels/${channel_id}/messages/${message_id}/reactions/${emoji}`
    });
  }
  /**
   * *********
   * 删除所有反应
   * *********
   */
  deleteAllreaction(channel_id: string, message_id: string) {
    return this.request({
      method: 'DELETE',
      url: `/channels/${channel_id}/messages/${message_id}/reactions`
    });
  }
  /**
   * *********
   * 删除表情符号的所有反应
   * *********
   */
  deleteAllreactionforEmoji(channel_id: string, message_id: string, emoji: string) {
    return this.request({
      method: 'DELETE',
      url: `/channels/${channel_id}/messages/${message_id}/reactions/${emoji}`
    });
  }
  /**
   * *********
   * 编辑消息
   * *********
   */
  editMessage(channel_id: string, message_id: string) {
    return this.request({
      method: 'PATCH',
      url: `/channels/${channel_id}/messages/${message_id}`
    });
  }
  /**
   * *********
   * 撤回消息
   * *********
   */
  deleteMessage(channel_id: string, message_id: string) {
    return this.request({
      method: 'PATCH',
      url: `/channels/${channel_id}/messages/${message_id}`
    });
  }
  /**
   * *********
   * 批量删除消息
   * *********
   */
  bulkdeleteMessage(channel_id: string) {
    return this.request({
      method: 'post',
      url: `/channels/${channel_id}/messages/bulk-delete`
    });
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
  followAnnouncementChannel(channel_id: string) {
    return this.request({
      method: 'POST',
      url: `/channels/${channel_id}/followers`
    });
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
  getPinnedMessages(channel_id: string) {
    return this.request({
      method: 'get',
      url: `/channels/${channel_id}/pins`
    });
  }

  /**
   * *********
   *置顶消息
   * *********
   */
  pinMessage(channel_id: string, message_id: string) {
    return this.request({
      method: 'put',
      url: `/channels/${channel_id}/${message_id}`
    });
  }
  /**
   * *********
   *取消置顶消息
   * *********
   */
  deletepinMessage(channel_id: string, message_id: string) {
    return this.request({
      method: 'delete',
      url: `/channels/${channel_id}/${message_id}`
    });
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
  getsticker(sticker_id: string) {
    return this.request({
      method: 'get',
      url: `/stickers/${sticker_id}`
    });
  }
  /**
   * *********
   *列出贴纸包
   * *********
   */
  listStickerPacks() {
    return this.request({
      method: 'get',
      url: '/stickers'
    });
  }
  /**
   * *********
   *列出公会贴纸
   * *********
   */
  listGuildStickers(sticker_id: string) {
    return this.request({
      method: 'get',
      url: `/stickers/${sticker_id}/stickers`
    });
  }
  /**
   * *********
   *获取公会贴纸
   * *********
   */
  getGuildSticker(guild_id: string, sticker_id: string) {
    return this.request({
      method: 'get',
      url: `/guilds/${guild_id}/stickers/${sticker_id}`
    });
  }
  /**
   * *********
   *创建公会贴纸
   * *********
   */
  createGuildSticker(guild_id: string) {
    return this.request({
      method: 'post',
      url: `/guilds/${guild_id}/stickers`
    });
  }
  /**
   * *********
   *修改公会贴纸
   * *********
   */
  modifyGuildSticker(guild_id: string, sticker_id: string) {
    return this.request({
      method: 'PATCH',
      url: `/guilds/${guild_id}/stickers/${sticker_id}`
    });
  }
  /**
   * *********
   *删除公会贴纸
   * *********
   */
  deleteGuildSticker(guild_id: string, sticker_id: string) {
    return this.request({
      method: 'delete',
      url: `/guilds/${guild_id}/stickers/${sticker_id}`
    });
  }
  /**
   * *********
   *列出公会表情符号
   * *********
   */
  listGuildEmojis(guild_id: string) {
    return this.request({
      method: 'get',
      url: `/guilds/${guild_id}/emojis`
    });
  }
  /**
   * *********
   *获取公会表情符号
   * *********
   */
  getGuildEmoji(guild_id: string, emoji_id: string) {
    return this.request({
      method: 'get',
      url: `/guilds/${guild_id}/emojis/${emoji_id}`
    });
  }
  /**
   * *********
   *创建公会表情符号
   * *********
   */
  createGuildEmoji(guild_id: string) {
    return this.request({
      method: 'post',
      url: `/guilds/${guild_id}/emojis`
    });
  }
  /**
   * *********
   *修改公会表情
   * *********
   */
  modifyGuildEmoji(guild_id: string, emoji_id: string) {
    return this.request({
      method: 'PATCH',
      url: `/guilds/${guild_id}/emojis/${emoji_id}`
    });
  }
  /**
   * *********
   *删除公会表情符号
   * *********
   */
  deleteGuildEmoji(guild_id: string, emoji_id: string) {
    return this.request({
      method: 'delete',
      url: `/guilds/${guild_id}/emojis/${emoji_id}`
    });
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
  listVoiceRegions() {
    return this.request({
      method: 'get',
      url: '/voice/regions'
    });
  }

  /**
   * *********
   * 获取频道语音区域
   * *********
   */
  guildsRegions(guild_id: string) {
    return this.request({
      method: 'get',
      url: `/guilds/${guild_id}/regions`
    });
  }
  /**
   * *********
   * 修改当前用户语音状态
   * *********
   */
  guildsVoiveStatesMe(guild_id: string) {
    return this.request({
      method: 'PATCH',
      url: `/guilds/${guild_id}/voice-states/@me`
    });
  }
  /**
   * *********
   * 修改用户语音状态
   * *********
   */
  guildsVoiceStatesUpdate(guild_id: string, user_id: string) {
    return this.request({
      method: 'PATCH',
      url: `/guilds/${guild_id}/voice-states/${user_id}`
    });
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

  gateway() {
    return this.request({
      method: 'get',
      url: '/gateway'
    }) as Promise<{
      url: string;
    }>;
  }

  /**
   *
   */
  interactionsCallback(id: string, token: string, content: string) {
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
    });
  }
}
