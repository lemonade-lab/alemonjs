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
  [key: string]: StoreResponseItem[]
  'message.create': StoreResponseItem[]
  'message.update': StoreResponseItem[]
  'message.delete': StoreResponseItem[]
  'message.reaction.add': StoreResponseItem[]
  'message.reaction.remove': StoreResponseItem[]
  'private.message.create': StoreResponseItem[]
  'private.message.update': StoreResponseItem[]
  'private.message.delete': StoreResponseItem[]
  'private.friend.add': StoreResponseItem[]
  'private.guild.add': StoreResponseItem[]
  'channal.create': StoreResponseItem[]
  'channal.delete': StoreResponseItem[]
  'guild.join': StoreResponseItem[]
  'guild.exit': StoreResponseItem[]
  'member.add': StoreResponseItem[]
  'member.remove': StoreResponseItem[]
}

export type StoreResponse = {
  [key: string]: StoreMiddlewareItem[]
  'message.create': StoreMiddlewareItem[]
  'message.update': StoreMiddlewareItem[]
  'message.delete': StoreMiddlewareItem[]
  'message.reaction.add': StoreMiddlewareItem[]
  'message.reaction.remove': StoreMiddlewareItem[]
  'private.message.create': StoreMiddlewareItem[]
  'private.message.update': StoreMiddlewareItem[]
  'private.message.delete': StoreMiddlewareItem[]
  'private.friend.add': StoreMiddlewareItem[]
  'private.guild.add': StoreMiddlewareItem[]
  'channal.create': StoreMiddlewareItem[]
  'channal.delete': StoreMiddlewareItem[]
  'guild.join': StoreMiddlewareItem[]
  'guild.exit': StoreMiddlewareItem[]
  'member.add': StoreMiddlewareItem[]
  'member.remove': StoreMiddlewareItem[]
}
