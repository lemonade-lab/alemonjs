import { Result } from "../../common/result.js";
import { PaginatedResult } from "../../types/standard.js";
import { ActionContext, MessagingActionMap, PanelInfo } from "../../types/messaging.js";
import "../../types/index.js";
import "../index.js";
import "./common.js";
//#region src/application/hooks/panel.d.ts
/** Manage command panels and their audience. */
declare const usePanel: (context?: ActionContext) => readonly [{
  readonly list: (params: MessagingActionMap['panel.list'][0]) => Promise<Result<PaginatedResult<PanelInfo>>>;
  readonly create: (params: MessagingActionMap['panel.create'][0]) => Promise<Result<{
    id: string;
  }>>;
  readonly get: (id: string) => Promise<Result<PanelInfo>>;
  readonly update: (params: MessagingActionMap['panel.update'][0]) => Promise<Result<{
    version: number;
  }>>;
  readonly delete: (id: string) => Promise<Result<unknown>>;
  readonly updateTargets: (params: MessagingActionMap['panel.targets.update'][0]) => Promise<Result<unknown>>;
}];
//#endregion
export { usePanel };