import { EventKeys } from "../../types/event/map.js";
import { childrenCallbackRes } from "../../types/event/index.js";
import { FileTreeNode, StoreChildrenApp, StoreMiddlewareItem, StoreResponseItem } from "../../types/store/res.js";
import { ChildrenCycle, EventCycleEnum } from "../../types/cycle/index.js";
import { ResponseState } from "../../types/state/index.js";
import { SinglyLinkedList } from "../../common/SinglyLinkedList.js";
import { StateSubscribeMap, SubscribeKeysMap, SubscribeValue } from "../../types/subscribe/index.js";
import "../../types/index.js";
import { Logger, logger, shutdownLogger } from "../../common/logger.js";
import "../index.js";
import KoaRouter from "koa-router";
//#region src/application/runtime/store.d.ts
type RuntimeAppStatus = 'discovered' | 'loading' | 'ready' | 'failed' | 'disposed';
type RuntimeAppCapability = {
  event: boolean;
  httpApi: boolean;
  web: boolean;
  schedule: boolean;
  expose: boolean;
};
type RuntimeAppError = {
  message: string;
  stack?: string;
  time: number;
};
type RuntimeAppRecord = {
  name: string;
  kind: 'main' | 'plugin';
  enabled: boolean;
  status: RuntimeAppStatus;
  rootDir: string;
  mainPath: string;
  error?: RuntimeAppError;
  capabilities: RuntimeAppCapability;
  createdAt: number;
  updatedAt: number;
};
declare const getRuntimeCore: () => {
  storeState: ResponseState;
  storeStateSubscribe: StateSubscribeMap;
  storeSubscribeList: SubscribeKeysMap;
  storeChildrenApp: {
    [key: string]: StoreChildrenApp;
  };
  runtimeApps?: {
    [key: string]: RuntimeAppRecord;
  };
  runtimeAppKoaRouters?: {
    [key: string]: KoaRouter[];
  };
};
declare class Core {
  constructor();
  get value(): {
    storeState: ResponseState;
    storeStateSubscribe: StateSubscribeMap;
    storeSubscribeList: SubscribeKeysMap;
    storeChildrenApp: {
      [key: string]: StoreChildrenApp;
    };
    runtimeApps?: {
      [key: string]: RuntimeAppRecord;
    };
    runtimeAppKoaRouters?: {
      [key: string]: KoaRouter[];
    };
  };
}
declare const registerRuntimeApp: (record: Omit<RuntimeAppRecord, 'createdAt' | 'updatedAt' | 'capabilities'> & {
  capabilities?: Partial<RuntimeAppCapability>;
}) => RuntimeAppRecord;
declare const updateRuntimeAppStatus: (name: string, status: RuntimeAppStatus, error?: unknown) => RuntimeAppRecord;
declare const updateRuntimeAppCapabilities: (name: string, capabilities: Partial<RuntimeAppCapability>) => RuntimeAppRecord;
declare const setRuntimeAppKoaRouters: (name: string, koaRouters?: KoaRouter | KoaRouter[]) => KoaRouter<any, {}>[];
declare const getRuntimeAppKoaRouters: (name: string) => KoaRouter<any, {}>[];
declare const clearRuntimeAppKoaRouters: (name: string) => void;
declare const listRuntimeAppKoaRouters: () => {
  name: string;
  routers: KoaRouter<any, {}>[];
}[];
declare const getRuntimeApp: (name: string) => RuntimeAppRecord;
declare const toRuntimeAppSnapshot: (item: RuntimeAppRecord) => {
  name: string;
  kind: 'main' | 'plugin';
  enabled: boolean;
  status: RuntimeAppStatus;
  rootDir: string;
  mainPath: string;
  createdAt: number;
  updatedAt: number;
  capabilities: {
    event: boolean;
    httpApi: boolean;
    web: boolean;
    schedule: boolean;
    expose: boolean;
  };
  error: {
    message: string;
    time: number;
  };
};
declare const listRuntimeApps: () => {
  name: string;
  kind: 'main' | 'plugin';
  enabled: boolean;
  status: RuntimeAppStatus;
  rootDir: string;
  mainPath: string;
  createdAt: number;
  updatedAt: number;
  capabilities: {
    event: boolean;
    httpApi: boolean;
    web: boolean;
    schedule: boolean;
    expose: boolean;
  };
  error: {
    message: string;
    time: number;
  };
}[];
declare const disposeRuntimeApp: (name: string) => RuntimeAppRecord;
declare const disposeAllRuntimeApps: () => {
  name: string;
  kind: 'main' | 'plugin';
  enabled: boolean;
  status: RuntimeAppStatus;
  rootDir: string;
  mainPath: string;
  createdAt: number;
  updatedAt: number;
  capabilities: {
    event: boolean;
    httpApi: boolean;
    web: boolean;
    schedule: boolean;
    expose: boolean;
  };
  error: {
    message: string;
    time: number;
  };
}[];
declare const hasRuntimeAppCapability: (name: string, capability: keyof RuntimeAppCapability) => boolean;
declare const bumpStoreVersion: () => void;
declare class Response {
  #private;
  get value(): StoreResponseItem[];
}
/**
 * @deprecated 已被 ResponseTree 替代，保留仅为兼容
 */
