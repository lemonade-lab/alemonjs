import { DataEnums, EventKeys, Events, User, GuildInfo, ChannelInfo, MemberInfo, RoleInfo, PaginationParams, PaginatedResult } from '../types';
import { ResultCode } from '../core/variable';
import { ChildrenApp } from './store';
import { createResult, Result } from '../core/utils';
import { sendAction } from '../cbp/processor/actions';
import { sendAPI } from '../cbp/processor/api';
import { Format } from './message-format';

type Options = {
  UserId?: string;
  UserKey?: string;
  UserName?: string;
  IsMaster?: boolean;
  IsBot?: boolean;
};

/**
 * 使用提及。
 * @param {Object} event - 事件对象，包含触发提及的相关信息。
 * @throws {Error} - 如果 event 无效，抛出错误。
 */
export const useMention = <T extends EventKeys>(
  event: Events[T]
): [
  {
    find: (options?: Options) => Promise<
      Result<User[]> & {
        count: number;
      }
    >;
    findOne: (options?: Options) => Promise<
      Result<User | null> & {
        count: number;
      }
    >;
  }
] => {
  if (!event || typeof event !== 'object') {
    logger.error({
      code: ResultCode.FailParams,
      message: 'Invalid event: event must be an object',
      data: null
    });
    throw new Error('Invalid event: event must be an object');
  }

  // 提及数据缓存
  let res: User[] = null;

  /** 加载数据（带缓存） */
  const load = async () => {
    if (res) {
      return;
    }
    // 获取提及数据
    const results = await sendAction({
      action: 'mention.get',
      payload: { event }
    });
    // 提及数据通常在 results 中，找到 code 为 Ok 的项目，并将其 data 作为提及数据缓存起来
    const result = results.find(item => item.code === ResultCode.Ok);

    if (result) {
      res = result.data as User[];
    }
  };

  /** 按条件过滤，默认排除 bot */
  const match = (item: User, options: Options) => {
    if (options.UserId !== undefined && item.UserId !== options.UserId) {
      return false;
    }
    if (options.UserKey !== undefined && item.UserKey !== options.UserKey) {
      return false;
    }
    if (options.UserName !== undefined && item.UserName !== options.UserName) {
      return false;
    }
    if (options.IsMaster !== undefined && item.IsMaster !== options.IsMaster) {
      return false;
    }
    if (options.IsBot !== undefined && item.IsBot !== options.IsBot) {
      return false;
    }
    // 默认排除 bot
    if (options.IsBot === undefined && item.IsBot) {
      return false;
    }

    return true;
  };

  const mention = {
    find: async (options: Options = {}) => {
      try {
        await load();
      } catch (err) {
        const result = createResult<User[]>(ResultCode.Fail, err?.message || 'Failed to get mention data', null);

        return {
          ...result,
          count: 0
        };
      }
      if (!Array.isArray(res)) {
        return {
          ...createResult<User[]>(ResultCode.Warn, 'No mention data found', null),
          count: 0
        };
      }

      const data = res.filter(item => match(item, options));

      const result = createResult(ResultCode.Ok, 'Successfully retrieved mention data', data);

      return {
        ...result,
        count: data.length || 0
      };
    },
    findOne: async (options: Options = {}) => {
      const results = await mention.find(options);

      if (results.code !== ResultCode.Ok || !results.data?.length) {
        const result = createResult<User | null>(results.code, results.message, null);

        return {
          ...result,
          count: 0
        };
      }

      const data = results?.data[0];

      const result = createResult<User | null>(ResultCode.Ok, results.message, data);

      return {
        ...result,
        count: results.data?.length || 0
      };
    }
  };

  return [mention] as const;
};

/**
 * 消息处理
 * @param event
 * @returns
 */
