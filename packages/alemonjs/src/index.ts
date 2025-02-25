import './typings.js'
import { join } from 'path'
import { existsSync } from 'fs'
import { getConfig } from './config'
import { loadModule, moduleChildrenFiles } from './app/load.js'
import { DefineBotValue } from './typings.js'
import { ErrorModule } from './app/utils.js'

//  input
const run = (input: string) => {
  // 不存在input
  if (!input) {
    return
  }
  // 路径
  const mainPath = join(process.cwd(), input)
  if (!existsSync(mainPath)) {
    logger.error(`The file ${mainPath} does not exist`)
    return
  }
  loadModule(mainPath)
}

/**
 * @param input
 */
export const start = async (input: string = 'lib/index.js', platform = '@alemonjs/gui') => {
  // 参数类型检查
  if (typeof input != 'string' || typeof platform != 'string') {
    throw new Error('The input and platform must be string')
  }
  const cfg = getConfig()
  if (typeof cfg.argv?.login == 'boolean') return
  // 参数 优先
  if (typeof cfg.argv?.login != 'undefined') {
    platform = `@alemonjs/${cfg.argv?.login}`
  } else {
    // 记录 login
    cfg.argv.login == platform.replace(/^(@alemonjs\/|alemonjs-)/, '')
  }
  // 参数 优先
  if (typeof cfg.argv?.platform == 'string') {
    cfg.argv.login = cfg.argv?.platform.replace(/^(@alemonjs\/|alemonjs-)/, '')
  }
  // 启动机器人
  try {
    const bot: {
      default: DefineBotValue
    } = await import(platform)
    if (!bot?.default) {
      throw new Error('The platform is not default')
    }
    if (!bot?.default?._name) {
      throw new Error('The platform name is not correct')
    }
    if (!bot?.default?.callback) {
      throw new Error('The platform callback is not correct')
    }
    if (typeof bot?.default?.callback !== 'function') {
      global.alemonjsBot = bot?.default.callback
    } else {
      // 挂在全局
      global.alemonjsBot = await bot?.default.callback()
    }
    const login = typeof cfg.argv?.login == 'string' ? cfg.argv?.login : ''
    // 新增环境变量
    process.env.platform = alemonjsBot?.platform ?? login
  } catch (e) {
    ErrorModule(e)
  }
  // module
  if (cfg.value && cfg.value?.apps && Array.isArray(cfg.value.apps)) {
    Promise.all(
      cfg.value.apps.map(async app => {
        moduleChildrenFiles(app)
      })
    )
  }
  // 运行本地模块
  run(input)
}

export * from './post.js'
