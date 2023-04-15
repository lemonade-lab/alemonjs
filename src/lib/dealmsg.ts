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
    Apps['example'] = {}
    for (let item in tmp.rule) {
      tmp.rule[item].belong = 'example'
      tmp.rule[item].type = name  //类型名
      tmp.rule[item].fnc = item  //执行方法  原名被覆盖了
      //推送了改方法中的所有参数
      command.push(tmp.rule[item])
    }

    Apps['example'][name] = tmp
    console.log(tmp)

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
      let keys = new apps[item]()
      if (!keys['rule'] || !keys['dsc'] || !keys['event'] || !keys['priority']) continue
      Apps[appname][item] = keys['rule']
      keys['rule'].forEach((key: any) => {
        const FncName = key['fnc']
        Apps[appname][item][FncName] = keys[FncName]
        command.push({
          belong: appname,
          type: item,
          fnc: FncName,
          name: keys['name'],
          event: keys['event'],
          eventType: keys['eventType'],
          reg: key['reg'],
          dsc: keys['dsc'],
          priority: keys['priority'],
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
          fnc: FncName,
          name: keys['name'],
          event: keys['event'],
          eventType: keys['eventType'],
          reg: key['reg'],
          dsc: keys['dsc'],
          priority: keys['priority'],
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
    if (!data[val.belong][val.type]) {
      /* 初始化插件名 */
      data[val.belong][val.type] = {}
    }
    /* 处理指令 */
    data[val.belong][val.type] = {
      name: val.name,
      reg: val.reg,
      fnc: val.fnc,
      event: val.event,
      eventType: val.eventType,
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
     * fnc  函数
     * req   指令
     */
    const { belong, type, event, eventType, fnc, reg } = val
    if (!Apps[belong][type] || !Apps[belong][type][fnc]) continue
    /* 信息正则匹配 */
    if (!new RegExp(reg).test(e.cmd_msg)) continue
    try {
      /* 执行函数 */
      const ret = await Apps[belong][type][fnc](e).catch((err: any) => console.log(red(err)))
      /* 真:强制不再匹配 */
      if (ret) break
    } catch (error) {
      /* 出错啦 */
      console.error(red(`[${belong}][${type}][${fnc}]`))
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
