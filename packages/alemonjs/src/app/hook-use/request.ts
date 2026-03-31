import { Result, ResultCode, createResult, sendAction } from './common';

/**
 * 请求处理（好友请求、入群请求等）
 */
export const useRequest = () => {
  /**
   * 处理好友请求
   * @param flag 请求标识
   * @param approve 是否同意
   * @param remark 备注（同意时有效）
   */
  const friend = async (params: { flag: string; approve: boolean; remark?: string }): Promise<Result> => {
    if (!params.flag) {
      return createResult(ResultCode.FailParams, 'Missing flag', null);
    }
    try {
      const results = await sendAction({
        action: 'request.friend',
        payload: { params: { flag: params.flag, approve: params.approve, remark: params.remark } }
      });
      const result = results.find(item => item.code === ResultCode.Ok);

      return result || createResult(ResultCode.Warn, 'Friend request handling not supported or failed', null);
    } catch {
      return createResult(ResultCode.Fail, 'Failed to handle friend request', null);
    }
  };

  /**
   * 处理加群/加服务器请求
   * @param flag 请求标识
   * @param subType 请求子类型（如 add / invite）
   * @param approve 是否同意
   * @param reason 拒绝理由（拒绝时有效）
   */
  const guild = async (params: { flag: string; subType: string; approve: boolean; reason?: string }): Promise<Result> => {
    if (!params.flag || !params.subType) {
      return createResult(ResultCode.FailParams, 'Missing flag or subType', null);
    }
    try {
      const results = await sendAction({
        action: 'request.guild',
        payload: { params: { flag: params.flag, subType: params.subType, approve: params.approve, reason: params.reason } }
      });
      const result = results.find(item => item.code === ResultCode.Ok);

      return result || createResult(ResultCode.Warn, 'Guild request handling not supported or failed', null);
    } catch {
      return createResult(ResultCode.Fail, 'Failed to handle guild request', null);
    }
  };

  const request = {
    friend,
    guild
  };

  return [request] as const;
};
