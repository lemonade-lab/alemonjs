import { Result } from "../../common/result.js";
import { RoleInfo } from "../../types/standard.js";
import { ActionContext } from "../../types/messaging.js";
import { EventKeys, Events } from "../../types/event/map.js";
import "../../types/index.js";
import "./common.js";
//#region src/application/hooks/role.d.ts
/**
 * 角色管理
 * @param event 事件上下文
 */
declare const useRole: <T extends EventKeys>(event?: Events[T] | ActionContext) => readonly [{
  list: (params?: {
    guildId?: string;
  }) => Promise<Result<RoleInfo[]>>;
  create: (params: {
    name: string;
    color?: number;
    permissions?: string;
    guildId?: string;
  }) => Promise<Result<RoleInfo | null>>;
  update: (params: {
    roleId: string;
    name?: string;
    color?: number;
    permissions?: string;
    guildId?: string;
  }) => Promise<Result>;
  delete: (params: {
    roleId: string;
    guildId?: string;
  }) => Promise<Result>;
  assign: (params: {
    userId: string;
    roleId: string;
    guildId?: string;
    channelId?: string;
  }) => Promise<Result>;
  remove: (params: {
    userId: string;
    roleId: string;
    guildId?: string;
    channelId?: string;
  }) => Promise<Result>;
}];
//#endregion
export { useRole };