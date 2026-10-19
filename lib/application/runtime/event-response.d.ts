import { OnResponseReversalFunc, OnResponseReversalFuncBack } from "../../types/event/index.js";
import "../../types/index.js";
//#region src/application/runtime/event-response.d.ts
/**
 * 处理响应事件
 * @param select 事件选择
 * @param callback 回调函数，处理事件和 API
 * @returns 回调函数的执行结果
 */
declare const onResponse: OnResponseReversalFunc;
/**
 * 废弃，请使用 onResponse
 * @deprecated
 * @param callback
 * @param select
 * @returns
 */
declare const OnResponse: OnResponseReversalFuncBack;
//#endregion
export { OnResponse, onResponse };