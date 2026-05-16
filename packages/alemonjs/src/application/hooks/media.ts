import { EventKeys, Events, Result, ResultCode, createResult, getEventOrThrow, sendAction } from './common';

/**
 * 媒体管理（图片/音频/视频/文件）
 * @param event 事件上下文
 */
export const useMedia = <T extends EventKeys>(event?: Events[T]) => {
  const valueEvent = getEventOrThrow(event);

  type MediaType = 'image' | 'audio' | 'video' | 'file';

  /**
   * 上传媒体文件（仅上传，不发送）
   * @param params.type 媒体类型
   * @param params.url 文件 URL
   * @param params.data base64 数据
   * @param params.name 文件名
   */
  const upload = async (params: { type: MediaType; url?: string; data?: string; name?: string }): Promise<Result> => {
    try {
      const results = await sendAction({
        action: 'media.upload',
        payload: { params }
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
  const sendChannel = async (params: { type: MediaType; url?: string; data?: string; name?: string; channelId?: string }): Promise<Result> => {
    const cid = params.channelId || (valueEvent as any).ChannelId;

    if (!cid) {
      return createResult(ResultCode.FailParams, 'Missing ChannelId', null);
    }
    try {
      const results = await sendAction({
        action: 'media.send.channel',
        payload: { ChannelId: cid, params: { type: params.type, url: params.url, data: params.data, name: params.name } }
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
  const sendUser = async (params: { userId: string; type: MediaType; url?: string; data?: string; name?: string }): Promise<Result> => {
    if (!params.userId) {
      return createResult(ResultCode.FailParams, 'Missing UserId', null);
    }
    try {
      const results = await sendAction({
        action: 'media.send.user',
        payload: { UserId: params.userId, params: { type: params.type, url: params.url, data: params.data, name: params.name } }
      });
      const result = results.find(item => item.code === ResultCode.Ok);

      return result || createResult(ResultCode.Warn, 'Media send not supported or failed', null);
    } catch {
      return createResult(ResultCode.Fail, 'Failed to send media to user', null);
    }
  };

  const media = {
    upload,
    sendChannel,
    sendUser
  };

  return [media] as const;
};