export const useMessage = <T extends EventKeys>(event: Events[T]) => {
  if (!event || typeof event !== 'object') {
    logger.error({
      code: ResultCode.FailParams,
      message: 'Invalid event: event must be an object',
      data: null
    });
    throw new Error('Invalid event: event must be an object');
  }

  /**
   * 消息参数类型
   */
  type MessageParams = {
    format: Format | DataEnums[];
    replyId?: string;
  };

  /**
   * 将 format 参数解析为 DataEnums[]
   */
  const resolveFormat = (params: MessageParams): DataEnums[] => {
    if (params.format instanceof Format) {
      return params.format.value;
    }

    return params.format;
  };

  /**
   * 发送消息（内部方法，兼容旧API）
   * @param val
   * @returns
   */
  const sendRaw = async (val: DataEnums[], replyId?: string): Promise<Result[]> => {
    if (!val || val.length === 0) {
      return [createResult(ResultCode.FailParams, 'Invalid val: val must be a non-empty array', null)];
    }
    const result = await sendAction({
      action: 'message.send',
      payload: {
        event,
        params: {
          format: val,
          replyId
        }
      }
    });

    return Array.isArray(result) ? result : [result];
  };

  const lightweight = {
    /**
     * 发送消息
     * @param params 消息参数或 DataEnums 数组
     */
    send(params?: MessageParams | DataEnums[]) {
      if (Array.isArray(params)) {
        return sendRaw(params.length > 0 ? params : []);
      }

      return sendRaw(resolveFormat(params), params?.replyId ?? event.MessageId);
    },

    /**
     * 删除消息
     * @param params.messageId 消息 ID，不传则删除触发消息
     */
    async delete(params?: { messageId?: string }): Promise<Result> {
      const targetId = params?.messageId || event.MessageId;

      if (!targetId) {
        return createResult(ResultCode.FailParams, 'Missing MessageId', null);
      }
      try {
        const results = await sendAction({
          action: 'message.delete',
          payload: { MessageId: targetId, ChannelId: (event as any).ChannelId, event }
        });
        const result = results.find(item => item.code === ResultCode.Ok);

        return result || createResult(ResultCode.Warn, 'Delete not supported or failed', null);
      } catch {
        return createResult(ResultCode.Fail, 'Failed to delete message', null);
      }
    },

    /**
     * 编辑消息
     * @param params 编辑参数
     */
    async edit(params: { format: Format | DataEnums[]; messageId?: string }): Promise<Result> {
      const targetId = params.messageId || event.MessageId;
      const channelId = (event as any).ChannelId;

      if (!targetId || !channelId) {
        return createResult(ResultCode.FailParams, 'Missing MessageId or ChannelId', null);
      }
      try {
        const val = params.format instanceof Format ? params.format.value : params.format;
        const results = await sendAction({
          action: 'message.edit',
          payload: { ChannelId: channelId, MessageId: targetId, params: { format: val }, event }
        });
        const result = results.find(item => item.code === ResultCode.Ok);

        return result || createResult(ResultCode.Warn, 'Edit not supported or failed', null);
      } catch {
        return createResult(ResultCode.Fail, 'Failed to edit message', null);
      }
    },

    /**
     * 置顶消息
     * @param params.messageId 消息 ID，不传则置顶触发消息
     */
    async pin(params?: { messageId?: string }): Promise<Result> {
      const targetId = params?.messageId || event.MessageId;
      const channelId = (event as any).ChannelId;

      if (!targetId || !channelId) {
        return createResult(ResultCode.FailParams, 'Missing MessageId or ChannelId', null);
      }
      try {
        const results = await sendAction({
          action: 'message.pin',
          payload: { ChannelId: channelId, MessageId: targetId }
        });
        const result = results.find(item => item.code === ResultCode.Ok);

        return result || createResult(ResultCode.Warn, 'Pin not supported or failed', null);
      } catch {
        return createResult(ResultCode.Fail, 'Failed to pin message', null);
      }
    },

    /**
     * 取消置顶消息
     * @param params.messageId 消息 ID，不传则取消置顶触发消息
     */
    async unpin(params?: { messageId?: string }): Promise<Result> {
      const targetId = params?.messageId || event.MessageId;
      const channelId = (event as any).ChannelId;

      if (!targetId || !channelId) {
        return createResult(ResultCode.FailParams, 'Missing MessageId or ChannelId', null);
      }
      try {
        const results = await sendAction({
          action: 'message.unpin',
          payload: { ChannelId: channelId, MessageId: targetId }
        });
        const result = results.find(item => item.code === ResultCode.Ok);

        return result || createResult(ResultCode.Warn, 'Unpin not supported or failed', null);
      } catch {
        return createResult(ResultCode.Fail, 'Failed to unpin message', null);
      }
    },

    /**
     * 获取消息详情
     * @param params.messageId 消息 ID
     */
    async get(params?: { messageId?: string }): Promise<Result> {
      const targetId = params?.messageId || event.MessageId;

      if (!targetId) {
        return createResult(ResultCode.FailParams, 'Missing MessageId', null);
      }
      try {
        const results = await sendAction({
          action: 'message.get',
          payload: { MessageId: targetId }
        });
        const result = results.find(item => item.code === ResultCode.Ok);

        return result || createResult(ResultCode.Warn, 'Get message not supported or failed', null);
      } catch {
        return createResult(ResultCode.Fail, 'Failed to get message', null);
      }
    }
  };

  return [lightweight] as const;
};

/**
 * 成员管理
 * @param event 事件上下文
 */
