import { existsSync, mkdirSync, readdirSync, writeFileSync } from 'fs'
import { promisify } from 'util'
import { join } from 'path'
import { orderBy } from 'lodash'
/* 非依赖引用 */
import { Messgetype, CmdType } from './types'

/* 全局 */
declare global {
  //功能对象
  var Apps: CmdType
  //指令对象
  var command: CmdType
}

/* 对话状态类型 */
type ConversationState = {
  step: number
  data: any
}

/* 对话处理函数类型 */
type ConversationHandler = (e: Messgetype, state: ConversationState) => Promise<void>

const createApps = () => {
  global.Apps = {
    GUILD_MESSAGES: {},
    FORUMS_EVENT: {},
    FORUMS: {},
    MESSAGES: {},
    PUBLIC_GUILD_MESSAGES: {},
    OPEN_FORUMS_EVENT: {},
    GUILDS: {},
    GUILD_MEMBERS: {},
    GUILD_MESSAGE_REACTIONS: {},
    DIRECT_MESSAGE: {},
    INTERACTION: {},
    AUDIO_ACTION: {}
  }

  global.command = {
    GUILD_MESSAGES: [],
    FORUMS_EVENT: [],
    FORUMS: [],
    MESSAGES: [],
    PUBLIC_GUILD_MESSAGES: [],
    OPEN_FORUMS_EVENT: [],
    GUILDS: [],
    GUILD_MEMBERS: [],
    GUILD_MESSAGE_REACTIONS: [],
    DIRECT_MESSAGE: [],
    INTERACTION: [],
    AUDIO_ACTION: []
  }
}

/* Redis操作函数 */
const getAsync = promisify(redis.get).bind(redis)
const setAsync = promisify(redis.set).bind(redis)
const delAsync = promisify(redis.del).bind(redis)

// const getAsync = s => ''
// const setAsync = (s, q, a, b) => {}
// const delAsync = s => {}

// const getAsync = global.redis.get
// const setAsync = global.redis.set
// const delAsync = global.redis.del

async function synthesis(apps: object, appname: string, belong: string) {
  for (const item in apps) {
    let keys = new apps[item]()
    if (!keys['event'] || !keys['rule']) continue
    if (!global.Apps[keys['event']]) {
      console.log(` [${belong}]`, appname, `[EVENT][ERROR] ${keys['event']}`)
      continue
    }
    if (!global.Apps[keys['event']][belong]) {
      global.Apps[keys['event']][belong] = {}
    }
    if (!global.Apps[keys['event']][belong][appname]) {
      global.Apps[keys['event']][belong][appname] = {}
    }
    /* 类名 */
    global.Apps[keys['event']][belong][appname][item] = {}
    keys['rule'].forEach((key: any) => {
      //保存方法
      global.Apps[keys['event']][belong][appname][item][key['fnc']] = keys[key['fnc']]
      global.command[keys['event']].push({
        reg: key['reg'],
        priority: keys['priority'],
        data: {
          event: keys['event'],
          eventType: keys['eventType'],
          belong,
          type: appname,
          name: item,
          dsc: keys['dsc'],
          fnc: key['fnc']
        }
      })
    })
  }
}

/* program */
async function loadProgram(dir: string) {
  const belong = 'program'
  /* 初始化 */
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true })
  /* 读取文件 */
  const readDir = readdirSync(dir)
  /* 正则匹配ts文件并返回 */
  const flies = readDir.filter(item => /.(ts|js)$/.test(item))
  for (let appname of flies) {
    if (!existsSync(`${dir}/${appname}`)) {
      continue
    }
    const apps = {}
    const Program = await import(`${dir}/${appname}`).catch(error => {
      console.error(appname)
      console.error(error)
      process.exit()
    })
    for (const item in Program) {
      if (Program[item].prototype) {
        if (apps.hasOwnProperty(item)) {
          console.error(`[同名class export]  ${item}`)
        }
        apps[item] = Program[item]
      } else {
        console.error(`[非class export]  ${item}`)
      }
    }
    await synthesis(apps, appname, belong)
  }
}

/* plugins */
async function loadPlugins(dir: string) {
  const belong = 'plugins'
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true })
  const readDir = readdirSync(dir)
  for (let appname of readDir) {
    if (!existsSync(`${dir}/${appname}/index.js`) && !existsSync(`${dir}/${appname}/index.ts`)) {
      continue
    }
    const { apps } = await import(`${dir}/${appname}`).catch(error => {
      console.error(appname)
      console.error(error)
      process.exit()
    })
    await synthesis(apps, appname, belong)
  }
}

