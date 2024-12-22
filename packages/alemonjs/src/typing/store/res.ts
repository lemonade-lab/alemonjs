export type StoreResponseItem = {
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
