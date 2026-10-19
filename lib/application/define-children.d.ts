import { DefineChildrenFunc } from "../types/event/index.js";
import "../types/index.js";
//#region src/application/define-children.d.ts
/**
 * 定义子事件
 * @param callback
 * @throws {Error} - 如果 callback 无效，抛出错误。
 * @returns
 */
declare const defineChildren: DefineChildrenFunc;
//#endregion
export { defineChildren };