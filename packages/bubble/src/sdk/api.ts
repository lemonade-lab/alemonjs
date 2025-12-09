import axios from 'axios';
import { type AxiosRequestConfig } from 'axios';
import { getBubbleConfig } from '../config.js';
import { HttpsProxyAgent } from 'https-proxy-agent';
import { createAxiosInstance } from './instance.js';
import type { BotInfo, SendMessagePayload, FileUploadResponse, FileQuota, BaseMessage, Channel, User } from './types.js';

// Bubble 服务的基础地址（如需覆盖，可通过配置或环境变量）
export const API_URL = process.env.BUBBLE_API_BASE || 'https://bubble.alemonjs.com/api/bot/v1';
export const CDN_URL = process.env.BUBBLE_CDN_BASE || 'https://bubble-oss-files.alemonjs.com';
export const GATEWAY_URL = process.env.BUBBLE_GATEWAY_URL || 'wss://bubble.alemonjs.com/api/bot/gateway';

/**
 * api接口
 */
export class BubbleAPI {
  /**
   * 基础请求
   * @param opstion
   * @returns
   */
  request(options: AxiosRequestConfig): Promise<any> {
    const value = getBubbleConfig();
    const token = value.token;
    const requestConfig = value.request_config ?? {};

    if (value.request_proxy) {
      requestConfig.httpsAgent = new HttpsProxyAgent(value.request_proxy);
    }
    const service = axios.create({
      ...requestConfig,
      baseURL: API_URL,
      timeout: 6000,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      }
    });

    return createAxiosInstance(service, options);
  }

  /**
   * 获取机器人自身信息
   * @returns 机器人信息
   */
  getMe(): Promise<BotInfo> {
    return this.request({ method: 'GET', url: '/me' });
  }

  /**
   * 发送消息到频道
   * @param channelId 频道ID
   * @param data 消息载荷
   * @returns 创建的消息对象
   */
  sendMessage(channelId: string | number, data: SendMessagePayload): Promise<BaseMessage> {
    return this.request({ method: 'POST', url: `/channels/${channelId}/messages`, data });
  }

  /**
   * 获取频道消息列表
   * @param channelId 频道ID
   * @returns 消息列表
   */
  getChannelMessages(channelId: string | number): Promise<BaseMessage[]> {
    return this.request({ method: 'GET', url: `/channels/${channelId}/messages` });
  }

  /**
   * 编辑消息
   * @param channelId 频道ID
   * @param messageId 消息ID
   * @param data 更新的消息内容
   * @returns 更新后的消息对象
   */
  editMessage(channelId: string | number, messageId: string | number, data: Partial<SendMessagePayload>): Promise<BaseMessage> {
    return this.request({ method: 'PUT', url: `/channels/${channelId}/messages/${messageId}`, data });
  }

  /**
   * 删除消息
   * @param channelId 频道ID
   * @param messageId 消息ID
   */
  deleteMessage(channelId: string | number, messageId: string | number): Promise<void> {
    return this.request({ method: 'DELETE', url: `/channels/${channelId}/messages/${messageId}` });
  }

  /**
   * 列出服务器频道
   * @param guildId 服务器ID
   * @returns 频道列表
   */
  listGuildChannels(guildId: string | number): Promise<Channel[]> {
    return this.request({ method: 'GET', url: `/guilds/${guildId}/channels` });
  }

  /**
   * 获取频道信息
   * @param channelId 频道ID
   * @returns 频道信息
   */
  getChannel(channelId: string | number): Promise<Channel> {
    return this.request({ method: 'GET', url: `/channels/${channelId}` });
  }

  /**
   * 列出服务器成员
   * @param guildId 服务器ID
   * @returns 成员列表
   */
  listGuildMembers(guildId: string | number): Promise<User[]> {
    return this.request({ method: 'GET', url: `/guilds/${guildId}/members` });
  }

  /**
   * 获取服务器成员信息
   * @param guildId 服务器ID
   * @param userId 用户ID
   * @returns 成员信息
   */
  getGuildMember(guildId: string | number, userId: string | number): Promise<User> {
    return this.request({ method: 'GET', url: `/guilds/${guildId}/members/${userId}` });
  }

  /**
   * 获取或创建与用户的私聊线程
   * @param userId 用户ID
   * @returns 私聊线程信息
   */
  getOrCreateDm(userId: string | number): Promise<{ id: number; type: string }> {
    return this.request({ method: 'GET', url: `/users/${userId}/dm` });
  }

  /**
   * 在私聊线程中发送消息
   * @param threadId 私聊线程ID
   * @param data 消息载荷
   * @returns 创建的消息对象
   */
  sendDm(threadId: string | number, data: SendMessagePayload): Promise<BaseMessage> {
    return this.request({ method: 'POST', url: `/dm/threads/${threadId}/messages`, data });
  }

  /**
   * 获取私聊线程消息列表
   * @param threadId 私聊线程ID
   * @returns 消息列表
   */
  getDmMessages(threadId: string | number): Promise<BaseMessage[]> {
    return this.request({ method: 'GET', url: `/dm/threads/${threadId}/messages` });
  }

  /**
   * 上传文件（multipart/form-data）
   * @param file 文件，可以是 Buffer / Stream / fs.ReadStream
   * @param filename 文件名（可选）
   * @param extra 关联字段：channelId/threadId/messageId
   * @returns 上传后的文件信息
   */
  async uploadFile(
    file: any,
    filename?: string,
    extra: { channelId?: string | number; threadId?: string | number; messageId?: string | number } = {}
  ): Promise<{
    data: FileUploadResponse;
  }> {
    // lazy import form-data to avoid bundling in browser
    const FormData = (await import('form-data')).default;
    const form = new FormData();

    form.append('file', file, filename || 'file');
    if (extra.channelId) {
      form.append('channelId', String(extra.channelId));
    }
    if (extra.threadId) {
      form.append('threadId', String(extra.threadId));
    }
    // if (extra.messageId) {
    //   form.append('messageId', String(extra.messageId));
    // }

    const value = getBubbleConfig();
    const token = value.token;
    const requestConfig: any = value.request_config ?? {};

    if (value.request_proxy) {
      requestConfig.httpsAgent = new HttpsProxyAgent(value.request_proxy);
    }

    const service = axios.create({
      ...requestConfig,
      baseURL: API_URL,
      timeout: 60000,
      headers: {
        Authorization: `Bearer ${token}`,
        ...form.getHeaders()
      }
    });

    return createAxiosInstance(service, { method: 'POST', url: '/files/upload', data: form });
  }

  /**
   * 查询上传文件配额
   * @returns 文件配额信息
   */
  filesQuota(): Promise<FileQuota> {
    return this.request({ method: 'GET', url: '/files/quota' });
  }
}