declare class ResponseMiddleware {
  find(name: string, stateKey: string): StoreResponseItem[];
}
/**
 * 中间件文件树 — 替代扁平 Middleware 数组
 * 复用 buildFileTree / mergeFileTree，无 middlewareResponse（中间件无嵌套中间件概念）
 */
declare class MiddlewareTree {
  #private;
  get value(): FileTreeNode;
}
/**
 * 文件响应体树 — 替代扁平 Response + ResponseMiddleware 的组合
 */
declare class ResponseTree {
  #private;
  get value(): FileTreeNode;
}
declare class ResponseRouter {
  #private;
  get value(): any[];
}
declare class MiddlewareRouter {
  #private;
  get value(): any[];
}
declare class Middleware {
  #private;
  get value(): StoreMiddlewareItem[];
}
declare class SubscribeList<T extends EventKeys> {
  #private;
  constructor(choice: EventCycleEnum, select: T);
  get value(): SinglyLinkedList<SubscribeValue>;
}
/**
 * 纯函数版 SubscribeList 访问 — 避免每次创建类实例的 GC 开销
 */
declare const getSubscribeList: <T extends EventKeys>(choice: EventCycleEnum, select: T) => SinglyLinkedList<SubscribeValue>;
declare class StateSubscribe {
  #private;
  constructor(name: string);
  on(callback: (value: boolean) => void): void;
  un(callback: (value: boolean) => void): void;
  get value(): ((value: boolean) => void)[];
}
/**
 * @deprecated 废弃。指令管理可直接配置禁用正则
 */
declare class State {
  #private;
  /**
   *
   * @param name
   * @param defaultValue 默认，允许匹配
   */
  constructor(name: string, defaultValue?: boolean);
  get value(): boolean;
  set value(value: boolean);
}
declare class ChildrenApp {
  #private;
  constructor(name?: string);
  register(config: childrenCallbackRes): void;
  /**
   * 推送响应体
   * @param data
   */
  pushResponse(data: StoreResponseItem[]): void;
  /**
   * 推送响应下的中间件
   */
  pushResponseMiddleware(data: {
    [key: string]: StoreResponseItem;
  }): void;
  /**
   * 推送中间件
   * @param data
   */
  pushMiddleware(data: StoreMiddlewareItem[]): void;
  /**
   * 推送周期
   * @param data
   */
  pushCycle(data: ChildrenCycle): void;
  /**
   * 挂载
   */
  on(): void;
  /**
   * 卸载
   */
  un(): void;
  /**
   * 获取
   */
  get value(): StoreChildrenApp;
}
declare const getChildrenApp: (name: string) => StoreChildrenApp;
declare const listChildrenApps: () => StoreChildrenApp[];
declare const ProcessorEventAutoClearMap: Map<unknown, unknown>;
declare const ProcessorEventUserAutoClearMap: Map<unknown, unknown>;
declare const core: {
  storeState: ResponseState;
  storeStateSubscribe: StateSubscribeMap;
  storeSubscribeList: SubscribeKeysMap;
  storeChildrenApp: {
    [key: string]: StoreChildrenApp;
  };
  runtimeApps?: {
    [key: string]: RuntimeAppRecord;
  };
  runtimeAppKoaRouters?: {
    [key: string]: KoaRouter[];
  };
};
//#endregion
export { ChildrenApp, Core, Logger, Middleware, MiddlewareRouter, MiddlewareTree, ProcessorEventAutoClearMap, ProcessorEventUserAutoClearMap, Response, ResponseMiddleware, ResponseRouter, ResponseTree, RuntimeAppCapability, RuntimeAppError, RuntimeAppRecord, RuntimeAppStatus, State, StateSubscribe, SubscribeList, bumpStoreVersion, clearRuntimeAppKoaRouters, core, disposeAllRuntimeApps, disposeRuntimeApp, getChildrenApp, getRuntimeApp, getRuntimeAppKoaRouters, getRuntimeCore, getSubscribeList, hasRuntimeAppCapability, listChildrenApps, listRuntimeAppKoaRouters, listRuntimeApps, logger, registerRuntimeApp, setRuntimeAppKoaRouters, shutdownLogger, toRuntimeAppSnapshot, updateRuntimeAppCapabilities, updateRuntimeAppStatus };