import { ActionTarget } from '../../types';
import { EventKeys, Events, Result, ResultCode, createResult, getEventOrThrow, sendAction } from './common';

/**
 * 媒体管理（图片/音频/视频/文件）
 * @param event 事件上下文
 */
export const useMedia = <T extends EventKeys>(event?: Events[T]) => {
  const valueEvent = getEventOrThrow(event);

  type MediaType = 'image' | 'audio' | 'video' | 'file';
  type MediaTarget = ActionTarget;
  type MediaParams = { type: MediaType; url?: string; data?: string; filePath?: string; fileId?: string; name?: string; content?: string };

  const validateSource = (params: MediaParams) => {
    const count = [params.url, params.data, params.filePath, params.fileId].filter(value => value !== undefined).length;

    return count === 1;
  };

  /**
   * 上传媒体文件（仅上传，不发送）
   * @param params.type 媒体类型
   * @param params.url 文件 URL
   * @param params.data base64 数据
   * @param params.name 文件名
   */
  const upload = async (params: MediaParams & { target?: MediaTarget }): Promise<Result> => {
    if (!validateSource(params)) {
      return createResult(ResultCode.FailParams, 'Provide exactly one media source', null);
    }
    try {
      const results = await sendAction({
        action: 'media.upload',
        payload: { target: params.target, params }
      });
      const result = results.find(item => item.code === ResultCode.Ok);

      return result || createResult(ResultCode.Warn, 'Media upload not supported or failed', null);
    } catch {
      return createResult(ResultCode.Fail, 'Failed to upload media', null);
    }
  };

  /**
   * 发送媒体到频道
   * @param channelId 频道 ID（不传则使用事件上下文）
   */
  const sendChannel = async (params: MediaParams & { channelId?: string; BotId?: string }): Promise<Result> => {
    const cid = params.channelId || (valueEvent as any).ChannelId;

    if (!cid) {
      return createResult(ResultCode.FailParams, 'Missing ChannelId', null);
    }
    try {
      const results = await sendAction({
        action: 'media.send.channel',
        payload: { ChannelId: cid, BotId: params.BotId, params }
      });
      const result = results.find(item => item.code === ResultCode.Ok);

      return result || createResult(ResultCode.Warn, 'Media send not supported or failed', null);
    } catch {
      return createResult(ResultCode.Fail, 'Failed to send media to channel', null);
    }
  };

  /**
   * 发送媒体到用户
   * @param userId 用户 ID
   */
  const sendUser = async (params: MediaParams & { userId: string; BotId?: string }): Promise<Result> => {
    if (!params.userId) {
      return createResult(ResultCode.FailParams, 'Missing UserId', null);
    }
    try {
      const results = await sendAction({
        action: 'media.send.user',
        payload: { UserId: params.userId, BotId: params.BotId, params }
      });
      const result = results.find(item => item.code === ResultCode.Ok);

      return result || createResult(ResultCode.Warn, 'Media send not supported or failed', null);
    } catch {
      return createResult(ResultCode.Fail, 'Failed to send media to user', null);
    }
  };

  /** Preferred scoped media API for group/C2C platforms. */
  const send = async (params: MediaParams & { target: MediaTarget }): Promise<Result> => {
    if (!params.target?.targetId) {
      return createResult(ResultCode.FailParams, 'Missing targetId', null);
    }
    if (!validateSource(params)) {
      return createResult(ResultCode.FailParams, 'Provide exactly one media source', null);
    }
    try {
      const results = await sendAction({
        action: 'media.send',
        payload: {
          target: params.target,
          params
        }
      });
      const result = results.find(item => item.code === ResultCode.Ok);

      return result || createResult(ResultCode.Warn, 'Media send not supported or failed', null);
    } catch {
      return createResult(ResultCode.Fail, 'Failed to send media', null);
    }
  };

  const media = {
    upload,
    sendChannel,
    sendUser,
    send
  };

  return [media] as const;
};