let commswich = false
/* create command  */
async function saveCommand(command: CmdType) {
  let data = {
    dec: '命令总览'
  }
  //消息事件
  for (let val in command) {
    data[val] = []
    //消息中的数组
    for (let item of command[val]) {
      data[val].push(item)
    }
  }
  writeFileSync(join(process.cwd(), '/config/command.json'), JSON.stringify(data, null, '\t'))
  if (!commswich) {
    commswich = true
    /* 初始打印 */
    console.info('[CREATE] /config/command.json')
  }
}

// 收集指令
export async function cmdInit() {
  createApps()
  await loadProgram(join(process.cwd(), '/example'))
  await loadPlugins(join(process.cwd(), '/plugins'))
  for (let val in command) {
    command[val] = orderBy(command[val], ['priority'], ['asc'])
  }
  if (cfg.sandbox) saveCommand(command)
}

/* 指令匹配 */
export async function InstructionMatching(e: Messgetype) {
  if (e.isRecall) return
  if (!command[e.event]) return
  /* 循环所有指令 */
  for (const val of command[e.event]) {
    const { reg, data } = val
    /* 正则匹配 */
    if (!new RegExp(reg).test(e.cmd_msg)) continue
    /* 搜索函数 */
    if (!cmdDetection(e, data)) continue
    try {
      /* 获取对话状态 */
      const state = await getConversationState(e.msg.author.id)
      /* 获取对话处理函数 */
      const handler = conversationHandlers.get(data.fnc)
      if (handler && state) {
        /* 如果用户处于对话状态，则调用对话处理函数 */
        await handler(e, state)
      } else {
        /* 否则，调用普通处理函数 */
        const ret = await Apps[data.event][data.belong][data.type][data.name]
          [data.fnc](e)
          .catch((err: any) => console.error(err))
        if (ret) break
      }
    } catch (err) {
      logErr(err, data)
    }
  }
}

/**
 * 不匹配指令的方法
 * 只用匹配类型函数
 * @param e
 * @returns
 */
export async function typeMessage(e: Messgetype) {
  if (!command[e.event]) return
  for (const val of command[e.event]) {
    const { data } = val
    /* 搜索函数 */
    if (!cmdDetection(e, data)) continue
    try {
      const ret = await Apps[data.event][data.belong][data.type][data.name]
        [data.fnc](e)
        .catch((err: any) => console.error(err))
      if (ret) break
    } catch (err) {
      logErr(err, data)
      return
    }
  }
}

function cmdDetection(e: Messgetype, data: any) {
  if (e.eventType != data.eventType) return false
  if (!Apps[data.event][data.belong][data.type][data.name][data.fnc]) return false
  return true
}

function logErr(err: any, data: any) {
  console.error(`[${data.event}][${data.belong}][${data.type}][${data.name}]]`)
  console.error(err)
}

/* 对话处理器 */
const conversationHandlers: Map<string, ConversationHandler> = new Map()

/* 注册对话处理函数 */
const registerConversationHandler = (name: string, handler: ConversationHandler) => {
  conversationHandlers.set(name, handler)
}

/* 获取对话状态 */
const getConversationState = async (userId: string): Promise<ConversationState | null> => {
  const state = await getAsync(`conversation-state:${userId}`)
  return state ? JSON.parse(state) : null
}

/* 保存对话状态 */
const setConversationState = async (userId: string, state: ConversationState): Promise<void> => {
  await setAsync(`conversation-state:${userId}`, JSON.stringify(state), 'EX', 3600)
}

/* 删除对话状态 */
const deleteConversationState = async (userId: string): Promise<void> => {
  await delAsync(`conversation-state:${userId}`)
}

/* 注册对话处理函数 */
registerConversationHandler('start-conversation', async (e, state) => {
  /* 处理会话的开始 */
  console.log(`开始与用户 ${e.msg.author.id} 进行会话`)
  /* 更新会话状态 */
  state.step = 1
  /* 保存会话状态 */
  await setConversationState(e.msg.author.id, state)
})

registerConversationHandler('continue-conversation', async (e, state) => {
  /* 处理会话的继续 */
  console.log(`用户 ${e.msg.author.id} 继续进行会话`)
  /* 更新会话状态 */
  state.step += 1
  /* 保存会话状态 */
  await setConversationState(e.msg.author.id, state)
})

registerConversationHandler('end-conversation', async (e, state) => {
  /* 处理会话的结束 */
  console.log(`结束与用户 ${e.msg.author.id} 进行会话`)
  /* 删除会话状态 */
  await deleteConversationState(e.msg.author.id)
})

/* 普通处理函数 */
const normalHandler = async (e: Messgetype) => {
  /* 处理普通指令 */
  console.log(`执行普通指令: ${e.cmd_msg}`)
}

/* 注册普通处理函数 */
registerConversationHandler('normal-handler', normalHandler)