export const useMember = <T extends EventKeys>(event: Events[T]) => {
  if (!event || typeof event !== 'object') {
    logger.error({
      code: ResultCode.FailParams,
      message: 'Invalid event: event must be an object',
      data: null
    });
    throw new Error('Invalid event: event must be an object');
  }

  const getGuildId = (guildId?: string) => guildId || (event as any).GuildId;

  /**
   * 获取成员信息
   * @param params.userId 用户 ID
   * @param params.guildId 服务器 ID（不传则使用事件上下文）
   */
  const info = async (params: { userId: string; guildId?: string }): Promise<Result<MemberInfo | null>> => {
    try {
      const results = await sendAction({
        action: 'member.info',
        payload: {
          event,
          params: {
            userId: params.userId,
            guildId: getGuildId(params.guildId)
          }
        }
      });
      const result = results.find(item => item.code === ResultCode.Ok);

      if (result) {
        return createResult(ResultCode.Ok, 'Successfully retrieved member information', result.data ?? null);
      }

      return createResult(ResultCode.Warn, 'No member information found', null);
    } catch {
      return createResult(ResultCode.Fail, 'Failed to get member information', null);
    }
  };

  /**
   * 获取成员列表
   * @param params.guildId 服务器 ID（不传则使用事件上下文）
   * @param params.pagination 分页参数
   */
  const list = async (params?: { guildId?: string; pagination?: PaginationParams }): Promise<Result<PaginatedResult<MemberInfo>>> => {
    const guildId = getGuildId(params?.guildId);

    if (!guildId) {
      return createResult(ResultCode.FailParams, 'Missing GuildId', { Items: [] });
    }
    try {
      const results = await sendAction({
        action: 'member.list',
        payload: { GuildId: guildId, params: params?.pagination }
      });
      const result = results.find(item => item.code === ResultCode.Ok);

      if (result) {
        return createResult(ResultCode.Ok, 'Successfully retrieved member list', result.data ?? { Items: [] });
      }

      return createResult(ResultCode.Warn, 'No member list found', { Items: [] });
    } catch {
      return createResult(ResultCode.Fail, 'Failed to get member list', { Items: [] });
    }
  };

  /**
   * 踢出成员
   */
  const kick = async (params: { userId: string; guildId?: string }): Promise<Result> => {
    const gid = getGuildId(params.guildId);

    if (!gid || !params.userId) {
      return createResult(ResultCode.FailParams, 'Missing GuildId or UserId', null);
    }
    try {
      const results = await sendAction({
        action: 'member.kick',
        payload: { GuildId: gid, UserId: params.userId }
      });
      const result = results.find(item => item.code === ResultCode.Ok);

      return result || createResult(ResultCode.Warn, 'Kick not supported or failed', null);
    } catch {
      return createResult(ResultCode.Fail, 'Failed to kick member', null);
    }
  };

  /**
   * 封禁成员
   */
  const ban = async (params: { userId: string; guildId?: string; reason?: string; duration?: number }): Promise<Result> => {
    const gid = getGuildId(params.guildId);

    if (!gid || !params.userId) {
      return createResult(ResultCode.FailParams, 'Missing GuildId or UserId', null);
    }
    try {
      const results = await sendAction({
        action: 'member.ban',
        payload: { GuildId: gid, UserId: params.userId, params: { reason: params.reason, duration: params.duration } }
      });
      const result = results.find(item => item.code === ResultCode.Ok);

      return result || createResult(ResultCode.Warn, 'Ban not supported or failed', null);
    } catch {
      return createResult(ResultCode.Fail, 'Failed to ban member', null);
    }
  };

  /**
   * 解封成员
   */
  const unban = async (params: { userId: string; guildId?: string }): Promise<Result> => {
    const gid = getGuildId(params.guildId);

    if (!gid || !params.userId) {
      return createResult(ResultCode.FailParams, 'Missing GuildId or UserId', null);
    }
    try {
      const results = await sendAction({
        action: 'member.unban',
        payload: { GuildId: gid, UserId: params.userId }
      });
      const result = results.find(item => item.code === ResultCode.Ok);

      return result || createResult(ResultCode.Warn, 'Unban not supported or failed', null);
    } catch {
      return createResult(ResultCode.Fail, 'Failed to unban member', null);
    }
  };

  /**
   * @deprecated 请使用 info
   */
  const information = (params: { userId: string }) => info(params);

  /**
   * 搜索成员
   * @param keyword 搜索关键字
   * @param guildId 服务器 ID（不传则使用事件上下文）
   * @param limit 返回数量限制
   */
  const search = async (params: { keyword: string; guildId?: string; limit?: number }): Promise<Result> => {
    const gid = getGuildId(params.guildId);

    if (!gid || !params.keyword) {
      return createResult(ResultCode.FailParams, 'Missing GuildId or keyword', null);
    }
    try {
      const results = await sendAction({
        action: 'member.search',
        payload: { GuildId: gid, params: { keyword: params.keyword, limit: params.limit } }
      });
      const result = results.find(item => item.code === ResultCode.Ok);

      return result || createResult(ResultCode.Warn, 'Member search not supported or failed', null);
    } catch {
      return createResult(ResultCode.Fail, 'Failed to search members', null);
    }
  };

  const member = {
    info,
    information,
    list,
    kick,
    ban,
    unban,
    search,

    /**
     * 禁言成员
     * @param userId 用户 ID
     * @param duration 禁言时长（秒），0 表示解除禁言
     * @param guildId 服务器 ID（不传则使用事件上下文）
     */
    async mute(params: { userId: string; duration: number; guildId?: string }): Promise<Result> {
      const gid = getGuildId(params.guildId);

      if (!gid || !params.userId) {
        return createResult(ResultCode.FailParams, 'Missing GuildId or UserId', null);
      }
      try {
        const results = await sendAction({
          action: 'member.mute',
          payload: { GuildId: gid, UserId: params.userId, params: { duration: params.duration } }
        });
        const result = results.find(item => item.code === ResultCode.Ok);

        return result || createResult(ResultCode.Warn, 'Mute not supported or failed', null);
      } catch {
        return createResult(ResultCode.Fail, 'Failed to mute member', null);
      }
    },

    /**
     * 设置/取消管理员
     * @param userId 用户 ID
     * @param enable 是否设为管理员
     * @param guildId 服务器 ID（不传则使用事件上下文）
     */
    async admin(params: { userId: string; enable: boolean; guildId?: string }): Promise<Result> {
      const gid = getGuildId(params.guildId);

      if (!gid || !params.userId) {
        return createResult(ResultCode.FailParams, 'Missing GuildId or UserId', null);
      }
      try {
        const results = await sendAction({
          action: 'member.admin',
          payload: { GuildId: gid, UserId: params.userId, params: { enable: params.enable } }
        });
        const result = results.find(item => item.code === ResultCode.Ok);

        return result || createResult(ResultCode.Warn, 'Admin set not supported or failed', null);
      } catch {
        return createResult(ResultCode.Fail, 'Failed to set admin', null);
      }
    },

    /**
     * 设置成员名片/昵称
     * @param userId 用户 ID
     * @param card 名片内容，空字符串表示取消
     * @param guildId 服务器 ID（不传则使用事件上下文）
     */
    async card(params: { userId: string; card: string; guildId?: string }): Promise<Result> {
      const gid = getGuildId(params.guildId);

      if (!gid || !params.userId) {
        return createResult(ResultCode.FailParams, 'Missing GuildId or UserId', null);
      }
      try {
        const results = await sendAction({
          action: 'member.card',
          payload: { GuildId: gid, UserId: params.userId, params: { card: params.card } }
        });
        const result = results.find(item => item.code === ResultCode.Ok);

        return result || createResult(ResultCode.Warn, 'Card set not supported or failed', null);
      } catch {
        return createResult(ResultCode.Fail, 'Failed to set member card', null);
      }
    },

    /**
     * 设置成员专属头衔
     * @param userId 用户 ID
     * @param title 头衔内容
     * @param guildId 服务器 ID（不传则使用事件上下文）
     * @param duration 有效期（秒），-1 表示永久
     */
    async title(params: { userId: string; title: string; guildId?: string; duration?: number }): Promise<Result> {
      const gid = getGuildId(params.guildId);

      if (!gid || !params.userId) {
        return createResult(ResultCode.FailParams, 'Missing GuildId or UserId', null);
      }
      try {
        const results = await sendAction({
          action: 'member.title',
          payload: { GuildId: gid, UserId: params.userId, params: { title: params.title, duration: params.duration ?? -1 } }
        });
        const result = results.find(item => item.code === ResultCode.Ok);

        return result || createResult(ResultCode.Warn, 'Title set not supported or failed', null);
      } catch {
        return createResult(ResultCode.Fail, 'Failed to set member title', null);
      }
    }
  };

  return [member] as const;
};

/**
 * 频道管理
 * @param event 事件上下文
 */
