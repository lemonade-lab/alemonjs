import { DataEnums, EventKeys, Events, Format, Result, ResultCode, createResult, getEventOrThrow, sendAction } from './common';

/**
 * 消息处理
 * @param event
 * @returns
 */
export const useMessage = <T extends EventKeys>(event?: Events[T]) => {
  const valueEvent = getEventOrThrow(event);

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
        event: valueEvent,
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

      return sendRaw(resolveFormat(params), params?.replyId ?? valueEvent.MessageId);
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
          payload: { MessageId: targetId, ChannelId: (valueEvent as any).ChannelId, event: valueEvent }
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
      const targetId = params.messageId || valueEvent.MessageId;
      const channelId = (valueEvent as any).ChannelId;

      if (!targetId || !channelId) {
        return createResult(ResultCode.FailParams, 'Missing MessageId or ChannelId', null);
      }
      try {
        const val = params.format instanceof Format ? params.format.value : params.format;
        const results = await sendAction({
          action: 'message.edit',
          payload: { ChannelId: channelId, MessageId: targetId, params: { format: val }, event: valueEvent }
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
      const targetId = params?.messageId || valueEvent.MessageId;
      const channelId = (valueEvent as any).ChannelId;

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
      const targetId = params?.messageId || valueEvent.MessageId;
      const channelId = (valueEvent as any).ChannelId;

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
      const targetId = params?.messageId || valueEvent.MessageId;

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
