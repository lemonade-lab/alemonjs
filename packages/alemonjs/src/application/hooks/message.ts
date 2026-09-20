import type { ActionContext, OutgoingMessage, MessageDelivery, MessagingActionMap, MessageReceipt } from '../../types';
import { createActionCaller, resolveActionContext, resolveActionTarget } from './action-context';
import { logger } from '../../common/logger.js';
import {
  DataEnums,
  EventKeys,
  Events,
  Format,
  Result,
  ResultCode,
  createResult,
  getCurrentEvent,
  markEventSendAttempt,
  markEventSendFailure,
  recordEventSendResults,
  sendAction
} from './common';

/**
 * 消息处理
 * @param event
 * @returns
 */
export const useMessage = <T extends EventKeys>(event?: Events[T] | ActionContext) => {
  const valueEvent = resolveActionContext(event) as Events[T];
  const call = createActionCaller(valueEvent);
  const traceEvent = (event ?? getCurrentEvent() ?? valueEvent) as Events[T];

  /**
   * 消息参数类型
   */
  type MessageParams = MessageDelivery & { format?: Format | DataEnums[]; content?: OutgoingMessage };

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
  const sendRaw = async (val: DataEnums[], replyId?: string, options?: MessageDelivery): Promise<Result<MessageReceipt>[]> => {
    if (!val || val.length === 0) {
      return [createResult(ResultCode.FailParams, 'Invalid val: val must be a non-empty array', null)];
    }
    markEventSendAttempt(traceEvent);

    try {
      const result = await sendAction({
        action: 'message.send',
        payload: {
          event: valueEvent,
          BotId: options?.target?.BotId ?? valueEvent.BotId,
          target: options?.target ?? resolveActionTarget(valueEvent),
          params: {
            ...options,
            format: val,
            replyId
          }
        }
      });
      const results = Array.isArray(result) ? result : [result];

      recordEventSendResults(results, traceEvent);

      // 结果不含 Ok（适配器未处理当前事件返回空数组，或平台发送失败）时打 WARN，
      // 调用方应以返回值 code 判断成败，而非 try/catch
      if (results.length === 0 || results.every(item => item?.code !== ResultCode.Ok)) {
        const tag = (valueEvent as any)?._tag ?? 'unknown';
        const codes = results.length > 0 ? results.map(item => item?.code).join(', ') : 'empty';
        const message = results[0]?.message ?? '';

        logger.warn(`[send] 消息发送未成功 (tag: ${tag}, code: ${codes}) ${message}`);
      }

      return results;
    } catch (error) {
      markEventSendFailure(error, traceEvent);
      throw error;
    }
  };

  const lightweight = {
    typing: (params: MessagingActionMap['message.typing'][0] = {}) => call('message.typing', params),
    stream: (params: MessagingActionMap['message.stream'][0]) => call('message.stream', params),
    /**
     * 发送消息
     * @param params 消息参数或 DataEnums 数组
     */
    send(params?: MessageParams | DataEnums[]): Promise<Result<MessageReceipt>[]> {
      if (Array.isArray(params)) {
        return sendRaw(params.length > 0 ? params : []);
      }

      if (params?.content) {
        markEventSendAttempt(traceEvent);

        return sendAction({
          action: 'message.send',
          payload: { event: valueEvent, BotId: params.target?.BotId ?? valueEvent.BotId, target: params.target ?? resolveActionTarget(valueEvent), params }
        })
          .then(results => {
            recordEventSendResults(results, traceEvent);

            return results;
          })
          .catch(error => {
            markEventSendFailure(error, traceEvent);
            throw error;
          });
      }

      return sendRaw(params ? resolveFormat(params) : [], params?.replyId, params);
    },

    /**
     * 删除消息
     * @param params.messageId 消息 ID，不传则删除触发消息
     */
    async delete(params?: { messageId?: string }): Promise<Result> {
      const targetId = params?.messageId || valueEvent.MessageId;

      if (!targetId) {
        return createResult(ResultCode.FailParams, 'Missing MessageId', null);
      }
      try {
        const results = await sendAction({
          action: 'message.delete',
          payload: {
            MessageId: targetId,
            ChannelId: (valueEvent as any).ChannelId,
            event: valueEvent,
            BotId: valueEvent.BotId,
            target: resolveActionTarget(valueEvent)
          }
        });
        const result = results.find(item => item.code === ResultCode.Ok);

        return result || results[0] || createResult(ResultCode.Warn, 'Delete not supported or failed', null);
      } catch {
        return createResult(ResultCode.Fail, 'Failed to delete message', null);
      }
    },

    /**
     * 编辑消息
     * @param params 编辑参数
     */
    async edit(params: { format: Format | DataEnums[]; messageId?: string }): Promise<Result> {
      const targetId = params.messageId || valueEvent.MessageId;
      const channelId = (valueEvent as any).ChannelId;

      if (!targetId || !channelId) {
        return createResult(ResultCode.FailParams, 'Missing MessageId or ChannelId', null);
      }
      try {
        const val = params.format instanceof Format ? params.format.value : params.format;
        const results = await sendAction({
          action: 'message.edit',
          payload: {
            event: valueEvent,
            BotId: valueEvent.BotId,
            target: resolveActionTarget(valueEvent),
            ChannelId: channelId,
            MessageId: targetId,
            params: { format: val }
          }
        });
        const result = results.find(item => item.code === ResultCode.Ok);

        return result || results[0] || createResult(ResultCode.Warn, 'Edit not supported or failed', null);
      } catch {
        return createResult(ResultCode.Fail, 'Failed to edit message', null);
      }
    },

    /**
     * 置顶消息
     * @param params.messageId 消息 ID，不传则置顶触发消息
     */
    async pin(params?: { messageId?: string }): Promise<Result> {
      const targetId = params?.messageId || valueEvent.MessageId;
      const channelId = (valueEvent as any).ChannelId;

      if (!targetId || !channelId) {
        return createResult(ResultCode.FailParams, 'Missing MessageId or ChannelId', null);
      }
      try {
        const results = await sendAction({
          action: 'message.pin',
          payload: { event: valueEvent, BotId: valueEvent.BotId, target: resolveActionTarget(valueEvent), ChannelId: channelId, MessageId: targetId }
        });
        const result = results.find(item => item.code === ResultCode.Ok);

        return result || results[0] || createResult(ResultCode.Warn, 'Pin not supported or failed', null);
      } catch {
        return createResult(ResultCode.Fail, 'Failed to pin message', null);
      }
    },

    /**
     * 取消置顶消息
     * @param params.messageId 消息 ID，不传则取消置顶触发消息
     */
    async unpin(params?: { messageId?: string }): Promise<Result> {
      const targetId = params?.messageId || valueEvent.MessageId;
      const channelId = (valueEvent as any).ChannelId;

      if (!targetId || !channelId) {
        return createResult(ResultCode.FailParams, 'Missing MessageId or ChannelId', null);
      }
      try {
        const results = await sendAction({
          action: 'message.unpin',
          payload: { event: valueEvent, BotId: valueEvent.BotId, target: resolveActionTarget(valueEvent), ChannelId: channelId, MessageId: targetId }
        });
        const result = results.find(item => item.code === ResultCode.Ok);

        return result || results[0] || createResult(ResultCode.Warn, 'Unpin not supported or failed', null);
      } catch {
        return createResult(ResultCode.Fail, 'Failed to unpin message', null);
      }
    },

    /**
     * 获取消息详情
     * @param params.messageId 消息 ID
     */
    async get(params?: { messageId?: string }): Promise<Result> {
      const targetId = params?.messageId || valueEvent.MessageId;

      if (!targetId) {
        return createResult(ResultCode.FailParams, 'Missing MessageId', null);
      }
      try {
        const results = await sendAction({
          action: 'message.get',
          payload: { event: valueEvent, BotId: valueEvent.BotId, target: resolveActionTarget(valueEvent), MessageId: targetId }
        });
        const result = results.find(item => item.code === ResultCode.Ok);

        return result || results[0] || createResult(ResultCode.Warn, 'Get message not supported or failed', null);
      } catch {
        return createResult(ResultCode.Fail, 'Failed to get message', null);
      }
    }
  };

  return [lightweight] as const;
};

/**
 * 废弃，请使用 useMessage
 * @deprecated
 * @param event
 * @returns
 */
export const useSend = <T extends EventKeys>(event?: Events[T]) => {
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
export const useSends = <T extends EventKeys>(event?: Events[T]) => {
  const [message] = useMessage(event);

  return [message.send] as const;
};
