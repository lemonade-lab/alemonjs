import { DataEnums } from "../message/index.js";
import { EventKeys, Events } from "./map.js";
import { ClientAPI } from "../client/index.js";
import { Expose } from "../../application/expose.js";
import { ChildrenCycle, Next } from "../cycle/index.js";
import { ContextConfiguration } from "../../application/context.js";
import KoaRouter from "koa-router";
//#region src/types/event/index.d.ts
/**
 * 当前事件
 * return true → 继续执行下一个 handler
 * return void/false → 停止当前链
 */
type Current<T extends EventKeys> = (event: Events[T], next: Next) => Promise<boolean | void | undefined> | boolean | void | undefined;
type OnResponseValue<C, T extends EventKeys> = {
  current: C;
  select: T | T[];
};
/**
 * 定义一个响应
 */
type OnResponseFunc = <T extends EventKeys, C extends Current<T> | Current<T>[]>(callback: C, select: T | T[]) => OnResponseValue<C, T>;
type OnResponseReversalFunc = <T extends EventKeys, C extends Current<T> | Current<T>[]>(select: T | T[], callback: C) => OnResponseValue<C, T>;
/**
 * 废弃
 * @deprecated
 */
type OnResponseReversalFuncBack = <T extends EventKeys, C extends Current<T> | Current<T>[]>(callback: C, select: T | T[]) => OnResponseValue<C, T>;
/**
 * 定义一个中间件
 */
type OnMiddlewareFunc = <T extends EventKeys, C extends Current<T> | Current<T>[]>(callback: C, select: T | T[]) => OnMiddlewareValue<C, T>;
/**
 *
 */
type OnMiddlewareReversalFunc = <T extends EventKeys, C extends Current<T> | Current<T>[]>(select: T | T[], callback: C) => OnMiddlewareValue<C, T>;
/**
 * 废弃
 * @deprecated
 */
type OnMiddlewareReversalFuncBack = <C extends Current<T> | Current<T>[], T extends EventKeys>(callback: C, select: T | T[]) => OnMiddlewareValue<C, T>;
type OnMiddlewareValue<C, T extends EventKeys> = {
  current: C;
  select: T | T[];
};
/**
 * 定义子模块
 */
type DefineChildrenValue = {
  _name: 'app';
  callback: DefineChildrenCallback;
};
type DefineChildrenFunc = (callback: (() => childrenCallback) | childrenCallback) => DefineChildrenValue;
/**
 * 函数
 */
type DefinePlatformCallback = (() => Promise<ClientAPI> | ClientAPI) | ClientAPI;
/**
 * 返回值
 */
type DefinePlatformValue = {
  _name: 'platform';
  callback: DefinePlatformCallback;
};
/**
 * 定义一个平台
 */
type DefinePlatformFunc = (callback: DefinePlatformCallback) => DefinePlatformValue;
/**
 * 定义选择器
 */
type OnSelectsFunc = <T extends EventKeys[] | EventKeys>(values: T) => T;
/**
 * 定义数据格式
 */
type OnDataFormatFunc = (...data: DataEnums[]) => DataEnums[];
type OnGroupItem<C = any, T extends EventKeys = EventKeys> = OnResponseValue<C, T> | OnMiddlewareValue<C, T>;
type OnGroupFunc = <C, T extends EventKeys, TFirst extends OnGroupItem<C, T>>(...calls: [TFirst, ...Array<TFirst>]) => TFirst;
type ResponseRoute = {
  /** 内部归属 appName */
  appName?: string;
  /** 平台类型 */
  platform?: string | string[];
  /** 正则匹配 */
  regular?: RegExp;
  /** 前缀匹配（比正则更快） */
  prefix?: string;
  /** 精确匹配（最快） */
  exact?: string;
  /** 选择事件类型,默认 res */
  selects?: EventKeys | EventKeys[];
  handler: () => Promise<any>;
  children?: ResponseRoute[];
};
type DefineResponseFunc = (responses: ResponseRoute[]) => {
  current: ResponseRoute[];
};
type DefineRouterFunc = (routes: ResponseRoute[]) => {
  current: ResponseRoute[];
};
type defineMiddlewareFunc = (middleware: ResponseRoute[]) => {
  current: ResponseRoute[];
};
type childrenCallbackRes = {
  response?: ReturnType<DefineResponseFunc>;
  middleware?: ReturnType<defineMiddlewareFunc>;
  responseRouter?: ReturnType<DefineRouterFunc>;
  middlewareRouter?: ReturnType<DefineRouterFunc>;
  /** 直接注册 Koa Router */
  koaRouter?: KoaRouter | KoaRouter[];
  /** expose 协议通信实例 */
  expose?: Expose;
  /** 在 responseRouter 前运行的活跃上下文定义。 */
  responseContent?: ContextConfiguration;
  /** 在 middlewareRouter 前运行的活跃上下文定义。 */
  middlewareContent?: ContextConfiguration;
} | undefined;
type childrenCallback = ChildrenCycle & {
  register?: () => (childrenCallbackRes | undefined) | Promise<childrenCallbackRes | undefined>;
};
type DefineChildrenCallback = (() => Promise<childrenCallback> | childrenCallback) | childrenCallback;
//#endregion
export { Current, DefineChildrenCallback, DefineChildrenFunc, DefineChildrenValue, DefinePlatformCallback, DefinePlatformFunc, DefinePlatformValue, DefineResponseFunc, DefineRouterFunc, OnDataFormatFunc, OnGroupFunc, OnGroupItem, OnMiddlewareFunc, OnMiddlewareReversalFunc, OnMiddlewareReversalFuncBack, OnMiddlewareValue, OnResponseFunc, OnResponseReversalFunc, OnResponseReversalFuncBack, OnResponseValue, OnSelectsFunc, ResponseRoute, childrenCallback, childrenCallbackRes, defineMiddlewareFunc };