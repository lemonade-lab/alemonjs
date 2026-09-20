import type { ActionContext, MessagingActionMap, MediaReceipt, MessageDelivery } from '../../types';
import { createActionCaller, resolveActionContext, resolveActionTarget } from './action-context';
import { ActionTarget } from '../../types';
import { Result, ResultCode, createResult, sendAction } from './common';

/**
 * 媒体管理（图片/音频/视频/文件）
 * @param event 事件上下文
 */
export const useMedia = (event?: ActionContext) => {
  const valueEvent = resolveActionContext(event);
  const call = createActionCaller(valueEvent);

  type MediaType = 'image' | 'audio' | 'video' | 'file';
  type MediaTarget = ActionTarget;
  type MediaParams = MessageDelivery & {
    type: MediaType;
    url?: string;
    data?: string;
    filePath?: string;
    fileId?: string;
    name?: string;
    content?: string;
  };

  type UploadParams = Omit<MediaParams, keyof MessageDelivery | 'content'> & { target?: MediaTarget; send?: boolean };

  const validateSource = (params: MediaParams) => {
    const sources = [params.url, params.data, params.filePath, params.fileId].filter(value => value !== undefined);
    const count = sources.length;

    return count === 1 && sources.every(value => typeof value === 'string' && value.length > 0);
  };

  /**
   * 上传媒体文件（默认不发送，send=true 使用平台主动发送）
   * @param params.type 媒体类型
   * @param params.url 文件 URL
   * @param params.data base64 数据
   * @param params.name 文件名
   */
  const upload = async (params: UploadParams): Promise<Result<MediaReceipt>> => {
    if (['replyId', 'eventId', 'referenceId', 'sequence', 'wakeup', 'content'].some(key => key in params)) {
      return createResult(ResultCode.FailParams, 'Use media.send for message delivery options', null);
    }
    if (!validateSource(params)) {
      return createResult(ResultCode.FailParams, 'Provide exactly one media source', null);
    }
    try {
      const results = await sendAction({
        action: 'media.upload',
        payload: { event: valueEvent, BotId: valueEvent.BotId, target: params.target ?? resolveActionTarget(valueEvent), params }
      });
      const result = results.find(item => item.code === ResultCode.Ok);

      return result || results[0] || createResult(ResultCode.Warn, 'Media upload not supported or failed', null);
    } catch {
      return createResult(ResultCode.Fail, 'Failed to upload media', null);
    }
  };

  /**
   * 发送媒体到频道
   * @param channelId 频道 ID（不传则使用事件上下文）
   */
  const sendChannel = async (params: MediaParams & { channelId?: string; BotId?: string }): Promise<Result> => {
    const cid = params.channelId || params.target?.targetId || valueEvent.ChannelId;
    const contextTarget = params.target ?? resolveActionTarget(valueEvent);
    const target = contextTarget && { ...contextTarget, targetId: cid, BotId: params.BotId ?? contextTarget.BotId ?? valueEvent.BotId };

    if (!validateSource(params) || (params.target && (params.target.targetId !== cid || !['group', 'channel'].includes(params.target.scope)))) {
      return createResult(ResultCode.FailParams, 'Invalid media source or conflicting channel target', null);
    }

    if (!cid) {
      return createResult(ResultCode.FailParams, 'Missing ChannelId', null);
    }
    try {
      const results = await sendAction({
        action: 'media.send.channel',
        payload: { event: valueEvent, BotId: params.BotId ?? valueEvent.BotId, target, ChannelId: cid, params: { ...params, target } }
      });
      const result = results.find(item => item.code === ResultCode.Ok);

      return result || results[0] || createResult(ResultCode.Warn, 'Media send not supported or failed', null);
    } catch {
      return createResult(ResultCode.Fail, 'Failed to send media to channel', null);
    }
  };

  /**
   * 发送媒体到用户
   * @param userId 用户 ID
   */
  const sendUser = async (params: MediaParams & { userId: string; BotId?: string }): Promise<Result> => {
    if (!validateSource(params) || (params.target && (params.target.targetId !== params.userId || !['c2c', 'direct'].includes(params.target.scope)))) {
      return createResult(ResultCode.FailParams, 'Invalid media source or conflicting user target', null);
    }
    const target: ActionTarget = {
      scope: params.target?.scope ?? 'c2c',
      targetId: params.userId,
      BotId: params.BotId ?? params.target?.BotId ?? valueEvent.BotId
    };

    if (!params.userId) {
      return createResult(ResultCode.FailParams, 'Missing UserId', null);
    }
    try {
      const results = await sendAction({
        action: 'media.send.user',
        payload: { event: valueEvent, BotId: params.BotId ?? valueEvent.BotId, target, UserId: params.userId, params: { ...params, target } }
      });
      const result = results.find(item => item.code === ResultCode.Ok);

      return result || results[0] || createResult(ResultCode.Warn, 'Media send not supported or failed', null);
    } catch {
      return createResult(ResultCode.Fail, 'Failed to send media to user', null);
    }
  };

  /** Preferred scoped media API for group/C2C platforms. */
  const send = async (params: MediaParams): Promise<Result> => {
    const target = params.target ?? resolveActionTarget(valueEvent);

    if (!target?.targetId) {
      return createResult(ResultCode.FailParams, 'Missing targetId', null);
    }
    if (!validateSource(params)) {
      return createResult(ResultCode.FailParams, 'Provide exactly one media source', null);
    }
    try {
      const results = await sendAction({
        action: 'media.send',
        payload: { event: valueEvent, BotId: valueEvent.BotId, target: { ...target, BotId: target.BotId ?? valueEvent.BotId }, params: { ...params, target } }
      });
      const result = results.find(item => item.code === ResultCode.Ok);

      return result || results[0] || createResult(ResultCode.Warn, 'Media send not supported or failed', null);
    } catch {
      return createResult(ResultCode.Fail, 'Failed to send media', null);
    }
  };

  const media = {
    prepare: (params: MessagingActionMap['media.prepare'][0]) => call('media.prepare', params),
    finishPart: (params: MessagingActionMap['media.part.finish'][0]) => call('media.part.finish', params),
    complete: (params: MessagingActionMap['media.complete'][0]) => call('media.complete', params),
    upload,
    sendChannel,
    sendUser,
    send
  };

  return [media] as const;
};
