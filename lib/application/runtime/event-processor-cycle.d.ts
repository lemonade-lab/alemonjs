import { EventKeys, Events } from "../../types/event/map.js";
import "../../types/index.js";
//#region src/application/runtime/event-processor-cycle.d.ts
/**
 * 消息体处理机制
 * @param event
 * @param key
 */
declare const expendCycle: <T extends EventKeys>(valueEvent: Events[T], select: T, _config?: any) => void;
//#endregion
export { expendCycle };