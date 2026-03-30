import axios, { type AxiosRequestConfig } from 'axios';
import FormData from 'form-data';
import { Readable } from 'stream';
import { ApiEnum, SendMessageParams, SendDirectMessageParams } from './typings.js';
import { config } from './config.js';
import { createPicFrom } from 'alemonjs/utils';
import { createAxiosInstance } from './instance.js';

export const API_URL = 'https://www.kookapp.cn';

/**
 * api接口
 */
export class KOOKAPI {
  /**
   * KOOK服务
   * @param config
   * @returns
   */
  service(opstoin: AxiosRequestConfig) {
    const token = config.get('token');
    const req = axios.create({
      baseURL: API_URL,
      timeout: 30000,
      headers: {
        Authorization: `Bot ${token}`
      }
    });

    return createAxiosInstance(req, opstoin);
  }

  /**
   *
   * @returns
   */
  gateway() {
    return this.service({
      baseURL: 'https://www.kookapp.cn/api/v3/gateway/index',
      method: 'get',
      params: {
        compress: 0
      }
    });
  }

  /**
   * ************
   * 资源床单
   * ***********
   */

  /**
   * 发送buffer资源
   * @param id 私信传频道id,公信传子频道id
   * @param message {消息编号,图片,内容}
   * @returns
   */
  async postImage(file: string | Buffer | Readable, Name = 'image.jpg') {
    const from = await createPicFrom({
      image: file,
      name: Name
    });

    if (!from) {
      return false;
    }
    const { picData, name } = from;
    const formdata = new FormData();

    formdata.append('file', picData, name);
    const url = await this.createUrl(formdata);

    if (url) {
      return url;
    }

    return false;
  }

  /**
   * 发送buffer资源
   * @param id 私信传频道id,公信传子频道id
   * @param message {消息编号,图片,内容}
   * @returns
   */
  async postFile(file: Buffer, Name = 'image.jpg') {
    const formdata = new FormData();

    formdata.append('file', [file], Name);
    const url = await this.createUrl(formdata);

    if (url) {
      return url;
    }

    return false;
  }

  /**
   * 转存
   * @param formdata
   * @returns
   */
  async createUrl(formdata): Promise<{
    data: { url: string };
  }> {
    return await this.service({
      method: 'post',
      url: ApiEnum.AssetCreate,
      data: formdata,
      headers: formdata.getHeaders()
    });
  }

  /**
   * *********
   * 消息api
   * *********
   */

  /**
   * 创建消息
   * @param data
   * @returns
   */
  async createMessage(data: SendMessageParams): Promise<{
    data: {
      msg_id: string;
      msg_timestamp: number;
      nonce: string;
    };
  }> {
    return await this.service({
      method: 'post',
      url: ApiEnum.MessageCreate,
      data
    });
  }

  /**
   * 创建私聊消息
   */

  /**
   * 创建消息
   * @param target_id
   * @returns
   */
  userChatCreate(target_id: string): Promise<{
    data: {
      code: string;
      last_read_time: number;
      latest_msg_time: number;
      unread_count: number;
      is_friend: boolean;
      is_blocked: boolean;
      is_target_blocked: boolean;
      target_info: {
        id: string;
        username: string;
        online: boolean;
        avatar: string;
      };
    };
  }> {
    return this.service({
      method: 'post',
      url: ApiEnum.UserChatCreate,
      data: {
        target_id
      }
    });
  }

  /**
   * 创建消息
   * @param data
   * @returns
   */
  createDirectMessage(data: SendDirectMessageParams): Promise<{
    data: {
      msg_id: string;
      msg_timestamp: number;
      nonce: string;
    };
  }> {
    return this.service({
      method: 'post',
      url: ApiEnum.DirectMessageCreate,
      data
    });
  }

  /**
   * 删除指定消息
   * @param msg_id
   * @returns
   */
  messageDelete(msg_id: string): Promise<{
    data: {
      code: number;
      message: string;
      data: any[];
    };
  }> {
    return this.service({
      method: 'post',
      url: ApiEnum.MessageDelete,
      data: {
        msg_id
      }
    });
  }

  /**
   * 重编辑指定消息
   * @param data
   * @returns
   */
  messageUpdate(data: { msg_id: string; content: any; quote?: string; temp_target_id?: string }): Promise<{
    data: {
      code: number;
      message: string;
      data: any[];
    };
  }> {
    return this.service({
      method: 'post',
      url: ApiEnum.MessageUpdate,
      data
    });
  }

