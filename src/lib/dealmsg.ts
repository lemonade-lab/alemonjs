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

    console.log(tmp.rule)

    const belong = `example.${name}`
    Apps[belong] = {}
    for (let item of tmp.rule) {
      if (!Apps[belong][item['event']]) Apps[belong][item['event']] = {}
      if (!Apps[belong][item['event']][name]) Apps[belong][item['event']][name] = {}
      Apps[belong][item['event']][name][item['fnc']] = tmp[item['fnc']]
      command.push({
        belong,
        type: name,
        ...item,
        rule: tmp.rule
      })
    }
  }

  command = lodash.orderBy(command, ['priority'], ['asc'])
  console.info(green(`[EXAMPLE]`), ` ${Object.keys(Apps).length} app`)
  global.Apps = Apps
  global.command = command
  await saveCommand(command).catch((err: any) => console.log(red(err)))
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
  readDir = readDir.filter(item => /.ts$/.test(item))
  for (let appname of readDir) {
    if (!existsSync(`${dir}/${appname}`)) continue
    const { apps } = await import(`${dir}/${appname}`).catch(error => {
      console.error(red(`err:${appname}`))
      console.error(red(error))
      process.exit()
    })
    Apps[appname] = {}
    for (const item in apps) {
      //类
      let keys = new apps[item]()
      //没有事件和指令集
      if (!keys['event'] || !keys['rule']) continue
      //插件名、类名、
      Apps[appname][keys['event']] = {}
      //插件名、类名、事件名
      Apps[appname][keys['event']][item] = {}
      //有很多的方法
      keys['rule'].forEach((key: any) => {
        //保存方法
        Apps[appname][keys['event']][item][key['fnc']] = keys[key['fnc']]
        //记录方法参数
        command.push({
          belong: appname,
          type: item,
          name: keys['name'],
          event: keys['event'],
          eventType: keys['eventType'],
          rule: keys['rule'],
          dsc: keys['dsc'],
          priority: keys['priority']
        })
      })
    }
  }
  command = lodash.orderBy(command, ['priority'], ['asc'])
  console.info(green(`[PROGRAM]`), ` ${Object.keys(Apps).length} apps`)
  global.Apps = { ...global.Apps, ...Apps }
  global.command = command
  await saveCommand(command).catch((err: any) => console.log(red(err)))
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
    const { apps } = await import(`${dir}/${appname}`).catch(error => {
      console.error(red(`err:${appname}`))
      console.error(red(error))
      process.exit()
    })
    //插件名
    Apps[appname] = {}
    for (const item in apps) {
      //类
      let keys = new apps[item]()
      //没有事件和指令集
      if (!keys['event'] || !keys['rule']) continue
      //插件名、类名、
      Apps[appname][keys['event']] = {}
      //插件名、类名、事件名
      Apps[appname][keys['event']][item] = {}
      //有很多的方法
      keys['rule'].forEach((key: any) => {
        //保存方法
        Apps[appname][keys['event']][item][key['fnc']] = keys[key['fnc']]
        //记录方法参数
        command.push({
          belong: appname,
          type: item,
          name: keys['name'],
          event: keys['event'],
          eventType: keys['eventType'],
          rule: keys['rule'],
          dsc: keys['dsc'],
          priority: keys['priority']
        })
      })
    }
  }
  command = lodash.orderBy(command, ['priority'], ['asc'])
  console.info(green(`[PLUGINS]`), ` ${Object.keys(Apps).length} apps`)
  global.Apps = { ...global.Apps, ...Apps }
  global.command = command
  await saveCommand(command).catch(err => console.log(red(err)))
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
    if (!data[val.belong][val.event]) {
      /* 初始化插件名 */
      data[val.belong][val.event] = {}
    }
    /* 处理指令 */
    data[val.belong][val.event][val.type] = {
      name: val.name,
      dsc: val.dsc,
      event: val.event,
      eventType: val.eventType,
      priority: val.priority,
      rule: val.rule
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
     * fnc  函数
     * req   指令
     */
    const { belong, type, event, eventType, rule } = val
    if (rule) {
      for (let item of rule) {
        if (!Apps[belong][event]) continue
        if (!Apps[belong][event][type]) continue
        /* 信息正则匹配 */
        if (!new RegExp(item.reg).test(e.cmd_msg)) continue
        try {
          /* 执行函数 */
          const ret = await Apps[belong][event][type][item.fnc](e).catch((err: any) => console.log(red(err)))
          /* 真:强制不再匹配 */
          if (ret) break
        } catch (error) {
          /* 出错啦 */
          console.error(red(`[${belong}][${event}][${type}][${item.fnc}]`))
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
  }
}
