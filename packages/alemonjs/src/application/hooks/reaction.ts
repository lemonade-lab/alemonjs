import type { ActionContext } from '../../types';
import { EventKeys, Events, Result, ResultCode, createResult, sendAction } from './common';
import { resolveActionContext, resolveActionTarget } from './action-context';

/**
 * 表情回应管理
 * @param event 事件上下文
 */
export const useReaction = <T extends EventKeys>(event?: Events[T] | ActionContext) => {
  const valueEvent = resolveActionContext(event as ActionContext | undefined);
  const target = (channelId?: string) =>
    resolveActionTarget(valueEvent) ?? (channelId ? { scope: 'channel' as const, targetId: channelId, BotId: valueEvent.BotId } : undefined);

  /**
   * 添加表情回应
   * @param emojiId 表情 ID 或 Unicode
   * @param messageId 消息 ID（不传则使用触发消息）
   */
  const add = async (params: { emojiId: string; messageId?: string; channelId?: string }): Promise<Result> => {
    const mid = params.messageId || valueEvent.MessageId;
    const cid = params.channelId || valueEvent.ChannelId;

    if (!mid || !cid || !params.emojiId) {
      return createResult(ResultCode.FailParams, 'Missing ChannelId, MessageId or EmojiId', null);
    }
    try {
      const results = await sendAction({
        action: 'reaction.add',
        payload: { event: valueEvent, ChannelId: cid, MessageId: mid, EmojiId: params.emojiId, ...(target(cid) && { target: target(cid) }) }
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
  const remove = async (params: { emojiId: string; messageId?: string; channelId?: string }): Promise<Result> => {
    const mid = params.messageId || valueEvent.MessageId;
    const cid = params.channelId || valueEvent.ChannelId;

    if (!mid || !cid || !params.emojiId) {
      return createResult(ResultCode.FailParams, 'Missing ChannelId, MessageId or EmojiId', null);
    }
    try {
      const results = await sendAction({
        action: 'reaction.remove',
        payload: { event: valueEvent, ChannelId: cid, MessageId: mid, EmojiId: params.emojiId, ...(target(cid) && { target: target(cid) }) }
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
  const list = async (params: { emojiId: string; messageId?: string; limit?: number; channelId?: string }): Promise<Result> => {
    const mid = params.messageId || valueEvent.MessageId;
    const cid = params.channelId || valueEvent.ChannelId;

    if (!mid || !cid || !params.emojiId) {
      return createResult(ResultCode.FailParams, 'Missing ChannelId, MessageId or EmojiId', null);
    }
    try {
      const results = await sendAction({
        action: 'reaction.list',
        payload: {
          event: valueEvent,
          ChannelId: cid,
          MessageId: mid,
          EmojiId: params.emojiId,
          ...(target(cid) && { target: target(cid) }),
          params: { limit: params.limit }
        }
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