  /**
   * 删回应
   * @param data
   * @returns
   */
  messageDeleteReaction(data: { msg_id: string; emoji: string; user_id: string }): Promise<{
    code: number;
    message: string;
    data: any[];
  }> {
    return this.service({
      method: 'post',
      url: ApiEnum.MessageDeleteReaction,
      data
    });
  }

  /**
   * 获取频道消息列表
   * @param target_id 频道 ID
   * @param params.msg_id 参考消息 ID
   * @param params.pin 是否查看置顶消息
   * @param params.flag before/after/around
   * @param params.page_size 每页数量
   */
  messageList(target_id: string, params?: { msg_id?: string; pin?: number; flag?: string; page_size?: number }): Promise<any> {
    return this.service({
      method: 'get',
      url: ApiEnum.MessageList,
      params: { target_id, ...params }
    });
  }

  /**
   * 发回应
   * @param data
   * @returns
   */
  messageAddReaction(data: { msg_id: string; emoji: string }): Promise<{
    code: number;
    message: string;
    data: any[];
  }> {
    return this.service({
      method: 'post',
      url: ApiEnum.MessageAddReaction,
      data
    });
  }

  /**
   * 某个回应的所有用户
   * @param data
   * @returns
   */
  messageReactionList(params: { msg_id: string; emoji: string }): Promise<{
    code: number;
    message: string;
    data: {
      id: string;
      username: string;
      identify_num: string;
      online: boolean;
      status: number;
      avatar: string;
      bot: boolean;
      tag_info: {
        color: string;
        text: string;
      };
      nickname: string;
      reaction_time: number;
    };
  }> {
    return this.service({
      method: 'get',
      url: ApiEnum.MessageReactionList,
      params
    });
  }

  /**
   * **********
   * user
   * *********
   */

  /**
   * 得到当前信息
   * @param guild_id
   * @param user_id
   * @returns
   */
  userMe(): Promise<{
    code: number;
    message: string;
    data: {
      id: string;
      username: string;
      identify_num: string;
      online: false;
      os: string;
      status: number;
      avatar: string;
      banner: string;
      bot: true;
      mobile_verified: true;
      client_id: string;
      mobile_prefix: string;
      mobile: string;
      invited_count: number;
    };
  }> {
    return this.service({
      method: 'get',
      url: ApiEnum.UserMe
    });
  }

  /**
   * 得到用户信息
   * @param guild_id
   * @param user_id
   * @returns
   */
  userView(
    guild_id: string,
    user_id: string
  ): Promise<{
    code: number;
    message: string;
    data: {
      id: string;
      username: string;
      identify_num: string;
      online: false;
      status: 0;
      bot: true;
      avatar: string;
      vip_avatar: string;
      mobile_verified: true;
      roles: number[];
      joined_at: number;
      active_time: number;
    };
  }> {
    return this.service({
      method: 'get',
      url: ApiEnum.UserView,
      params: {
        guild_id,
        user_id
      }
    });
  }

  /**
   * 踢出
   * @param guild_id
   * @param user_id
   * @returns
   */
  guildKickout(
    guild_id: string,
    user_id: string
  ): Promise<{
    code: number;
    message: string;
    data: any;
  }> {
    return this.service({
      method: 'post',
      url: ApiEnum.GuildKickout,
      data: {
        guild_id,
        target_id: user_id
      }
    });
  }

  /**
   * 创建角色
   * @param channel_id
   * @param type
   * @param value
   * @returns
   */
  channelRoleCreate(
    channel_id: string,
    type: string,
    value: string
  ): Promise<{
    code: number;
    message: string;
    data: any;
  }> {
    return this.service({
      method: 'post',
      url: ApiEnum.ChannelRoleCreate,
      data: {
        channel_id,
        type,
        value
      }
    });
  }

  // ─── 服务器（Guild） ───

  /** 获取服务器列表 */
  guildList(): Promise<any> {
    return this.service({
      method: 'get',
      url: ApiEnum.GuildList
    });
  }

  /** 获取服务器详情 */
  guildView(guild_id: string): Promise<any> {
    return this.service({
      method: 'get',
      url: ApiEnum.GuildView,
      params: { guild_id }
    });
  }

  /** 获取服务器成员列表 */
  guildUserList(
    guild_id: string,
    params?: {
      channel_id?: string;
      search?: string;
      role_id?: number;
      mobile_verified?: number;
      active_time?: number;
      joined_at?: number;
      page?: number;
      page_size?: number;
    }
  ): Promise<any> {
    return this.service({
      method: 'get',
      url: ApiEnum.GuildUserList,
      params: { guild_id, ...params }
    });
  }

