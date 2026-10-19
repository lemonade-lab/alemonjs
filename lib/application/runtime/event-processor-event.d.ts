import { EventKeys, Events } from "../../types/event/map.js";
import { Next } from "../../types/cycle/index.js";
import "../../types/index.js";
//#region src/application/runtime/event-processor-event.d.ts
/**
 * 消息体处理机制
 * @param event
 * @param key
 */
declare const expendEvent: <T extends EventKeys>(valueEvent: Events[T], select: T, next: Next) => void;
//#endregion
export { expendEvent };