export const useChannel = <T extends EventKeys>(event: Events[T]) => {
  if (!event || typeof event !== 'object') {
    logger.error({
      code: ResultCode.FailParams,
      message: 'Invalid event: event must be an object',
      data: null
    });
    throw new Error('Invalid event: event must be an object');
  }

  /**
   * 获取频道信息
   * @param channelId 频道 ID（不传则使用事件上下文）
   */
  const info = async (params?: { channelId?: string }): Promise<Result<ChannelInfo | null>> => {
    const cid = params?.channelId || (event as any).ChannelId;

    if (!cid) {
      return createResult(ResultCode.FailParams, 'Missing ChannelId', null);
    }
    try {
      const results = await sendAction({
        action: 'channel.info',
        payload: { ChannelId: cid }
      });
      const result = results.find(item => item.code === ResultCode.Ok);

      if (result) {
        return createResult(ResultCode.Ok, 'Successfully retrieved channel info', result.data ?? null);
      }

      return createResult(ResultCode.Warn, 'No channel info found', null);
    } catch {
      return createResult(ResultCode.Fail, 'Failed to get channel info', null);
    }
  };

  /**
   * 获取频道列表
   * @param guildId 服务器 ID（不传则使用事件上下文）
   */
  const list = async (params?: { guildId?: string }): Promise<Result<ChannelInfo[]>> => {
    const gid = params?.guildId || (event as any).GuildId;

    if (!gid) {
      return createResult(ResultCode.FailParams, 'Missing GuildId', []);
    }
    try {
      const results = await sendAction({
        action: 'channel.list',
        payload: { GuildId: gid }
      });
      const result = results.find(item => item.code === ResultCode.Ok);

      if (result) {
        return createResult(ResultCode.Ok, 'Successfully retrieved channel list', result.data ?? []);
      }

      return createResult(ResultCode.Warn, 'No channel list found', []);
    } catch {
      return createResult(ResultCode.Fail, 'Failed to get channel list', []);
    }
  };

  /**
   * 创建频道
   */
  const create = async (params: { name: string; type?: string; parentId?: string; guildId?: string }): Promise<Result<ChannelInfo | null>> => {
    const gid = params.guildId || (event as any).GuildId;

    if (!gid) {
      return createResult(ResultCode.FailParams, 'Missing GuildId', null);
    }
    try {
      const results = await sendAction({
        action: 'channel.create',
        payload: { GuildId: gid, params: { name: params.name, type: params.type, parentId: params.parentId } }
      });
      const result = results.find(item => item.code === ResultCode.Ok);

      return result
        ? createResult(ResultCode.Ok, 'Channel created', result.data ?? null)
        : createResult(ResultCode.Warn, 'Create not supported or failed', null);
    } catch {
      return createResult(ResultCode.Fail, 'Failed to create channel', null);
    }
  };

  /**
   * 更新频道
   */
  const update = async (params: { channelId: string; name?: string; topic?: string; position?: number }): Promise<Result> => {
    if (!params.channelId) {
      return createResult(ResultCode.FailParams, 'Missing ChannelId', null);
    }
    try {
      const results = await sendAction({
        action: 'channel.update',
        payload: { ChannelId: params.channelId, params: { name: params.name, topic: params.topic, position: params.position } }
      });
      const result = results.find(item => item.code === ResultCode.Ok);

      return result || createResult(ResultCode.Warn, 'Update not supported or failed', null);
    } catch {
      return createResult(ResultCode.Fail, 'Failed to update channel', null);
    }
  };

  /**
   * 删除频道
   */
  const remove = async (params: { channelId: string }): Promise<Result> => {
    if (!params.channelId) {
      return createResult(ResultCode.FailParams, 'Missing ChannelId', null);
    }
    try {
      const results = await sendAction({
        action: 'channel.delete',
        payload: { ChannelId: params.channelId }
      });
      const result = results.find(item => item.code === ResultCode.Ok);

      return result || createResult(ResultCode.Warn, 'Delete not supported or failed', null);
    } catch {
      return createResult(ResultCode.Fail, 'Failed to delete channel', null);
    }
  };

  const channel = {
    info,
    list,
    create,
    update,
    delete: remove
  };

  return [channel] as const;
};

/**
 * 废弃，请使用 useMessage
 * @deprecated
 * @param event
 * @returns
 */
export const useSend = <T extends EventKeys>(event: Events[T]) => {
  const [message] = useMessage(event);
  const send = (...val: DataEnums[]) => {
    return message.send(val);
  };

  return send;
};

/**
 * 废弃，请使用 useMessage
 * @deprecated
 * @param event
 * @returns
 */
export const useSends = <T extends EventKeys>(event: Events[T]) => {
  const [message] = useMessage(event);

  return [message.send] as const;
};

/**
 * 卸载模块
 * @param name
 * @throws {Error} - 如果 name 无效，抛出错误。
 */
export const unChildren = (name = 'main') => {
  if (!name || typeof name !== 'string') {
    logger.error({
      code: ResultCode.FailParams,
      message: 'Invalid name: name must be a string',
      data: null
    });
    throw new Error('Invalid name: name must be a string');
  }
  const app = new ChildrenApp(name);

  app.un();
};

/**
 * 创建选择器
 * @param values
 * @returns
 */
export const onSelects = <T extends EventKeys[] | EventKeys>(values: T) => values;
global.onSelects = onSelects;

/**
 * 废弃,请使用onSelects
 * @deprecated
 * @param values
 * @returns
 */
export const createSelects = onSelects;

/**
 * 使用客户端
 * @param event
 * @param _ApiClass
 * @returns
 */
export const useClient = <T extends object>(event: any, _ApiClass: new (...args: any[]) => T) => {
  const client = new Proxy({} as T, {
    get(_target, prop) {
      if (typeof prop === 'symbol') {
        return undefined;
      }

      return (...args: any[]) => {
        return sendAPI({
          action: 'client.api',
          payload: {
            event,
            key: String(prop),
            params: args
          }
        });
      };
    }
  });

  return [client] as const;
};

/**
 * 服务器/公会管理
 * @param event 事件上下文
 */