  /** 退出服务器 */
  guildLeave(guild_id: string): Promise<any> {
    return this.service({
      method: 'post',
      url: ApiEnum.GuildLeave,
      data: { guild_id }
    });
  }

  /** 修改服务器昵称 */
  guildNickname(guild_id: string, nickname: string, user_id?: string): Promise<any> {
    return this.service({
      method: 'post',
      url: ApiEnum.GuildNickname,
      data: { guild_id, nickname, ...(user_id ? { user_id } : {}) }
    });
  }

  /** 服务器禁言（添加） */
  guildMuteCreate(guild_id: string, user_id: string, type: 1 | 2): Promise<any> {
    return this.service({
      method: 'post',
      url: ApiEnum.GuildMuteCreate,
      data: { guild_id, user_id, type }
    });
  }

  /** 服务器禁言（删除） */
  guildMuteDelete(guild_id: string, user_id: string, type: 1 | 2): Promise<any> {
    return this.service({
      method: 'post',
      url: ApiEnum.GuildMuteDelete,
      data: { guild_id, user_id, type }
    });
  }

  /** 获取指定消息 */
  messageView(msg_id: string): Promise<any> {
    return this.service({
      method: 'get',
      url: ApiEnum.MessageView,
      params: { msg_id }
    });
  }

  // ─── 频道（Channel） ───

  /** 获取频道列表 */
  channelList(guild_id: string): Promise<any> {
    return this.service({
      method: 'get',
      url: ApiEnum.ChannelList,
      params: { guild_id }
    });
  }

  /** 获取频道详情 */
  channelView(channel_id: string): Promise<any> {
    return this.service({
      method: 'get',
      url: ApiEnum.ChannelView,
      params: { target_id: channel_id }
    });
  }

  /** 创建频道 */
  channelCreate(data: { guild_id: string; name: string; type?: number; parent_id?: string; limit_amount?: number; voice_quality?: string }): Promise<any> {
    return this.service({
      method: 'post',
      url: ApiEnum.ChannelCreate,
      data
    });
  }

  /** 编辑频道 */
  channelUpdate(data: { channel_id: string; name?: string; topic?: string; slow_mode?: number }): Promise<any> {
    return this.service({
      method: 'post',
      url: ApiEnum.ChannelUpdate,
      data
    });
  }

  /** 删除频道 */
  channelDelete(channel_id: string): Promise<any> {
    return this.service({
      method: 'post',
      url: ApiEnum.ChannelDelete,
      data: { channel_id }
    });
  }

  // ─── 服务器角色（Guild Role） ───

  /** 获取服务器角色列表 */
  guildRoleList(guild_id: string): Promise<any> {
    return this.service({
      method: 'get',
      url: ApiEnum.GuildRoleList,
      params: { guild_id }
    });
  }

  /** 创建服务器角色 */
  guildRoleCreate(data: { guild_id: string; name?: string }): Promise<any> {
    return this.service({
      method: 'post',
      url: ApiEnum.GuildRoleCreate,
      data
    });
  }

  /** 更新服务器角色 */
  guildRoleUpdate(data: {
    guild_id: string;
    role_id: number;
    name?: string;
    color?: number;
    hoist?: 0 | 1;
    mentionable?: 0 | 1;
    permissions?: number;
  }): Promise<any> {
    return this.service({
      method: 'post',
      url: ApiEnum.GuildRoleUpdate,
      data
    });
  }

  /** 删除服务器角色 */
  guildRoleDelete(data: { guild_id: string; role_id: number }): Promise<any> {
    return this.service({
      method: 'post',
      url: ApiEnum.GuildRoleDelete,
      data
    });
  }

  /** 赋予用户角色 */
  guildRoleGrant(data: { guild_id: string; user_id: string; role_id: number }): Promise<any> {
    return this.service({
      method: 'post',
      url: ApiEnum.GuildRoleGrant,
      data
    });
  }

  /** 撤销用户角色 */
  guildRoleRevoke(data: { guild_id: string; user_id: string; role_id: number }): Promise<any> {
    return this.service({
      method: 'post',
      url: ApiEnum.GuildRoleRevoke,
      data
    });
  }

  // ─── 黑名单（Ban） ───

  /** 加入黑名单（封禁） */
  blacklistCreate(data: { guild_id: string; target_id: string; remark?: string; del_msg_days?: number }): Promise<any> {
    return this.service({
      method: 'post',
      url: ApiEnum.BlacklistCreate,
      data
    });
  }

  /** 移出黑名单（解封） */
  blacklistDelete(data: { guild_id: string; target_id: string }): Promise<any> {
    return this.service({
      method: 'post',
      url: ApiEnum.BlacklistDelete,
      data
    });
  }
}
