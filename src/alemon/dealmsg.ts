import { existsSync, mkdirSync, readdirSync, writeFileSync } from 'fs'
import { join } from 'path'
import { orderBy } from 'lodash'
import { Messagetype, CmdType, getApp, delApp } from 'alemon'
/* 非依赖引用 */
import { conversationHandlers, getConversationState } from './dialogue'

const Apps: CmdType = {
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

const Command: CmdType = {
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

async function synthesis(AppsObj: object, appname: string, belong: string) {
  for (const item in AppsObj) {
    let keys = new AppsObj[item]()
    if (!keys['event'] || !keys['rule']) continue
    if (!Apps[keys['event']]) {
      console.log(` [${belong}]`, appname, `[EVENT][ERROR] ${keys['event']}`)
      continue
    }
    if (!Apps[keys['event']][belong]) {
      Apps[keys['event']][belong] = {}
    }
    if (!Apps[keys['event']][belong][appname]) {
      Apps[keys['event']][belong][appname] = {}
    }
    /* 类名 */
    Apps[keys['event']][belong][appname][item] = {}
    keys['rule'].forEach((key: any) => {
      //保存方法
      Apps[keys['event']][belong][appname][item][key['fnc']] = keys[key['fnc']]
      Command[keys['event']].push({
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
  for await (let appname of flies) {
    if (!existsSync(`${dir}/${appname}/index.js`) && !existsSync(`${dir}/${appname}/index.ts`)) {
      continue
    }
    await import(`${dir}/${appname}`).catch(error => {
      console.error(appname)
      console.error(error)
      process.exit()
    })
    const apps = getApp(appname)
    await synthesis(apps, appname, belong)
    delApp(appname)
  }
}

let cmdswich = false
/* create Command  */
async function saveCommand(cmd: CmdType) {
  let data = {
    dec: '命令总览'
  }
  //消息事件
  for (let val in cmd) {
    data[val] = []
    //消息中的数组
    for (let item of cmd[val]) {
      data[val].push(item)
    }
  }
  writeFileSync(join(process.cwd(), '/config/command.json'), JSON.stringify(data, null, '\t'))
  if (!cmdswich) {
    cmdswich = true
    /* 初始打印 */
    console.info('[CREATE] /config/command.json')
  }
}

// 收集指令
export async function cmdInit() {
  await loadExample(join(process.cwd(), '/example'))
  await loadPlugins(join(process.cwd(), '/plugins'))
  for (let val in Command) {
    Command[val] = orderBy(Command[val], ['priority'], ['asc'])
  }
  if (cfg.sandbox) saveCommand(Command)
}

/* 指令匹配 */
export async function InstructionMatching(e: Messagetype) {
  if (e.isRecall) return
  if (!Command[e.event]) return

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
  for (const val of Command[e.event]) {
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
  if (!Command[e.event]) return
  for (const val of Command[e.event]) {
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