export const useGuild = <T extends EventKeys>(event: Events[T]) => {
  if (!event || typeof event !== 'object') {
    logger.error({
      code: ResultCode.FailParams,
      message: 'Invalid event: event must be an object',
      data: null
    });
    throw new Error('Invalid event: event must be an object');
  }

  /**
   * 获取服务器信息
   * @param guildId 服务器 ID（不传则使用事件上下文）
   */
  const info = async (params?: { guildId?: string }): Promise<Result<GuildInfo | null>> => {
    const gid = params?.guildId || (event as any).GuildId;

    if (!gid) {
      return createResult(ResultCode.FailParams, 'Missing GuildId', null);
    }
    try {
      const results = await sendAction({
        action: 'guild.info',
        payload: { GuildId: gid }
      });
      const result = results.find(item => item.code === ResultCode.Ok);

      if (result) {
        return createResult(ResultCode.Ok, 'Successfully retrieved guild info', result.data ?? null);
      }

      return createResult(ResultCode.Warn, 'No guild info found', null);
    } catch {
      return createResult(ResultCode.Fail, 'Failed to get guild info', null);
    }
  };

  /**
   * 获取 Bot 加入的服务器列表
   */
  const list = async (): Promise<Result<GuildInfo[]>> => {
    try {
      const results = await sendAction({
        action: 'guild.list',
        payload: {}
      });
      const result = results.find(item => item.code === ResultCode.Ok);

      if (result) {
        return createResult(ResultCode.Ok, 'Successfully retrieved guild list', result.data ?? []);
      }

      return createResult(ResultCode.Warn, 'No guild list found', []);
    } catch {
      return createResult(ResultCode.Fail, 'Failed to get guild list', []);
    }
  };

  const guild = {
    info,
    list,

    /**
     * 更新服务器/群设置
     * @param params.name 新名称
     * @param guildId 服务器 ID（不传则使用事件上下文）
     */
    async update(params: { name?: string; guildId?: string }): Promise<Result> {
      const gid = params.guildId || (event as any).GuildId;

      if (!gid) {
        return createResult(ResultCode.FailParams, 'Missing GuildId', null);
      }
      try {
        const results = await sendAction({
          action: 'guild.update',
          payload: { GuildId: gid, params: { name: params.name } }
        });
        const result = results.find(item => item.code === ResultCode.Ok);

        return result || createResult(ResultCode.Warn, 'Update not supported or failed', null);
      } catch {
        return createResult(ResultCode.Fail, 'Failed to update guild', null);
      }
    },

    /**
     * 退出服务器/群
     * @param guildId 服务器 ID（不传则使用事件上下文）
     * @param isDismiss 是否解散（仅群主有效）
     */
    async leave(params?: { guildId?: string; isDismiss?: boolean }): Promise<Result> {
      const gid = params?.guildId || (event as any).GuildId;

      if (!gid) {
        return createResult(ResultCode.FailParams, 'Missing GuildId', null);
      }
      try {
        const results = await sendAction({
          action: 'guild.leave',
          payload: { GuildId: gid, params: { isDismiss: params?.isDismiss } }
        });
        const result = results.find(item => item.code === ResultCode.Ok);

        return result || createResult(ResultCode.Warn, 'Leave not supported or failed', null);
      } catch {
        return createResult(ResultCode.Fail, 'Failed to leave guild', null);
      }
    },

    /**
     * 全员禁言/解除全员禁言
     * @param enable 是否开启全员禁言
     * @param guildId 服务器 ID（不传则使用事件上下文）
     */
    async mute(params: { enable: boolean; guildId?: string }): Promise<Result> {
      const gid = params.guildId || (event as any).GuildId;

      if (!gid) {
        return createResult(ResultCode.FailParams, 'Missing GuildId', null);
      }
      try {
        const results = await sendAction({
          action: 'guild.mute',
          payload: { GuildId: gid, params: { enable: params.enable } }
        });
        const result = results.find(item => item.code === ResultCode.Ok);

        return result || createResult(ResultCode.Warn, 'Mute not supported or failed', null);
      } catch {
        return createResult(ResultCode.Fail, 'Failed to mute guild', null);
      }
    }
  };

  return [guild] as const;
};

/**
 * 角色管理
 * @param event 事件上下文
 */
export const useRole = <T extends EventKeys>(event: Events[T]) => {
  if (!event || typeof event !== 'object') {
    logger.error({
      code: ResultCode.FailParams,
      message: 'Invalid event: event must be an object',
      data: null
    });
    throw new Error('Invalid event: event must be an object');
  }

  const getGuildId = (guildId?: string) => guildId || (event as any).GuildId;

  /**
   * 获取角色列表
   */
  const list = async (params?: { guildId?: string }): Promise<Result<RoleInfo[]>> => {
    const gid = getGuildId(params?.guildId);

    if (!gid) {
      return createResult(ResultCode.FailParams, 'Missing GuildId', []);
    }
    try {
      const results = await sendAction({
        action: 'role.list',
        payload: { GuildId: gid }
      });
      const result = results.find(item => item.code === ResultCode.Ok);

      if (result) {
        return createResult(ResultCode.Ok, 'Successfully retrieved role list', result.data ?? []);
      }

      return createResult(ResultCode.Warn, 'No role list found', []);
    } catch {
      return createResult(ResultCode.Fail, 'Failed to get role list', []);
    }
  };

  /**
   * 创建角色
   */
  const create = async (params: { name: string; color?: number; permissions?: string; guildId?: string }): Promise<Result<RoleInfo | null>> => {
    const gid = getGuildId(params.guildId);

    if (!gid) {
      return createResult(ResultCode.FailParams, 'Missing GuildId', null);
    }
    try {
      const results = await sendAction({
        action: 'role.create',
        payload: { GuildId: gid, params: { name: params.name, color: params.color, permissions: params.permissions } }
      });
      const result = results.find(item => item.code === ResultCode.Ok);

      return result ? createResult(ResultCode.Ok, 'Role created', result.data ?? null) : createResult(ResultCode.Warn, 'Create not supported or failed', null);
    } catch {
      return createResult(ResultCode.Fail, 'Failed to create role', null);
    }
  };

  /**
   * 更新角色
   */
  const update = async (params: { roleId: string; name?: string; color?: number; permissions?: string; guildId?: string }): Promise<Result> => {
    const gid = getGuildId(params.guildId);

    if (!gid || !params.roleId) {
      return createResult(ResultCode.FailParams, 'Missing GuildId or RoleId', null);
    }
    try {
      const results = await sendAction({
        action: 'role.update',
        payload: { GuildId: gid, RoleId: params.roleId, params: { name: params.name, color: params.color, permissions: params.permissions } }
      });
      const result = results.find(item => item.code === ResultCode.Ok);

      return result || createResult(ResultCode.Warn, 'Update not supported or failed', null);
    } catch {
      return createResult(ResultCode.Fail, 'Failed to update role', null);
    }
  };

  /**
   * 删除角色
   */
  const remove = async (params: { roleId: string; guildId?: string }): Promise<Result> => {
    const gid = getGuildId(params.guildId);

    if (!gid || !params.roleId) {
      return createResult(ResultCode.FailParams, 'Missing GuildId or RoleId', null);
    }
    try {
      const results = await sendAction({
        action: 'role.delete',
        payload: { GuildId: gid, RoleId: params.roleId }
      });
      const result = results.find(item => item.code === ResultCode.Ok);

      return result || createResult(ResultCode.Warn, 'Delete not supported or failed', null);
    } catch {
      return createResult(ResultCode.Fail, 'Failed to delete role', null);
    }
  };

  /**
   * 为成员分配角色
   */
  const assign = async (params: { userId: string; roleId: string; guildId?: string }): Promise<Result> => {
    const gid = getGuildId(params.guildId);

    if (!gid || !params.userId || !params.roleId) {
      return createResult(ResultCode.FailParams, 'Missing GuildId, UserId or RoleId', null);
    }
    try {
      const results = await sendAction({
        action: 'role.assign',
        payload: { GuildId: gid, UserId: params.userId, RoleId: params.roleId }
      });
      const result = results.find(item => item.code === ResultCode.Ok);

      return result || createResult(ResultCode.Warn, 'Assign not supported or failed', null);
    } catch {
      return createResult(ResultCode.Fail, 'Failed to assign role', null);
    }
  };

  /**
   * 移除成员角色
   */
  const revoke = async (params: { userId: string; roleId: string; guildId?: string }): Promise<Result> => {
    const gid = getGuildId(params.guildId);

    if (!gid || !params.userId || !params.roleId) {
      return createResult(ResultCode.FailParams, 'Missing GuildId, UserId or RoleId', null);
    }
    try {
      const results = await sendAction({
        action: 'role.remove',
        payload: { GuildId: gid, UserId: params.userId, RoleId: params.roleId }
      });
      const result = results.find(item => item.code === ResultCode.Ok);

      return result || createResult(ResultCode.Warn, 'Remove not supported or failed', null);
    } catch {
      return createResult(ResultCode.Fail, 'Failed to remove role', null);
    }
  };

  const role = {
    list,
    create,
    update,
    delete: remove,
    assign,
    remove: revoke
  };

  return [role] as const;
};

