import { EventKeys, Events } from "../../types/event/map.js";
import "../../types/index.js";
//#region src/application/runtime/event-processor.d.ts
/**
 * 消息处理器
 * @param name
 * @param event
 * @param data
 * @returns
 */
declare const onProcessor: <T extends EventKeys>(name: T, event: Events[T], data?: any) => void;
/**
 * 消息处理器
 * @param event
 * @param name
 * @deprecated 该方法已被弃用，请使用 onProcessor() 替代。
 * @returns
 */
declare const OnProcessor: <T extends EventKeys>(event: Events[T], name: T) => void;
//#endregion
export { OnProcessor, onProcessor };