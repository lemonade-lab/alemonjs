import { Result } from "../../common/result.js";
import { ActionContext } from "../../types/messaging.js";
import { EventKeys, Events } from "../../types/event/map.js";
import "../../types/index.js";
import "./common.js";
//#region src/application/hooks/permission.d.ts
/**
 * 频道权限管理
 * @param event 事件上下文
 */
declare const usePermission: <T extends EventKeys>(event?: Events[T] | ActionContext) => readonly [{
  get: (params: {
    userId: string;
    channelId?: string;
  }) => Promise<Result>;
  set: (params: {
    userId: string;
    allow?: string;
    deny?: string;
    channelId?: string;
  }) => Promise<Result>;
  getRole: (params: {
    roleId: string;
    channelId?: string;
  }) => Promise<Result>;
  setRole: (params: {
    roleId: string;
    allow?: string;
    deny?: string;
    channelId?: string;
  }) => Promise<Result>;
}];
//#endregion
export { usePermission };