/**
 * 表情回应管理
 * @param event 事件上下文
 */
export const useReaction = <T extends EventKeys>(event: Events[T]) => {
  if (!event || typeof event !== 'object') {
    logger.error({
      code: ResultCode.FailParams,
      message: 'Invalid event: event must be an object',
      data: null
    });
    throw new Error('Invalid event: event must be an object');
  }

  /**
   * 添加表情回应
   * @param emojiId 表情 ID 或 Unicode
   * @param messageId 消息 ID（不传则使用触发消息）
   */
  const add = async (params: { emojiId: string; messageId?: string }): Promise<Result> => {
    const mid = params.messageId || event.MessageId;
    const cid = (event as any).ChannelId;

    if (!mid || !cid || !params.emojiId) {
      return createResult(ResultCode.FailParams, 'Missing ChannelId, MessageId or EmojiId', null);
    }
    try {
      const results = await sendAction({
        action: 'reaction.add',
        payload: { ChannelId: cid, MessageId: mid, EmojiId: params.emojiId }
      });
      const result = results.find(item => item.code === ResultCode.Ok);

      return result || createResult(ResultCode.Warn, 'Reaction add not supported or failed', null);
    } catch {
      return createResult(ResultCode.Fail, 'Failed to add reaction', null);
    }
  };

  /**
   * 移除表情回应
   * @param emojiId 表情 ID 或 Unicode
   * @param messageId 消息 ID（不传则使用触发消息）
   */
  const remove = async (params: { emojiId: string; messageId?: string }): Promise<Result> => {
    const mid = params.messageId || event.MessageId;
    const cid = (event as any).ChannelId;

    if (!mid || !cid || !params.emojiId) {
      return createResult(ResultCode.FailParams, 'Missing ChannelId, MessageId or EmojiId', null);
    }
    try {
      const results = await sendAction({
        action: 'reaction.remove',
        payload: { ChannelId: cid, MessageId: mid, EmojiId: params.emojiId }
      });
      const result = results.find(item => item.code === ResultCode.Ok);

      return result || createResult(ResultCode.Warn, 'Reaction remove not supported or failed', null);
    } catch {
      return createResult(ResultCode.Fail, 'Failed to remove reaction', null);
    }
  };

  /**
   * 获取某个表情的回应用户列表
   * @param emojiId 表情 ID 或 Unicode
   * @param messageId 消息 ID（不传则使用触发消息）
   * @param limit 返回数量限制
   */
  const list = async (params: { emojiId: string; messageId?: string; limit?: number }): Promise<Result> => {
    const mid = params.messageId || event.MessageId;
    const cid = (event as any).ChannelId;

    if (!mid || !cid || !params.emojiId) {
      return createResult(ResultCode.FailParams, 'Missing ChannelId, MessageId or EmojiId', null);
    }
    try {
      const results = await sendAction({
        action: 'reaction.list',
        payload: { ChannelId: cid, MessageId: mid, EmojiId: params.emojiId, params: { limit: params.limit } }
      });
      const result = results.find(item => item.code === ResultCode.Ok);

      return result || createResult(ResultCode.Warn, 'Reaction list not supported or failed', null);
    } catch {
      return createResult(ResultCode.Fail, 'Failed to list reactions', null);
    }
  };

  const reaction = {
    add,
    remove,
    list
  };

  return [reaction] as const;
};

/**
 * 获取我相关的数据
 */
