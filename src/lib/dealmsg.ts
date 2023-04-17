import { existsSync, mkdirSync, readdirSync, watch, writeFileSync } from 'fs'
import { green, red, yellow } from 'kolorist'
import { join } from 'path'
import lodash from 'lodash'

/* 非依赖引用 */
import { readYaml } from './tool'
import { messgetype } from './types'

/* 全局 */
declare global {
  var Apps: {}
  var command: {}
}

const createApps = () => {
  global.Apps = {
    /* 频道会话消息 */
    GUILD_MESSAGES: {},
    /* 论坛消息 */
    FORUMS_EVENT: {},
    //公
    /* 频道会话消息 */
    PUBLIC_GUILD_MESSAGES: {},
    /* 论坛消息 */
    OPEN_FORUMS_EVENT: {},
    //私
    /* 机器人进出频道消息 */
    GUILDS: {},
    /* 成员频道进出变动消息 */
    GUILD_MEMBERS: {},
    /* 频道表情点击会话消息 */
    GUILD_MESSAGE_REACTIONS: {},
    /* 私聊会话消息 */
    DIRECT_MESSAGE: {},
    /* 互动事件监听 */
    INTERACTION: {},
    /* 音频事件 */
    AUDIO_ACTION: {}
  }

  global.command = {
    /* 频道会话消息 */
    GUILD_MESSAGES: [],
    /* 论坛消息 */
    FORUMS_EVENT: [],
    //公
    /* 频道会话消息 */
    PUBLIC_GUILD_MESSAGES: [],
    /* 论坛消息 */
    OPEN_FORUMS_EVENT: [],
    //私
    /* 机器人进出频道消息 */
    GUILDS: [],
    /* 成员频道进出变动消息 */
    GUILD_MEMBERS: [],
    /* 频道表情点击会话消息 */
    GUILD_MESSAGE_REACTIONS: [],
    /* 私聊会话消息 */
    DIRECT_MESSAGE: [],
    /* 互动事件监听 */
    INTERACTION: [],
    /* 音频事件 */
    AUDIO_ACTION: []
  }
}

const watchDir = `/config/config.yaml`

function watchC() {
  watch(join(process.cwd(), watchDir), async (event, filename) => {
    setTimeout(async () => {
      /* 配置地址 */
      const file = join(process.cwd(), watchDir)
      /* 读取配置 */
      const config = readYaml(file)
      if (
        (config ?? '') === '' ||
        (config.account ?? '') === '' ||
        JSON.stringify(cfg) !== JSON.stringify(config.account)
      ) {
        console.log(yellow('[updata]'), watchDir, ' you deed reboot ')
        process.exit()
      }
    }, 500)

  })
}

/* example */
async function loadExample(dir: string) {
  //初始化
  createApps()
  const belong = 'example'
  let readDir = readdirSync(dir)
  readDir = readDir.filter(item => /.(js|ts)$/.test(item))
  for (let appname of readDir) {
    let name = appname.slice(0, appname.lastIndexOf('.'))
    let tmp = await import(`${dir}/${name}`).catch(error => {
      console.error(red(`报错:${appname}`))
      console.error(error)
      process.exit()
    })
    if (!tmp) return
    if (!tmp.rule) continue
    for (let item of tmp.rule) {
      if (!item['event']) continue
      if (!global.Apps[item['event']][belong]) global.Apps[item['event']][belong] = {}
      if (!global.Apps[item['event']][belong][appname])
        global.Apps[item['event']][belong][appname] = {}
      global.Apps[item['event']][belong][appname][item['name']] = {}
      global.Apps[item['event']][belong][appname][item['name']][item['fnc']] = tmp[item['fnc']]
      global.command[item['event']].push({
        reg: item['reg'],
        priority: item['priority'],
        data: {
          event: item['event'],
          eventType: item['eventType'],
          belong,
          type: appname,
          name: item['name'],
          dsc: item['dsc'],
          fnc: item['fnc']
        }
      })
    }
  }
}

