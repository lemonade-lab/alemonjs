type DbKey = {
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
    // 正则
    reg: RegExp
  } | null
}

type MWKey = {
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

declare global {
  var AppsFiles: DbKey[]
  var MWFiles: MWKey[]
}

if (!global.AppsFiles) {
  global.AppsFiles = []
}

if (!global.MWFiles) {
  global.MWFiles = []
}

//
export const ResStore: {
  [key: string]: DbKey[]
  'message.create': DbKey[]
  'message.update': DbKey[]
  'message.delete': DbKey[]
  'message.reaction.add': DbKey[]
  'message.reaction.remove': DbKey[]
  'private.message.create': DbKey[]
  'private.message.update': DbKey[]
  'private.message.delete': DbKey[]
  'private.friend.add': DbKey[]
  'private.guild.add': DbKey[]
  'channal.create': DbKey[]
  'channal.delete': DbKey[]
  'guild.join': DbKey[]
  'guild.exit': DbKey[]
  'member.add': DbKey[]
  'member.remove': DbKey[]
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

// 中间件
export const MWStore: {
  [key: string]: MWKey[]
  'message.create': MWKey[]
  'message.update': MWKey[]
  'message.delete': MWKey[]
  'message.reaction.add': MWKey[]
  'message.reaction.remove': MWKey[]
  'private.message.create': MWKey[]
  'private.message.update': MWKey[]
  'private.message.delete': MWKey[]
  'private.friend.add': MWKey[]
  'private.guild.add': MWKey[]
  'channal.create': MWKey[]
  'channal.delete': MWKey[]
  'guild.join': MWKey[]
  'guild.exit': MWKey[]
  'member.add': MWKey[]
  'member.remove': MWKey[]
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
 *
 * @param val
 */
export const pushAppsFiles = (val: DbKey) => {
  global.AppsFiles.push(val)
}

export const pushMWFiles = (val: MWKey) => {
  global.MWFiles.push(val)
}
