import { Result } from "../../common/result.js";
import { ActionTarget } from "../../types/actions.js";
import { ActionContext, MessagingActionMap } from "../../types/messaging.js";
import "../../types/index.js";
import "./common.js";
//#region src/application/hooks/action-context.d.ts
declare const resolveActionContext: (context?: ActionContext) => ActionContext;
declare const resolveActionTarget: (context: ActionContext) => ActionTarget | undefined;
/** Internal typed action dispatcher, shared by semantic public hooks. */
declare const createActionCaller: (context?: ActionContext) => <K extends keyof MessagingActionMap>(action: K, params: MessagingActionMap[K][0]) => Promise<Result<MessagingActionMap[K][1]>>;
//#endregion
export { createActionCaller, resolveActionContext, resolveActionTarget };