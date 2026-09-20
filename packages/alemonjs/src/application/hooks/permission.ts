import type { ActionContext } from '../../types';
import { EventKeys, Events, Result, ResultCode, createResult, sendAction } from './common';
import { resolveActionContext, resolveActionTarget } from './action-context';

/**
 * 频道权限管理
 * @param event 事件上下文
 */
export const usePermission = <T extends EventKeys>(event?: Events[T] | ActionContext) => {
  const valueEvent = resolveActionContext(event as ActionContext | undefined);
  const target = (channelId?: string) =>
    resolveActionTarget(valueEvent) ?? (channelId ? { scope: 'channel' as const, targetId: channelId, BotId: valueEvent.BotId } : undefined);

  /**
   * 获取用户在频道中的权限
   * @param userId 用户 ID
   * @param channelId 频道 ID（不传则使用事件上下文）
   */
  const get = async (params: { userId: string; channelId?: string }): Promise<Result> => {
    const cid = params.channelId || (valueEvent as any).ChannelId;

    if (!cid || !params.userId) {
      return createResult(ResultCode.FailParams, 'Missing ChannelId or UserId', null);
    }
    try {
      const results = await sendAction({
        action: 'permission.get',
        payload: { event: valueEvent, ChannelId: cid, UserId: params.userId, ...(target(cid) && { target: target(cid) }) }
      });
      const result = results.find(item => item.code === ResultCode.Ok);

      return result || createResult(ResultCode.Warn, 'Permission get not supported or failed', null);
    } catch {
      return createResult(ResultCode.Fail, 'Failed to get permission', null);
    }
  };

  /**
   * 设置用户在频道中的权限
   * @param userId 用户 ID
   * @param params.allow 允许的权限位
   * @param params.deny 拒绝的权限位
   * @param channelId 频道 ID（不传则使用事件上下文）
   */
  const set = async (params: { userId: string; allow?: string; deny?: string; channelId?: string }): Promise<Result> => {
    const cid = params.channelId || (valueEvent as any).ChannelId;

    if (!cid || !params.userId) {
      return createResult(ResultCode.FailParams, 'Missing ChannelId or UserId', null);
    }
    try {
      const results = await sendAction({
        action: 'permission.set',
        payload: {
          event: valueEvent,
          ChannelId: cid,
          UserId: params.userId,
          ...(target(cid) && { target: target(cid) }),
          params: { allow: params.allow, deny: params.deny }
        }
      });
      const result = results.find(item => item.code === ResultCode.Ok);

      return result || createResult(ResultCode.Warn, 'Permission set not supported or failed', null);
    } catch {
      return createResult(ResultCode.Fail, 'Failed to set permission', null);
    }
  };

  const getRole = async (params: { roleId: string; channelId?: string }): Promise<Result> => {
    const cid = params.channelId || (valueEvent as any).ChannelId;

    return action('permission.role.get', { event: valueEvent, ChannelId: cid, RoleId: params.roleId, ...(target(cid) && { target: target(cid) }) });
  };

  const setRole = async (params: { roleId: string; allow?: string; deny?: string; channelId?: string }): Promise<Result> => {
    const cid = params.channelId || (valueEvent as any).ChannelId;

    return action('permission.role.set', { event: valueEvent, ChannelId: cid, RoleId: params.roleId, ...(target(cid) && { target: target(cid) }), params });
  };

  const action = async (name: string, payload: object): Promise<Result> => {
    const results = await sendAction({ action: name, payload });

    return results.find(item => item.code === ResultCode.Ok) || createResult(ResultCode.Fail, results[0]?.message || `${name} failed`, null);
  };

  const permission = {
    get,
    set,
    getRole,
    setRole
  };

  return [permission] as const;
};
