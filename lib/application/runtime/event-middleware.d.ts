import { OnMiddlewareReversalFunc, OnMiddlewareReversalFuncBack } from "../../types/event/index.js";
import "../../types/index.js";
//#region src/application/runtime/event-middleware.d.ts
/**
 * 中间件
 * @param select 事件选择
 * @param callback 回调函数，处理事件和 API
 * @throws {Error} - 如果 select 无效，抛出错误。
 * @throws {Error} - 如果 callback 无效，抛出错误。
 * @returns
 */
declare const onMiddleware: OnMiddlewareReversalFunc;
/**
 * 废弃，请使用 onMiddleware
 * @deprecated
 * @param select
 * @param callback
 * @returns
 */
declare const OnMiddleware: OnMiddlewareReversalFuncBack;
//#endregion
export { OnMiddleware, onMiddleware };