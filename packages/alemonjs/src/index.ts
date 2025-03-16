import './typings.js'
import { join } from 'path'
import { existsSync } from 'fs'
import { getConfig } from './config'
import { loadChildren, loadChildrenFile } from './app/load.js'
import { DefinePlatformValue } from './typings.js'
import { getInputExportPath, showErrorModule } from './app/utils.js'

/**
 * 运行指定 main
 * @param input 入口地址
 * @returns
 */
export const run = (input: string) => {
  if (!input || input == '') return
  let mainPath = join(process.cwd(), input)
  // 路径
  if (!existsSync(input)) {
    logger.error('未找到主要入口文件', mainPath)
    return
  }
  // 指定运行的，name识别为 'main:apps:xxx'
  loadChildren(mainPath, 'main')
}

/**
 * 启动
 * @param input (可选)main入口地址，默认选择 package.json 中的 main
 * @param pm (可选)平台名称，默认@alemonjs/gui。
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
    const dir = input ?? cfg.argv?.main ?? cfg.value?.main ?? getInputExportPath()
    run(dir)
  } catch (e) {
    logger.error(e)
  }
}

export * from './post.js'
