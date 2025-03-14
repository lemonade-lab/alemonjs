import './typings.js'
import { join } from 'path'
import { existsSync } from 'fs'
import { getConfig } from './config'
import { loadChildren, loadChildrenFile } from './app/load.js'
import { DefinePlatformValue } from './typings.js'
import { showErrorModule } from './app/utils.js'

/**
 * 运行指定 main
 * @param input
 * @returns
 */
export const run = (input: string) => {
  if (!input) {
    // 抛出错误
    throw new Error('The input is not correct')
  }
  // 路径
  const mainPath = join(process.cwd(), input)
  if (!existsSync(mainPath)) {
    logger.error(`The file ${mainPath} does not exist`)
    return
  }
  // 指定运行的，name识别为 'main:apps:xxx'
  loadChildren(mainPath, 'main')
}

/**
 * 启动
 * @param input
 */
export const start = async (input?: string, pm?: string) => {
  const cfg = getConfig()
  const platform$1 = pm ?? cfg.argv?.platform ?? cfg.value?.platform
  const login$1 = platform$1 ? platform$1.replace(/^(@alemonjs\/|alemonjs-)/, '') : null
  const login = login$1 ?? cfg.argv?.login ?? cfg.value?.login ?? 'gui'
  const prefix = platform$1 && /^alemonjs-/.test(platform$1) ? `alemonjs-` : `@alemonjs/`
  const platform = `${prefix}${login}`
  // 启动机器人
  try {
    const bot: {
      default: DefinePlatformValue
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
    logger.error('启动', login, '失败')
    showErrorModule(e)
  }
  // module
  if (cfg.value && cfg.value?.apps && Array.isArray(cfg.value.apps)) {
    Promise.all(
      cfg.value.apps.map(async app => {
        loadChildrenFile(app)
      })
    )
  }
  // 运行本地模块
  try {
    const dir = input ?? cfg.argv?.main ?? cfg.value?.main
    if (dir) {
      run(dir)
    }
  } catch (e) {
    logger.error(e)
  }
}

export * from './post.js'
