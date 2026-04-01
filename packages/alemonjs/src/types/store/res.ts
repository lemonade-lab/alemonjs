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
 * 文件树节点 — 将扁平的文件数组按 stateKey 层级组织为树
 */
export type FileTreeNode = {
  /** 该层级的局部中间件 */
  middleware?: StoreResponseItem;
  /** 该层级的 handler 文件 */
  files: StoreResponseItem[];
  /** 子目录 */
  children: Map<string, FileTreeNode>;
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
  middlewareResponse: {
    [key: string]: StoreResponseItem;
  };
  cycle: ChildrenCycle;
  register?: childrenCallbackRes;
};
