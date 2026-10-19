import { EventKeys, Events } from "../../types/event/map.js";
import { Next } from "../../types/cycle/index.js";
import "../../types/index.js";
//#region src/application/runtime/event-processor-middleware.d.ts
/**
 * 处理中间件
 * @param event
 * @param select
 */
declare const expendMiddleware: <T extends EventKeys>(valueEvent: Events[T], select: T, next: Next) => void;
//#endregion
export { expendMiddleware };