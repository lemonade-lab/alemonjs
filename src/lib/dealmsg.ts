import { existsSync, mkdirSync, readdirSync, writeFileSync } from 'fs'
import { join } from 'path'
import { orderBy } from 'lodash'
import { Messagetype, CmdType } from 'alemon/types'
/* 非依赖引用 */
import { Tcf } from '../../app.config'

import { conversationHandlers, getConversationState } from './dialogue'

/* 全局 */
declare global {
  //功能对象
  var Apps: CmdType
  //指令对象
  var command: CmdType
}

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

/* example */
async function loadExample(dir: string) {
  const belong = 'example'
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
  let flies = readdirSync(dir)
  if (!Tcf.switch) {
    flies = flies.filter(item => item != 'point-plugin')
  }
  for (let appname of flies) {
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
  await loadExample(join(process.cwd(), '/example'))
  await loadPlugins(join(process.cwd(), '/plugins'))
  for (let val in command) {
    command[val] = orderBy(command[val], ['priority'], ['asc'])
  }
  if (cfg.sandbox) saveCommand(command)
}

/* 指令匹配 */
export async function InstructionMatching(e: Messagetype) {
  if (e.isRecall) return
  if (!command[e.event]) return

  /* 获取对话状态 */
  const state = await getConversationState(e.msg.author.id)

  /* 获取对话处理函数 */
  const handler = conversationHandlers.get(e.msg.author.id)
  if (handler && state) {
    /* 如果用户处于对话状态，则调用对话处理函数 */
    await handler(e, state)
    return
  }

  /* 循环所有指令 */
  for (const val of command[e.event]) {
    const { reg, data } = val
    /* 正则匹配 */
    if (!new RegExp(reg).test(e.cmd_msg)) continue
    /* 搜索函数 */
    if (!cmdDetection(e, data)) continue
    try {
      /* 否则，调用普通处理函数 */
      const ret = await Apps[data.event][data.belong][data.type][data.name]
        [data.fnc](e)
        .catch((err: any) => console.error(err))
      if (ret) break
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
export async function typeMessage(e: Messagetype) {
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

function cmdDetection(e: Messagetype, data: any) {
  if (e.eventType != data.eventType) return false
  if (!Apps[data.event][data.belong][data.type][data.name][data.fnc]) return false
  return true
}

function logErr(err: any, data: any) {
  console.error(`[${data.event}][${data.belong}][${data.type}][${data.name}]]`)
  console.error(err)
}
