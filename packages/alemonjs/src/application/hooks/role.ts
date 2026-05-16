import { EventKeys, Events, Result, ResultCode, RoleInfo, createResult, getEventOrThrow, sendAction } from './common';

/**
 * 角色管理
 * @param event 事件上下文
 */
export const useRole = <T extends EventKeys>(event?: Events[T]) => {
  const valueEvent = getEventOrThrow(event);

  const getGuildId = (guildId?: string) => guildId || (valueEvent as any).GuildId;

  /**
   * 获取角色列表
   */
  const list = async (params?: { guildId?: string }): Promise<Result<RoleInfo[]>> => {
    const gid = getGuildId(params?.guildId);

    if (!gid) {
      return createResult(ResultCode.FailParams, 'Missing GuildId', []);
    }
    try {
      const results = await sendAction({
        action: 'role.list',
        payload: { GuildId: gid }
      });
      const result = results.find(item => item.code === ResultCode.Ok);

      if (result) {
        return createResult(ResultCode.Ok, 'Successfully retrieved role list', result.data ?? []);
      }

      return createResult(ResultCode.Warn, 'No role list found', []);
    } catch {
      return createResult(ResultCode.Fail, 'Failed to get role list', []);
    }
  };

  /**
   * 创建角色
   */
  const create = async (params: { name: string; color?: number; permissions?: string; guildId?: string }): Promise<Result<RoleInfo | null>> => {
    const gid = getGuildId(params.guildId);

    if (!gid) {
      return createResult(ResultCode.FailParams, 'Missing GuildId', null);
    }
    try {
      const results = await sendAction({
        action: 'role.create',
        payload: { GuildId: gid, params: { name: params.name, color: params.color, permissions: params.permissions } }
      });
      const result = results.find(item => item.code === ResultCode.Ok);

      return result ? createResult(ResultCode.Ok, 'Role created', result.data ?? null) : createResult(ResultCode.Warn, 'Create not supported or failed', null);
    } catch {
      return createResult(ResultCode.Fail, 'Failed to create role', null);
    }
  };

  /**
   * 更新角色
   */
  const update = async (params: { roleId: string; name?: string; color?: number; permissions?: string; guildId?: string }): Promise<Result> => {
    const gid = getGuildId(params.guildId);

    if (!gid || !params.roleId) {
      return createResult(ResultCode.FailParams, 'Missing GuildId or RoleId', null);
    }
    try {
      const results = await sendAction({
        action: 'role.update',
        payload: { GuildId: gid, RoleId: params.roleId, params: { name: params.name, color: params.color, permissions: params.permissions } }
      });
      const result = results.find(item => item.code === ResultCode.Ok);

      return result || createResult(ResultCode.Warn, 'Update not supported or failed', null);
    } catch {
      return createResult(ResultCode.Fail, 'Failed to update role', null);
    }
  };

  /**
   * 删除角色
   */
  const remove = async (params: { roleId: string; guildId?: string }): Promise<Result> => {
    const gid = getGuildId(params.guildId);

    if (!gid || !params.roleId) {
      return createResult(ResultCode.FailParams, 'Missing GuildId or RoleId', null);
    }
    try {
      const results = await sendAction({
        action: 'role.delete',
        payload: { GuildId: gid, RoleId: params.roleId }
      });
      const result = results.find(item => item.code === ResultCode.Ok);

      return result || createResult(ResultCode.Warn, 'Delete not supported or failed', null);
    } catch {
      return createResult(ResultCode.Fail, 'Failed to delete role', null);
    }
  };

  /**
   * 为成员分配角色
   */
  const assign = async (params: { userId: string; roleId: string; guildId?: string }): Promise<Result> => {
    const gid = getGuildId(params.guildId);

    if (!gid || !params.userId || !params.roleId) {
      return createResult(ResultCode.FailParams, 'Missing GuildId, UserId or RoleId', null);
    }
    try {
      const results = await sendAction({
        action: 'role.assign',
        payload: { GuildId: gid, UserId: params.userId, RoleId: params.roleId }
      });
      const result = results.find(item => item.code === ResultCode.Ok);

      return result || createResult(ResultCode.Warn, 'Assign not supported or failed', null);
    } catch {
      return createResult(ResultCode.Fail, 'Failed to assign role', null);
    }
  };

  /**
   * 移除成员角色
   */
  const revoke = async (params: { userId: string; roleId: string; guildId?: string }): Promise<Result> => {
    const gid = getGuildId(params.guildId);

    if (!gid || !params.userId || !params.roleId) {
      return createResult(ResultCode.FailParams, 'Missing GuildId, UserId or RoleId', null);
    }
    try {
      const results = await sendAction({
        action: 'role.remove',
        payload: { GuildId: gid, UserId: params.userId, RoleId: params.roleId }
      });
      const result = results.find(item => item.code === ResultCode.Ok);

      return result || createResult(ResultCode.Warn, 'Remove not supported or failed', null);
    } catch {
      return createResult(ResultCode.Fail, 'Failed to remove role', null);
    }
  };

  const role = {
    list,
    create,
    update,
    delete: remove,
    assign,
    remove: revoke
  };

  return [role] as const;
};
