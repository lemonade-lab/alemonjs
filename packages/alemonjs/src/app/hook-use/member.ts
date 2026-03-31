import { EventKeys, Events, MemberInfo, PaginationParams, PaginatedResult, Result, ResultCode, createResult, getEventOrThrow, sendAction } from './common';

/**
 * 成员管理
 * @param event 事件上下文
 */
export const useMember = <T extends EventKeys>(event?: Events[T]) => {
  const valueEvent = getEventOrThrow(event);

  const getGuildId = (guildId?: string) => guildId || (valueEvent as any).GuildId;

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
          event: valueEvent,
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
