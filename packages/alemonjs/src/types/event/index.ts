import { ChildrenCycle, Next } from '../cycle';
import { ClientAPI } from '../client';
import { EventKeys, Events } from './map';
import { DataEnums } from '../message';

/**
 * 当前结果
 */
export type CurrentResult = {
  allowGrouping?: boolean;
  data?: DataEnums[];
  [key: string]: any;
};

export type CurrentResultValue = void | CurrentResult['allowGrouping'] | CurrentResult | CurrentResult['data'];

/**
 * 当前事件
 */
export type Current<T extends EventKeys> = (event: Events[T], next: Next) => CurrentResultValue;

// 返回值类型
export type OnResponseValue<C, T extends EventKeys> = {
  current: C; // current 类型直接使用 callback 的类型
  select: T | T[];
};

/**
 * 定义一个响应
 */
export type OnResponseFunc = <T extends EventKeys, C extends Current<T> | Current<T>[]>(callback: C, select: T | T[]) => OnResponseValue<C, T>;

export type OnResponseReversalFunc = <T extends EventKeys, C extends Current<T> | Current<T>[]>(select: T | T[], callback: C) => OnResponseValue<C, T>;

/**
 * 废弃
 * @deprecated
 */
export type OnResponseReversalFuncBack = <T extends EventKeys, C extends Current<T> | Current<T>[]>(callback: C, select: T | T[]) => OnResponseValue<C, T>;

/**
 * 定义一个中间件
 */
export type OnMiddlewareFunc = <T extends EventKeys, C extends Current<T> | Current<T>[]>(callback: C, select: T | T[]) => OnMiddlewareValue<C, T>;

/**
 *
 */
export type OnMiddlewareReversalFunc = <T extends EventKeys, C extends Current<T> | Current<T>[]>(select: T | T[], callback: C) => OnMiddlewareValue<C, T>;

/**
 * 废弃
 * @deprecated
 */
export type OnMiddlewareReversalFuncBack = <C extends Current<T> | Current<T>[], T extends EventKeys>(callback: C, select: T | T[]) => OnMiddlewareValue<C, T>;

export type OnMiddlewareValue<C, T extends EventKeys> = {
  current: C; // current 类型直接使用 callback 的类型
  select: T | T[];
};

/**
 * 定义子模块
 */
export type DefineChildrenValue = {
  _name: 'app';
  callback: DefineChildrenCallback;
};

export type DefineChildrenFunc = (callback: (() => childrenCallback) | childrenCallback) => DefineChildrenValue;

/**
 * 函数
 */
export type DefinePlatformCallback = (() => Promise<ClientAPI> | ClientAPI) | ClientAPI;
/**
 * 返回值
 */
export type DefinePlatformValue = {
  _name: 'platform';
  callback: DefinePlatformCallback;
};
/**
 * 定义一个平台
 */
export type DefinePlatformFunc = (callback: DefinePlatformCallback) => DefinePlatformValue;

/**
 * 定义选择器
 */
export type OnSelectsFunc = <T extends EventKeys[] | EventKeys>(values: T) => T;

/**
 * 定义数据格式
 */
export type OnDataFormatFunc = (...data: DataEnums[]) => DataEnums[];

export type OnGroupItem<C = any, T extends EventKeys = EventKeys> = OnResponseValue<C, T> | OnMiddlewareValue<C, T>;

export type OnGroupFunc = <C, T extends EventKeys, TFirst extends OnGroupItem<C, T>>(...calls: [TFirst, ...Array<TFirst>]) => TFirst;

export type ResponseRoute = {
  regular?: RegExp;
  selects?: EventKeys | EventKeys[];
  handler: () => Promise<any>;
  children?: ResponseRoute[];
};

export type DefineResponseFunc = (responses: ResponseRoute[]) => { current: ResponseRoute[] };

export type defineMiddlewareFunc = (middleware: ResponseRoute[]) => { current: ResponseRoute[] };

export type childrenCallbackRes = { response?: ReturnType<DefineResponseFunc>; middleware?: ReturnType<defineMiddlewareFunc> } | void;

export type childrenCallback = ChildrenCycle & {
  register?: () => (childrenCallbackRes | void) | Promise<childrenCallbackRes | void>;
};

export type DefineChildrenCallback = (() => Promise<childrenCallback> | childrenCallback) | childrenCallback;
