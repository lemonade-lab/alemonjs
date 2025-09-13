import { childrenCallbackRes } from '../event/index';
import { ChildrenCycle } from '../cycle';
import { EventKeys } from '../event/map';

export type StoreResponseItem = {
  /**
   * 来源
   */
  input: string;
  /**
   * 目录
   */
  dir: string;
  /**
   * 文件路径
   */
  path: string;
  /**
   * 文件名
   */
  name: string;
  /**
   * 节点
   */
  appName: string;
  /**
   *
   */
  stateKey?: string;
  /**
   *
   */
  value?: {
    /**
     * 事件
     */
    select: string;
  } | null;
};

export type StoreMiddlewareItem = {
  /**
   * 来源
   */
  input: string;
  // 目录
  dir: string;
  // 文件路径
  path: string;
  // 文件名
  name: string;
  // 节点
  appName: string;
  // 状态
  stateKey?: string;
  //
  value?: {
    // 事件
    select: string;
  } | null;
};

/**
 *
 */
export type StoreMiddleware = {
  [key in EventKeys]: StoreResponseItem[];
};

/**
 *
 */
export type StoreResponse = {
  [key in EventKeys]: StoreMiddlewareItem[];
};

/**
 *
 */
export type StoreChildrenApp = {
  name: string;
  middleware: StoreMiddlewareItem[];
  response: StoreResponseItem[];
  cycle: ChildrenCycle;
  register?: childrenCallbackRes;
};