async function synthesis(apps: object, appname: string, belong: string) {
  for (const item in apps) {
    let keys = new apps[item]()
    // 没有类型和指令
    if (!keys['event'] || !keys['rule']) continue
    if (!global.Apps[keys['event']][belong]) global.Apps[keys['event']][belong] = {}
    if (!global.Apps[keys['event']][belong][appname])
      global.Apps[keys['event']][belong][appname] = {}
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
  let readDir = readdirSync(dir)
  /* 正则匹配ts文件并返回 */
  readDir = readDir.filter(item => /.(ts|js)$/.test(item))
  for (let appname of readDir) {
    if (!existsSync(`${dir}/${appname}`)) continue
    const { apps } = await import(`${dir}/${appname}`).catch(error => {
      console.error(red(`err:${appname}`))
      console.error(red(error))
      process.exit()
    })
    synthesis(apps, appname, belong)
  }
}

/* plugins */
async function loadPlugins(dir: string) {
  const belong = 'plugins'
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true })
  const readDir = readdirSync(dir)
  for (let appname of readDir) {
    if (!existsSync(`${dir}/${appname}/index.js`) && !existsSync(`${dir}/${appname}/index.ts`))
      continue
    const { apps } = await import(`${dir}/${appname}`).catch(error => {
      console.error(red(`err:${appname}`))
      console.error(red(error))
      process.exit()
    })
    synthesis(apps, appname, belong)
  }
}

let commswich = false
/* create command  */
async function saveCommand(command: object) {
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
    console.log(green('[RULE]'), `/config/command.json OK`)
  }
}

// 收集指令
export async function init() {
  await loadExample(join(process.cwd(), '/example'))
  await loadProgram(join(process.cwd(), '/program'))
  await loadPlugins(join(process.cwd(), '/plugins'))
  /** 全部收集完了之后重新排序*/
  for (let val in command) {
    command[val] = lodash.orderBy(command[val], ['priority'], ['asc'])
  }
  saveCommand(command)
  watchC()
}

// 指令匹配
export async function InstructionMatching(e: messgetype) {
  /* 循环所有指令 */
  for (const val of command[e.event]) {
    const { reg, data } = val
    if (!Apps[e.event][data.belong]) continue
    if (!Apps[e.event][data.belong][data.type]) continue
    if (!Apps[e.event][data.belong][data.type][data.name]) continue
    /* 信息正则匹配 */
    if (e.isRecall) continue
    if (!new RegExp(reg).test(e.cmd_msg)) continue
    try {
      /* 执行函数 */
      const ret = await Apps[e.event][data.belong][data.type][data.name]
      [data.fnc](e)
        .catch((err: any) => console.log(red(err)))
      /* 真:强制不再匹配 */
      if (ret) break
    } catch (error) {
      /* 出错啦 */
      console.error(red(`[${e.event}][${data.belong}][${data.type}][${data.name}][${data.fnc}]`))
      let err = JSON.stringify(error, null, 2)
      if (err + '' === '{}') {
        console.log(red(error))
      } else {
        console.log(red(err))
      }
      return
    }
  }
}

export async function RecallMessage(e: any) {
  for (const val of command[e.event]) {
    const { data } = val
    if (!Apps[e.event][data.belong]) continue
    if (!Apps[e.event][data.belong][data.type]) continue
    if (!Apps[e.event][data.belong][data.type][data.name]) continue
    /* 信息正则匹配 */
    if (!e.isRecall) continue
    if (e.eventType != data.eventType) continue
    try {
      /* 执行函数 */
      const ret = await Apps[e.event][data.belong][data.type][data.name]
      [data.fnc](e)
        .catch((err: any) => console.log(red(err)))
      /* 真:强制不再匹配 */
      if (ret) break
    } catch (error) {
      /* 出错啦 */
      console.error(red(`[${e.event}][${data.belong}][${data.type}][${data.name}][${data.fnc}]`))
      let err = JSON.stringify(error, null, 2)
      if (err + '' === '{}') {
        console.log(red(error))
      } else {
        console.log(red(err))
      }
      return
    }
  }
}
