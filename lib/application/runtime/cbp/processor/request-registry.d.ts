import { Result } from "../../../../common/result.js";
import "../../../../common/index.js";
//#region src/application/runtime/cbp/processor/request-registry.d.ts
type RequestReplyValue = Result[] | PromiseLike<Result[]>;
type RequestReplyResolve = (value: RequestReplyValue) => void;
declare const actionRequestResolves: Map<string, RequestReplyResolve>;
declare const apiRequestResolves: Map<string, RequestReplyResolve>;
declare const actionRequestTimeouts: Map<string, NodeJS.Timeout>;
declare const apiRequestTimeouts: Map<string, NodeJS.Timeout>;
//#endregion
export { actionRequestResolves, actionRequestTimeouts, apiRequestResolves, apiRequestTimeouts };