import { DefineRouterFunc } from "../types/event/index.js";
import "../types/index.js";
//#region src/application/define-router.d.ts
/**
 * Lazy load a response handler
 * @param fnc
 * @returns
 */
declare const lazy: <T extends {
  default: any;
}>(fnc: () => Promise<T>) => (() => Promise<T['default']>);
/**
 * 手动执行一个动态导入的 handler
 * @param loader 动态导入函数 `() => import('./response/xxx')`
 * @param args handler 的参数数组 `[event, next]`
 */
declare function runHandler(loader: () => Promise<any>, args: any[]): Promise<any>;
/**
 * 定义路由
 * 与 defineResponse 类似，但路由处理器是纯异步函数组件，
 * 内部自动根据 selects 来分类。
 * @param routes 路由配置数组
 * @returns
 */
declare const defineRouter: DefineRouterFunc;
//#endregion
export { defineRouter, lazy, runHandler };