import { EventKeys, Events, Result, ResultCode, createResult, getEventOrThrow, sendAction } from './common';

/**
 * 频道公告管理
 * @param event 事件上下文
 */
export const useAnnounce = <T extends EventKeys>(event?: Events[T]) => {
  const valueEvent = getEventOrThrow(event);

  /**
   * 设置公告
   * @param messageId 消息 ID
   * @param params.channelId 频道 ID（用于指定公告来源子频道）
   * @param guildId 服务器 ID（不传则使用事件上下文）
   */
  const set = async (params: { messageId: string; channelId?: string; guildId?: string }): Promise<Result> => {
    const gid = params.guildId || (valueEvent as any).GuildId;

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
    const gid = params?.guildId || (valueEvent as any).GuildId;

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
