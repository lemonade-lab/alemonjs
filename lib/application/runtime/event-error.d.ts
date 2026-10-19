import { EventErrorContext } from "../../types/cycle/index.js";
import "../../types/index.js";
//#region src/application/runtime/event-error.d.ts
/**
 * 分发给 app 级 onEventError。
 * 返回 true 表示继续当前链路，false 表示终止。
 */
declare const dispatchEventError: (context: EventErrorContext) => Promise<boolean>;
//#endregion
export { dispatchEventError };