export const useMe = () => {
  /**
   * 个人信息
   * @returns
   */
  const info = async (): Promise<Result<User | null>> => {
    try {
      const results = await sendAction({
        action: 'me.info',
        payload: {}
      });
      const result = results.find(item => item.code === ResultCode.Ok);

      if (result) {
        const data: User | null = result?.data ?? null;

        return createResult(ResultCode.Ok, 'Successfully retrieved bot information', data);
      }

      return createResult(ResultCode.Warn, 'No bot information found', null);
    } catch {
      return createResult(ResultCode.Fail, 'Failed to get bot information', null);
    }
  };

  /**
   * 加入的服务器列表
   */
  const guilds = async (): Promise<Result<GuildInfo[]>> => {
    try {
      const results = await sendAction({
        action: 'me.guilds',
        payload: {}
      });
      const result = results.find(item => item.code === ResultCode.Ok);

      if (result) {
        return createResult(ResultCode.Ok, 'Successfully retrieved guild list', result.data ?? []);
      }

      return createResult(ResultCode.Warn, 'No guild list found', []);
    } catch {
      return createResult(ResultCode.Fail, 'Failed to get guild list', []);
    }
  };
  /**
   * 私聊线程列表
   */
  const threads = async (): Promise<Result<User | null>> => {
    try {
      const results = await sendAction({
        action: 'me.threads',
        payload: {}
      });
      const result = results.find(item => item.code === ResultCode.Ok);

      if (result) {
        const data: User | null = result?.data ?? null;

        return createResult(ResultCode.Ok, 'Successfully retrieved bot information', data);
      }

      return createResult(ResultCode.Warn, 'No bot information found', null);
    } catch {
      return createResult(ResultCode.Fail, 'Failed to get bot information', null);
    }
  };

  /**
   * 好友列表
   */
  const friends = async (): Promise<Result<User | null>> => {
    try {
      const results = await sendAction({
        action: 'me.friends',
        payload: {}
      });
      const result = results.find(item => item.code === ResultCode.Ok);

      if (result) {
        const data: User | null = result?.data ?? null;

        return createResult(ResultCode.Ok, 'Successfully retrieved bot information', data);
      }

      return createResult(ResultCode.Warn, 'No bot information found', null);
    } catch {
      return createResult(ResultCode.Fail, 'Failed to get bot information', null);
    }
  };

  const control = {
    info,
    guilds,
    threads,
    friends
  };

  return [control] as const;
};

/**
 * 请求处理（好友请求、入群请求等）
 */
export const useRequest = () => {
  /**
   * 处理好友请求
   * @param flag 请求标识
   * @param approve 是否同意
   * @param remark 备注（同意时有效）
   */
  const friend = async (params: { flag: string; approve: boolean; remark?: string }): Promise<Result> => {
    if (!params.flag) {
      return createResult(ResultCode.FailParams, 'Missing flag', null);
    }
    try {
      const results = await sendAction({
        action: 'request.friend',
        payload: { params: { flag: params.flag, approve: params.approve, remark: params.remark } }
      });
      const result = results.find(item => item.code === ResultCode.Ok);

      return result || createResult(ResultCode.Warn, 'Friend request handling not supported or failed', null);
    } catch {
      return createResult(ResultCode.Fail, 'Failed to handle friend request', null);
    }
  };

  /**
   * 处理加群/加服务器请求
   * @param flag 请求标识
   * @param subType 请求子类型（如 add / invite）
   * @param approve 是否同意
   * @param reason 拒绝理由（拒绝时有效）
   */
  const guild = async (params: { flag: string; subType: string; approve: boolean; reason?: string }): Promise<Result> => {
    if (!params.flag || !params.subType) {
      return createResult(ResultCode.FailParams, 'Missing flag or subType', null);
    }
    try {
      const results = await sendAction({
        action: 'request.guild',
        payload: { params: { flag: params.flag, subType: params.subType, approve: params.approve, reason: params.reason } }
      });
      const result = results.find(item => item.code === ResultCode.Ok);

      return result || createResult(ResultCode.Warn, 'Guild request handling not supported or failed', null);
    } catch {
      return createResult(ResultCode.Fail, 'Failed to handle guild request', null);
    }
  };

  const request = {
    friend,
    guild
  };

  return [request] as const;
};

/**
 * 用户信息查询（无需群/服务器上下文）
 */
export const useUser = () => {
  /**
   * 获取用户信息
   * @param userId 用户 ID
   */
  const info = async (params: { userId: string }): Promise<Result<User | null>> => {
    if (!params.userId) {
      return createResult(ResultCode.FailParams, 'Missing UserId', null);
    }
    try {
      const results = await sendAction({
        action: 'user.info',
        payload: { UserId: params.userId }
      });
      const result = results.find(item => item.code === ResultCode.Ok);

      if (result) {
        return createResult(ResultCode.Ok, 'Successfully retrieved user info', result.data ?? null);
      }

      return createResult(ResultCode.Warn, 'No user info found', null);
    } catch {
      return createResult(ResultCode.Fail, 'Failed to get user info', null);
    }
  };

  const user = {
    info
  };

  return [user] as const;
};

/**
 * 媒体管理（图片/音频/视频/文件）
 * @param event 事件上下文
 */
export const useMedia = <T extends EventKeys>(event: Events[T]) => {
  if (!event || typeof event !== 'object') {
    logger.error({
      code: ResultCode.FailParams,
      message: 'Invalid event: event must be an object',
      data: null
    });
    throw new Error('Invalid event: event must be an object');
  }

  type MediaType = 'image' | 'audio' | 'video' | 'file';

  /**
   * 上传媒体文件（仅上传，不发送）
   * @param params.type 媒体类型
   * @param params.url 文件 URL
   * @param params.data base64 数据
   * @param params.name 文件名
   */
  const upload = async (params: { type: MediaType; url?: string; data?: string; name?: string }): Promise<Result> => {
    try {
      const results = await sendAction({
        action: 'media.upload',
        payload: { params }
      });
      const result = results.find(item => item.code === ResultCode.Ok);

      return result || createResult(ResultCode.Warn, 'Media upload not supported or failed', null);
    } catch {
      return createResult(ResultCode.Fail, 'Failed to upload media', null);
    }
  };

  /**
   * 发送媒体到频道
   * @param channelId 频道 ID（不传则使用事件上下文）
   */
  const sendChannel = async (params: { type: MediaType; url?: string; data?: string; name?: string; channelId?: string }): Promise<Result> => {
    const cid = params.channelId || (event as any).ChannelId;

    if (!cid) {
      return createResult(ResultCode.FailParams, 'Missing ChannelId', null);
    }
    try {
      const results = await sendAction({
        action: 'media.send.channel',
        payload: { ChannelId: cid, params: { type: params.type, url: params.url, data: params.data, name: params.name } }
      });
      const result = results.find(item => item.code === ResultCode.Ok);

      return result || createResult(ResultCode.Warn, 'Media send not supported or failed', null);
    } catch {
      return createResult(ResultCode.Fail, 'Failed to send media to channel', null);
    }
  };

  /**
   * 发送媒体到用户
   * @param userId 用户 ID
   */
  const sendUser = async (params: { userId: string; type: MediaType; url?: string; data?: string; name?: string }): Promise<Result> => {
    if (!params.userId) {
      return createResult(ResultCode.FailParams, 'Missing UserId', null);
    }
    try {
      const results = await sendAction({
        action: 'media.send.user',
        payload: { UserId: params.userId, params: { type: params.type, url: params.url, data: params.data, name: params.name } }
      });
      const result = results.find(item => item.code === ResultCode.Ok);

      return result || createResult(ResultCode.Warn, 'Media send not supported or failed', null);
    } catch {
      return createResult(ResultCode.Fail, 'Failed to send media to user', null);
    }
  };

  const media = {
    upload,
    sendChannel,
    sendUser
  };

  return [media] as const;
};

