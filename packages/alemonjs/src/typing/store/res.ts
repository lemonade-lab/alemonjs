import { Events } from '../event/map'

export type StoreResponseItem = {
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
  //
  value?: {
    // 事件
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
  //
  value?: {
    // 事件
    select: string
  } | null
}

export type StoreMiddleware = {
  [key in keyof Events]: StoreResponseItem[]
}

export type StoreResponse = {
  [key in keyof Events]: StoreMiddlewareItem[]
}
