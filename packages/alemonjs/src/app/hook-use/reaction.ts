import { EventKeys, Events, Result, ResultCode, createResult, getEventOrThrow, sendAction } from './common';

/**
 * 表情回应管理
 * @param event 事件上下文
 */
export const useReaction = <T extends EventKeys>(event?: Events[T]) => {
  const valueEvent = getEventOrThrow(event);

  /**
   * 添加表情回应
   * @param emojiId 表情 ID 或 Unicode
   * @param messageId 消息 ID（不传则使用触发消息）
   */
  const add = async (params: { emojiId: string; messageId?: string }): Promise<Result> => {
    const mid = params.messageId || valueEvent.MessageId;
    const cid = (valueEvent as any).ChannelId;

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
    const mid = params.messageId || valueEvent.MessageId;
    const cid = (valueEvent as any).ChannelId;

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
    const mid = params.messageId || valueEvent.MessageId;
    const cid = (valueEvent as any).ChannelId;

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