/**
 * 消息历史记录
 * @param event 事件上下文
 */
export const useHistory = <T extends EventKeys>(event: Events[T]) => {
  if (!event || typeof event !== 'object') {
    logger.error({
      code: ResultCode.FailParams,
      message: 'Invalid event: event must be an object',
      data: null
    });
    throw new Error('Invalid event: event must be an object');
  }

  /**
   * 获取频道消息历史
   * @param channelId 频道 ID（不传则使用事件上下文）
   * @param params.limit 返回数量
   * @param params.before 在此消息之前
   * @param params.after 在此消息之后
   */
  const list = async (params?: { channelId?: string; limit?: number; before?: string; after?: string }): Promise<Result> => {
    const cid = params?.channelId || (event as any).ChannelId;

    if (!cid) {
      return createResult(ResultCode.FailParams, 'Missing ChannelId', null);
    }
    try {
      const results = await sendAction({
        action: 'history.list',
        payload: { ChannelId: cid, params: { limit: params?.limit, before: params?.before, after: params?.after } }
      });
      const result = results.find(item => item.code === ResultCode.Ok);

      return result || createResult(ResultCode.Warn, 'History list not supported or failed', null);
    } catch {
      return createResult(ResultCode.Fail, 'Failed to get message history', null);
    }
  };

  const history = {
    list
  };

  return [history] as const;
};

/**
 * 频道权限管理
 * @param event 事件上下文
 */
export const usePermission = <T extends EventKeys>(event: Events[T]) => {
  if (!event || typeof event !== 'object') {
    logger.error({
      code: ResultCode.FailParams,
      message: 'Invalid event: event must be an object',
      data: null
    });
    throw new Error('Invalid event: event must be an object');
  }

  /**
   * 获取用户在频道中的权限
   * @param userId 用户 ID
   * @param channelId 频道 ID（不传则使用事件上下文）
   */
  const get = async (params: { userId: string; channelId?: string }): Promise<Result> => {
    const cid = params.channelId || (event as any).ChannelId;

    if (!cid || !params.userId) {
      return createResult(ResultCode.FailParams, 'Missing ChannelId or UserId', null);
    }
    try {
      const results = await sendAction({
        action: 'permission.get',
        payload: { ChannelId: cid, UserId: params.userId }
      });
      const result = results.find(item => item.code === ResultCode.Ok);

      return result || createResult(ResultCode.Warn, 'Permission get not supported or failed', null);
    } catch {
      return createResult(ResultCode.Fail, 'Failed to get permission', null);
    }
  };

  /**
   * 设置用户在频道中的权限
   * @param userId 用户 ID
   * @param params.allow 允许的权限位
   * @param params.deny 拒绝的权限位
   * @param channelId 频道 ID（不传则使用事件上下文）
   */
  const set = async (params: { userId: string; allow?: string; deny?: string; channelId?: string }): Promise<Result> => {
    const cid = params.channelId || (event as any).ChannelId;

    if (!cid || !params.userId) {
      return createResult(ResultCode.FailParams, 'Missing ChannelId or UserId', null);
    }
    try {
      const results = await sendAction({
        action: 'permission.set',
        payload: { ChannelId: cid, UserId: params.userId, params: { allow: params.allow, deny: params.deny } }
      });
      const result = results.find(item => item.code === ResultCode.Ok);

      return result || createResult(ResultCode.Warn, 'Permission set not supported or failed', null);
    } catch {
      return createResult(ResultCode.Fail, 'Failed to set permission', null);
    }
  };

  const permission = {
    get,
    set
  };

  return [permission] as const;
};

/**
 * 频道公告管理
 * @param event 事件上下文
 */
export const useAnnounce = <T extends EventKeys>(event: Events[T]) => {
  if (!event || typeof event !== 'object') {
    logger.error({
      code: ResultCode.FailParams,
      message: 'Invalid event: event must be an object',
      data: null
    });
    throw new Error('Invalid event: event must be an object');
  }

  /**
   * 设置公告
   * @param messageId 消息 ID
   * @param params.channelId 频道 ID（用于指定公告来源子频道）
   * @param guildId 服务器 ID（不传则使用事件上下文）
   */
  const set = async (params: { messageId: string; channelId?: string; guildId?: string }): Promise<Result> => {
    const gid = params.guildId || (event as any).GuildId;

    if (!gid || !params.messageId) {
      return createResult(ResultCode.FailParams, 'Missing GuildId or MessageId', null);
    }
    try {
      const results = await sendAction({
        action: 'channel.announce',
        payload: { GuildId: gid, params: { messageId: params.messageId, channelId: params.channelId } }
      });
      const result = results.find(item => item.code === ResultCode.Ok);

      return result || createResult(ResultCode.Warn, 'Announce set not supported or failed', null);
    } catch {
      return createResult(ResultCode.Fail, 'Failed to set announcement', null);
    }
  };

  /**
   * 删除公告
   * @param messageId 消息 ID（传 'all' 删除所有公告）
   * @param guildId 服务器 ID（不传则使用事件上下文）
   */
  const remove = async (params?: { messageId?: string; guildId?: string }): Promise<Result> => {
    const gid = params?.guildId || (event as any).GuildId;

    if (!gid) {
      return createResult(ResultCode.FailParams, 'Missing GuildId', null);
    }
    try {
      const results = await sendAction({
        action: 'channel.announce',
        payload: { GuildId: gid, params: { messageId: params?.messageId || 'all', remove: true } }
      });
      const result = results.find(item => item.code === ResultCode.Ok);

      return result || createResult(ResultCode.Warn, 'Announce remove not supported or failed', null);
    } catch {
      return createResult(ResultCode.Fail, 'Failed to remove announcement', null);
    }
  };

  const announce = {
    set,
    remove
  };

  return [announce] as const;
};
