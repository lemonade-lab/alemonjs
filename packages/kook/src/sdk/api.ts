import axios, { type AxiosRequestConfig } from 'axios';
import FormData from 'form-data';
import { Readable } from 'stream';
import { ApiEnum, SendMessageParams, SendDirectMessageParams } from './typings.js';
import { config } from './config.js';
import { createPicFrom } from 'alemonjs/utils';

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

    return req(opstoin);
  }

  /**
   *
   * @returns
   */
  async gateway() {
    return this.service({
      baseURL: 'https://www.kookapp.cn/api/v3/gateway/index',
      method: 'get',
      params: {
        compress: 0
      }
    }).then(res => res.data);
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
    }).then(res => res?.data);
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
    }).then(res => res?.data);
  }

  /**
   * 创建私聊消息
   */

  /**
   * 创建消息
   * @param target_id
   * @returns
   */
  async userChatCreate(target_id: string): Promise<{
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
    }).then(res => res?.data);
  }

  /**
   * 创建消息
   * @param data
   * @returns
   */
  async createDirectMessage(data: SendDirectMessageParams): Promise<{
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
    }).then(res => res?.data);
  }

  /**
   * 删除指定消息
   * @param msg_id
   * @returns
   */
  async messageDelete(msg_id: string): Promise<{
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
    }).then(res => res?.data);
  }

  /**
   * 重编辑指定消息
   * @param data
   * @returns
   */
  async messageUpdate(data: { msg_id: string; content: any; quote?: string; temp_target_id?: string }): Promise<{
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
    }).then(res => res?.data);
  }

  /**
   * 删回应
   * @param data
   * @returns
   */
  async messageDeleteReaction(data: { msg_id: string; emoji: string; user_id: string }): Promise<{
    code: number;
    message: string;
    data: any[];
  }> {
    return this.service({
      method: 'post',
      url: ApiEnum.MessageDeleteReaction,
      data
    }).then(res => res?.data);
  }

  /**
   * 发回应
   * @param data
   * @returns
   */
  async messageAddReaction(data: { msg_id: string; emoji: string }): Promise<{
    code: number;
    message: string;
    data: any[];
  }> {
    return this.service({
      method: 'post',
      url: ApiEnum.MessageAddReaction,
      data
    }).then(res => res?.data);
  }

  /**
   * 某个回应的所有用户
   * @param data
   * @returns
   */
  async messageReactionList(params: { msg_id: string; emoji: string }): Promise<{
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
    }).then(res => res?.data);
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
  async userMe(): Promise<{
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
    }).then(res => res?.data);
  }

  /**
   * 得到用户信息
   * @param guild_id
   * @param user_id
   * @returns
   */
  async userView(
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
    }).then(res => res?.data);
  }

  /**
   * 踢出
   * @param guild_id
   * @param user_id
   * @returns
   */
  async guildKickout(
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
    }).then(res => res?.data);
  }

  /**
   * 创建角色
   * @param channel_id
   * @param type
   * @param value
   * @returns
   */
  async channelRoleCreate(
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
    }).then(res => res?.data);
  }
}
