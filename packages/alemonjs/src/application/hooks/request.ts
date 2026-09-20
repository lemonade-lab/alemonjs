import type { ActionContext, MessagingActionMap } from '../../types';
import { createActionCaller, resolveActionContext } from './action-context';
import { Result, ResultCode, createResult, sendAction } from './common';

/**
 * 请求处理（好友请求、入群请求等）
 */
export const useRequest = (context?: ActionContext) => {
  const event = resolveActionContext(context);
  const call = createActionCaller(event);
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
        payload: { event, BotId: event.BotId, params: { flag: params.flag, approve: params.approve, remark: params.remark } }
      });
      const result = results.find(item => item.code === ResultCode.Ok);

      return result || results[0] || createResult(ResultCode.Warn, 'Friend request handling not supported or failed', null);
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
        payload: { event, BotId: event.BotId, params: { flag: params.flag, subType: params.subType, approve: params.approve, reason: params.reason } }
      });
      const result = results.find(item => item.code === ResultCode.Ok);

      return result || results[0] || createResult(ResultCode.Warn, 'Guild request handling not supported or failed', null);
    } catch {
      return createResult(ResultCode.Fail, 'Failed to handle guild request', null);
    }
  };

  const request = {
    list: (params: MessagingActionMap['request.guild.list'][0] = {}) => call('request.guild.list', params),
    decide: (params: MessagingActionMap['request.guild.decide'][0]) => call('request.guild.decide', params),
    policies: {
      list: (params: MessagingActionMap['request.policy.list'][0] = {}) => call('request.policy.list', params),
      create: (params: MessagingActionMap['request.policy.create'][0]) => call('request.policy.create', params),
      update: (params: MessagingActionMap['request.policy.update'][0]) => call('request.policy.update', params),
      delete: (id: string) => call('request.policy.delete', { id }),
      execute: (id: string) => call('request.policy.execute', { id }),
      updateWhitelist: (params: MessagingActionMap['request.policy.whitelist'][0]) => call('request.policy.whitelist', params)
    },
    friend,
    guild
  };

  return [request] as const;
};
