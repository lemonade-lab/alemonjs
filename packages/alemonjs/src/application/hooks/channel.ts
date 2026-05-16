import { ChannelInfo, EventKeys, Events, Result, ResultCode, createResult, getEventOrThrow, sendAction } from './common';

/**
 * 频道管理
 * @param event 事件上下文
 */
export const useChannel = <T extends EventKeys>(event?: Events[T]) => {
  const valueEvent = getEventOrThrow(event);

  /**
   * 获取频道信息
   * @param channelId 频道 ID（不传则使用事件上下文）
   */
  const info = async (params?: { channelId?: string }): Promise<Result<ChannelInfo | null>> => {
    const cid = params?.channelId || (valueEvent as any).ChannelId;

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
    const gid = params?.guildId || (valueEvent as any).GuildId;

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
    const gid = params.guildId || (valueEvent as any).GuildId;

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
