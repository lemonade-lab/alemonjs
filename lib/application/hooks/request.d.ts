import { Result } from "../../common/result.js";
import { PaginatedResult } from "../../types/standard.js";
import { ActionContext, JoinPolicyInfo, JoinRequestInfo, MessagingActionMap } from "../../types/messaging.js";
import "../../types/index.js";
import "../index.js";
import "./common.js";
//#region src/application/hooks/request.d.ts
/**
 * 请求处理（好友请求、入群请求等）
 */
declare const useRequest: (context?: ActionContext) => readonly [{
  list: (params?: MessagingActionMap['request.guild.list'][0]) => Promise<Result<PaginatedResult<JoinRequestInfo>>>;
  decide: (params: MessagingActionMap['request.guild.decide'][0]) => Promise<Result<unknown>>;
  policies: {
    list: (params?: MessagingActionMap['request.policy.list'][0]) => Promise<Result<PaginatedResult<JoinPolicyInfo>>>;
    create: (params: MessagingActionMap['request.policy.create'][0]) => Promise<Result<Pick<JoinPolicyInfo, "enabled" | "expiresAt" | "id">>>;
    update: (params: MessagingActionMap['request.policy.update'][0]) => Promise<Result<Pick<JoinPolicyInfo, "enabled" | "expiresAt">>>;
    delete: (id: string) => Promise<Result<unknown>>;
    execute: (id: string) => Promise<Result<unknown>>;
    updateWhitelist: (params: MessagingActionMap['request.policy.whitelist'][0]) => Promise<Result<Pick<JoinPolicyInfo, "id" | "updatedAt" | "whitelistCount">>>;
  };
  friend: (params: {
    flag: string;
    approve: boolean;
    remark?: string;
  }) => Promise<Result>;
  guild: (params: {
    flag: string;
    subType: string;
    approve: boolean;
    reason?: string;
  }) => Promise<Result>;
}];
//#endregion
export { useRequest };