import { EventKeys, Events, Result, ResultCode, createResult, getEventOrThrow, sendAction } from './common';

/**
 * 消息历史记录
 * @param event 事件上下文
 */
export const useHistory = <T extends EventKeys>(event?: Events[T]) => {
  const valueEvent = getEventOrThrow(event);

  /**
   * 获取频道消息历史
   * @param channelId 频道 ID（不传则使用事件上下文）
   * @param params.limit 返回数量
   * @param params.before 在此消息之前
   * @param params.after 在此消息之后
   */
  const list = async (params?: { channelId?: string; limit?: number; before?: string; after?: string }): Promise<Result> => {
    const cid = params?.channelId || (valueEvent as any).ChannelId;

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
