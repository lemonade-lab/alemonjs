import { EventKeys, Events } from "../../types/event/map.js";
import { EventCycleEnum, Next } from "../../types/cycle/index.js";
import "../../types/index.js";
//#region src/application/runtime/event-processor-subscribe.d.ts
/**
 * 处理订阅
 * @param valueEvent
 * @param select
 * @param next
 * @param choose
 */
declare const expendSubscribe: <T extends EventKeys>(valueEvent: Events[T], select: T, next: Next, choose: EventCycleEnum) => void;
/**
 *
 * @param valueEvent
 * @param select
 * @param next
 */
declare const expendSubscribeCreate: <T extends EventKeys>(valueEvent: Events[T], select: T, next: Next) => void;
/**
 *
 * @param valueEvent
 * @param select
 * @param next
 */
declare const expendSubscribeMount: <T extends EventKeys>(valueEvent: Events[T], select: T, next: Next) => void;
/**
 *
 * @param valueEvent
 * @param select
 * @param next
 */
declare const expendSubscribeUnmount: <T extends EventKeys>(valueEvent: Events[T], select: T, next: Next) => void;
//#endregion
export { expendSubscribe, expendSubscribeCreate, expendSubscribeMount, expendSubscribeUnmount };