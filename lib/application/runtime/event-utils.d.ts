import { EventKeys } from "../../types/event/map.js";
import "../../types/index.js";
//#region src/application/runtime/event-utils.d.ts
type BaseMap = {
  [key: string]: unknown;
};
/**
 * 卸载模块
 * @param name
 * @throws {Error} - 如果 name 无效，抛出错误。
 */
declare const unChildren: (name?: string) => void;
/**
 * 创建选择器
 * @param values
 * @returns
 */
declare const onSelects: <T extends EventKeys[] | EventKeys>(values: T) => T;
/**
 * 废弃,请使用onSelects
 * @deprecated
 * @param values
 * @returns
 */
declare const createSelects: typeof onSelects;
/**
 * 创建原生value映射
 * @deprecated 试验性功能，请勿使用
 * @param event
 * @returns
 */
declare const createEventValue: <T extends keyof R, R extends BaseMap>(event: {
  value: R[T];
}) => R[T];
/**
 * 获取指定功能是启动还是关闭
 * ***
 * 当有其他地方调用时，
 * 默认值以第一次调用为准
 * ***
 * 功能名相同时，
 * 将会同时改变，因为状态是全局的
 * @param name 功能名
 * @param defaultValue 默认值，默认为 true
 * @deprecated 废弃。指令管理可直接配置禁用正则
 * @throws {Error} - 如果 name 不是字符串，或者 defaultValue 不是布尔值，抛出错误。
 */
declare const useState: <T extends string>(name: T, defaultValue?: boolean) => [boolean, (value: boolean) => void];
/**
 * 订阅状态变化
 * @param name 功能名
 * @param callback 回调函数
 * @deprecated 废弃。指令管理可直接配置禁用正则
 * @throws {Error} - 如果 callback 无效，抛出错误。
 */
declare const onState: <T extends string>(name: T, callback: (value: boolean) => void) => void;
/**
 * 取消订阅状态变化
 * @param name 功能名
 * @param callback 回调函数
 * @deprecated 废弃。指令管理可直接配置禁用正则
 * @throws {Error} - 如果 callback 无效，抛出错误。
 */
declare const unState: <T extends string>(name: T, callback: (value: boolean) => void) => void;
//#endregion
export { createEventValue, createSelects, onSelects, onState, unChildren, unState, useState };