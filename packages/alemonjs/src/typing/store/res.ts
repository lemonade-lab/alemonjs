import { EventKeys } from '../event/map'

export type StoreResponseItem = {
  /**
   * 来源
   */
  source: string
  /**
   * 目录
   */
  dir: string
  /**
   * 文件路径
   */
  path: string
  /**
   * 文件名
   */
  name: string
  /**
   * 节点
   */
  node: string
  /**
   *
   */
  state?: string
  /**
   *
   */
  value?: {
    /**
     * 事件
     */
    select: string
  } | null
}

export type StoreMiddlewareItem = {
  /**
   * 来源
   */
  source: string
  // 目录
  dir: string
  // 文件路径
  path: string
  // 文件名
  name: string
  // 节点
  node: string
  // 状态
  state?: string
  //
  value?: {
    // 事件
    select: string
  } | null
}

/**
 *
 */
export type StoreMiddleware = {
  [key in EventKeys]: StoreResponseItem[]
}

/**
 *
 */
export type StoreResponse = {
  [key in EventKeys]: StoreMiddlewareItem[]
}

/**
 *
 */
export type StoreChildrenApp = {
  name: string
  middleware: StoreMiddlewareItem[]
  response: StoreResponseItem[]
}
