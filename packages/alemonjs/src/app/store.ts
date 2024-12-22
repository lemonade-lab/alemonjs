import { StoreMiddlewareItem, StoreResponseItem } from '../typing/store/res'
if (!global.storeResponse) global.storeResponse = []
if (!global.storeMiddleware) global.storeMiddleware = []
export const ResStore: {
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
} = {
  'message.create': [],
  'message.update': [],
  'message.delete': [],
  'message.reaction.add': [],
  'message.reaction.remove': [],
  'private.message.create': [],
  'private.message.update': [],
  'private.message.delete': [],
  'private.friend.add': [],
  'private.guild.add': [],
  'channal.create': [],
  'channal.delete': [],
  'guild.join': [],
  'guild.exit': [],
  'member.add': [],
  'member.remove': []
}
export const MWStore: {
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
} = {
  'message.create': [],
  'message.update': [],
  'message.delete': [],
  'message.reaction.add': [],
  'message.reaction.remove': [],
  'private.message.create': [],
  'private.message.update': [],
  'private.message.delete': [],
  'private.friend.add': [],
  'private.guild.add': [],
  'channal.create': [],
  'channal.delete': [],
  'guild.join': [],
  'guild.exit': [],
  'member.add': [],
  'member.remove': []
}
/**
 * @param val
 */
export const pushResponseFiles = (val: StoreResponseItem) => {
  global.storeResponse.push(val)
}
export const pushMiddlewareFiles = (val: StoreMiddlewareItem) => {
  global.storeMiddleware.push(val)
}
