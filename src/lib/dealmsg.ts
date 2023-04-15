import { existsSync, mkdirSync, readdirSync, watch, writeFileSync } from 'fs'
import { green, red, yellow } from 'kolorist'
import { join } from 'path'
import lodash from 'lodash'

/* 非依赖引用 */
import { readYaml } from './tool'
import { messgetype, cmdTyoe } from './types'
/* 全局 */
declare global {
  var Apps: {}
  var command: Array<cmdTyoe>
}

function watchC() {
  watch(join(process.cwd(), '/config/config.yaml'), async (event, filename) => {

    setTimeout(async () => {
      const file = join(process.cwd(), '/config/config.yaml')
      const config = readYaml(file)

      if (
        (config ?? '') === '' ||
        (config.account ?? '') === '' ||
        JSON.stringify(cfg) !== JSON.stringify(config.account)
      ) {
        console.warn(yellow(join(process.cwd(), '/config/config.yaml updata deed reboot')))
        process.exit()
      }
    }, 500)
  })
}

/* example */
async function loadExample(dir: string) {
  let Apps = {}
  let command = []
  let readDir = readdirSync(dir)
  readDir = readDir.filter((item) => /.(js|ts)$/.test(item))
  for (let appname of readDir) {
    let name = appname.slice(0, appname.lastIndexOf('.'))
    let tmp = await import(`${dir}/${name}`).catch((error) => {
      console.error(red(`报错:${appname}`))
      console.error(error)
      process.exit()
    })
    if (!tmp) return
    if (!tmp.rule) continue
    Apps['example'] = {}
    Apps['example'][name] = tmp
    for (let item in tmp.rule) {
      tmp.rule[item].belong = 'example'
      tmp.rule[item].type = name
      tmp.rule[item].name = item
      command.push(tmp.rule[item])
    }
  }
  command = lodash.orderBy(command, ['priority'], ['asc'])
  console.info(green(`[EXAMPLE]`), ` ${Object.keys(Apps).length} app`)
  global.Apps = Apps
  global.command = command
  await saveCommand(command)
}

/* program */
async function loadProgram(dir: string) {
  let Apps = {}
  let command = global.command || []
  /* 初始化 */
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true })
  /* 读取文件 */
  let readDir = readdirSync(dir)
  /* 正则匹配ts文件并返回 */
  readDir = readDir.filter((item) => /.ts$/.test(item))
  for (let appname of readDir) {
    if (!existsSync(`${dir}/${appname}`)) continue
    const { apps } = await import(`${dir}/${appname}`).catch((error) => {
      console.error(red(`err:${appname}`))
      console.error(red(error))
      process.exit()
    })
    Apps[appname] = {}
    for (const item in apps) {
      let keys = new apps[item]()
      if (!keys['rule'] || !keys['dsc'] || !keys['event'] || !keys['priority']) continue
      Apps[appname][item] = keys['rule']
      keys['rule'].forEach((key: any) => {
        const FncName = key['fnc']
        Apps[appname][item][FncName] = keys[FncName]
        command.push({
          belong: appname,
          type: item,
          name: FncName,
          reg: key['reg'],
          dsc: keys['dsc'],
          priority: keys['priority'],
          event: keys['event']
        })
      })
    }
  }
  command = lodash.orderBy(command, ['priority'], ['asc'])
  console.info(green(`[PROGRAM]`), ` ${Object.keys(Apps).length} apps`)
  global.Apps = { ...global.Apps, ...Apps }
  global.command = command
  await saveCommand(command)
}

/* plugins */
async function loadPlugins(dir: string) {
  let Apps = {}
  let command = global.command || []
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true })
  const readDir = readdirSync(dir)
  for (let appname of readDir) {
    if (!existsSync(`${dir}/${appname}/index.js`) && !existsSync(`${dir}/${appname}/index.ts`))
      continue
    const { apps } = await import(`${dir}/${appname}`).catch((error) => {
      console.error(red(`err:${appname}`))
      console.error(red(error))
      process.exit()
    })
    Apps[appname] = {}
    for (const item in apps) {
      let keys = new apps[item]()
      if (!keys['rule'] || !keys['dsc'] || !keys['event'] || !keys['priority']) continue
      Apps[appname][item] = keys['rule']
      keys['rule'].forEach((key: any) => {
        const FncName = key['fnc']
        Apps[appname][item][FncName] = keys[FncName]
        command.push({
          belong: appname,
          type: item,
          name: FncName,
          reg: key['reg'],
          dsc: keys['dsc'],
          priority: keys['priority'],
          event: keys['event']
        })
      })
    }
  }
  command = lodash.orderBy(command, ['priority'], ['asc'])
  console.info(green(`[PLUGINS]`), ` ${Object.keys(Apps).length} apps`)
  global.Apps = { ...global.Apps, ...Apps }
  global.command = command
  await saveCommand(command)
}

let commswich = false
/* create command  */
async function saveCommand(command: any[]) {
  let data = {
    dec: '命令总览json'
  }
  for (let val of command) {
    if (!data[val.belong]) {
      /* 初始化插件类型 */
      data[val.belong] = {}
    }
    if (!data[val.belong][val.type]) {
      /* 初始化插件名 */
      data[val.belong][val.type] = {}
    }
    /* 处理指令 */
    data[val.belong][val.type][val.name] = {
      reg: val.reg,
      event: val.event,
      priority: val.priority,
      dsc: val.dsc
    }
  }
  writeFileSync(join(process.cwd(), '/config/command.json'), JSON.stringify(data, null, '\t'))
  if (!commswich) {
    commswich = true
    /* 初始打印 */
    console.log(green('[RULE]'), `/config/command.json OK`)
  }
}

// 初始化指令
export async function init() {
  await loadExample(join(process.cwd(), '/example'))
  await loadProgram(join(process.cwd(), '/program'))
  await loadPlugins(join(process.cwd(), '/plugins'))
  watchC()
}

// 指令匹配
export async function InstructionMatching(e: messgetype) {
  /* 循环所有指令 */
  for (const val of command) {
    /**
     * belong 插件类型
     * type  插件名
     * name  类名
     * event 消息事件
     * eventType 消息类型
     * req   指令
     */
    const { belong, type, name, reg, event } = val
    if (!Apps[belong][type] || !Apps[belong][type][name]) continue
    /* 信息正则匹配 */
      console.log('123')
    if (!new RegExp(reg).test(e.cmd_msg)) continue
    try {
      /* 执行函数 */
      const res = await Apps[belong][type][name](e)
      /* 真:强制不再匹配 */
      if (res) break
    } catch (error) {
      /* 出错啦 */
      console.error(red(`[${belong}][${type}][${name}]`))
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