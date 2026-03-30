import { Result } from '../../core/utils';
import { User } from '../event/base/user';
import { EventKeys, Events } from '../event/map';
import { DataEnums } from '../message';
import { GuildInfo, ChannelInfo, MemberInfo, RoleInfo, PaginationParams, PaginatedResult } from '../standard';

export type ClientAPIMessageResult = Result & {
  data: {
    id: string;
    [key: string]: any;
  };
};

export type ClientAPI = {
  /**
   * alemonjs接口
   */
  api: {
    /**
     * hook 响应式接口
     */
    use: {
      /**
       * 发送消息（响应事件）
       * @param event 触发事件
       * @param val 消息内容
       */
      send: <T extends EventKeys>(event: Events[T], val: DataEnums[]) => Promise<ClientAPIMessageResult[]>;
      /**
       * 获取消息中 @提及 的用户列表
       * @param event 触发事件
       */
      mention: <T extends EventKeys>(event: Events[T]) => Promise<User[]>;

      // ─── 消息管理（可选） ───

      /**
       * 删除消息
       * @param messageId 消息 ID
       * @param channelId 频道 ID（部分平台需要）
       */
      delete?: (messageId: string, channelId?: string) => Promise<any>;
      /**
       * 编辑消息
       * @param channelId 消息所在频道
       * @param messageId 消息 ID
       * @param val 新的消息内容
       */
      edit?: (channelId: string, messageId: string, val: DataEnums[]) => Promise<any>;
      /**
       * 置顶消息
       */
      pin?: (channelId: string, messageId: string) => Promise<any>;
      /**
       * 取消置顶消息
       */
      unpin?: (channelId: string, messageId: string) => Promise<any>;

      // ─── 文件操作（可选） ───

      file?: {
        /** 向频道发送文件 */
        channel: (channelId: string, params: { file: string; name?: string; folder?: string }) => Promise<any>;
        /** 向用户发送文件 */
        user: (userId: string, params: { file: string; name?: string }) => Promise<any>;
      };

      // ─── 消息转发（可选） ───

      forward?: {
        /** 向频道发送合并转发 */
        channel: (channelId: string, params: any[]) => Promise<any>;
        /** 向用户发送合并转发 */
        user: (userId: string, params: any[]) => Promise<any>;
      };

      // ─── 表情回应（可选） ───

      reaction?: {
        /** 添加表情回应 */
        add: (channelId: string, messageId: string, emojiId: string) => Promise<any>;
        /** 移除表情回应 */
        remove: (channelId: string, messageId: string, emojiId: string) => Promise<any>;
      };

      // ─── 成员管理（可选） ───

      member?: {
        /** 获取成员信息 */
        info: (guildId: string, userId: string) => Promise<MemberInfo | null>;
        /** 获取成员列表 */
        list: (guildId: string, params?: PaginationParams) => Promise<PaginatedResult<MemberInfo>>;
        /** 踢出成员 */
        kick: (guildId: string, userId: string) => Promise<any>;
        /** 封禁成员 */
        ban: (guildId: string, userId: string, params?: { reason?: string; duration?: number }) => Promise<any>;
        /** 解封成员 */
        unban: (guildId: string, userId: string) => Promise<any>;
      };

      // ─── 服务器/公会（可选） ───

      guild?: {
        /** 获取服务器信息 */
        info: (guildId: string) => Promise<GuildInfo | null>;
        /** 获取服务器列表（Bot 加入的） */
        list: () => Promise<GuildInfo[]>;
      };

      // ─── 频道管理（可选） ───

      channel?: {
        /** 获取频道信息 */
        info: (channelId: string) => Promise<ChannelInfo | null>;
        /** 获取频道列表 */
        list: (guildId: string) => Promise<ChannelInfo[]>;
        /** 创建频道 */
        create?: (guildId: string, params: { name: string; type?: string; parentId?: string }) => Promise<ChannelInfo | null>;
        /** 更新频道 */
        update?: (channelId: string, params: { name?: string; topic?: string; position?: number }) => Promise<any>;
        /** 删除频道 */
        delete?: (channelId: string) => Promise<any>;
      };

      // ─── 角色管理（可选） ───

      role?: {
        /** 获取角色列表 */
        list: (guildId: string) => Promise<RoleInfo[]>;
        /** 创建角色 */
        create?: (guildId: string, params: { name: string; color?: number; permissions?: string }) => Promise<RoleInfo | null>;
        /** 更新角色 */
        update?: (roleId: string, guildId: string, params: { name?: string; color?: number; permissions?: string }) => Promise<any>;
        /** 删除角色 */
        delete?: (roleId: string, guildId: string) => Promise<any>;
        /** 为成员分配角色 */
        assign: (guildId: string, userId: string, roleId: string) => Promise<any>;
        /** 移除成员角色 */
        remove: (guildId: string, userId: string, roleId: string) => Promise<any>;
      };

      // ─── Bot 自身信息（可选） ───

      me?: {
        /** 获取 Bot 自身信息 */
        info: () => Promise<User | null>;
        /** 获取 Bot 加入的服务器列表 */
        guilds?: () => Promise<GuildInfo[]>;
      };
    };

    /**
     * 主动接口（无需事件上下文）
     */
    active: {
      /**
       * 主动发送消息
       */
      send: {
        /**
         * 向指定频道发送消息
         * @param channel_id 频道/空间 ID
         * @param data 消息内容
         */
        channel: (channel_id: string, data: DataEnums[]) => Promise<ClientAPIMessageResult[]>;
        /**
         * 向指定用户发送消息
         * @param user_id 用户 ID
         * @param data 消息内容
         */
        user: (user_id: string, data: DataEnums[]) => Promise<ClientAPIMessageResult[]>;
      };
    };
  };
  /**
   * 平台标识
   */
  platform: string;
};
