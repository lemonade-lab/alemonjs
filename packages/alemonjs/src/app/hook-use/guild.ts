import { EventKeys, Events, GuildInfo, Result, ResultCode, createResult, getEventOrThrow, sendAction } from './common';

/**
 * 服务器/公会管理
 * @param event 事件上下文
 */
export const useGuild = <T extends EventKeys>(event?: Events[T]) => {
  const valueEvent = getEventOrThrow(event);

  /**
   * 获取服务器信息
   * @param guildId 服务器 ID（不传则使用事件上下文）
   */
  const info = async (params?: { guildId?: string }): Promise<Result<GuildInfo | null>> => {
    const gid = params?.guildId || (valueEvent as any).GuildId;

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
      const gid = params.guildId || (valueEvent as any).GuildId;

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
      const gid = params?.guildId || (valueEvent as any).GuildId;

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
      const gid = params.guildId || (valueEvent as any).GuildId;

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
