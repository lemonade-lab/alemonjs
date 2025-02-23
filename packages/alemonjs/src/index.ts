import './global.js'
import { join } from 'path'
import { existsSync, readFileSync } from 'fs'
import { getConfig } from './config'
import { loadModule, moduleChildrenFiles } from './app/load.js'
import { DefineBotValue } from './global.js'
import { ErrorModule } from './app/utils.js'

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
  // module
  if (cfg.value && cfg.value?.apps && Array.isArray(cfg.value.apps)) {
    for (const app of cfg.value?.apps) {
      moduleChildrenFiles(app)
    }
  }
  //  input
  const run = async () => {
    // 不存在input
    if (!input) {
      let modulePath = join(process.cwd(), 'node_modules', platform, 'package.json')
      if (existsSync(modulePath)) {
        input = JSON.parse(readFileSync(modulePath, 'utf8')).main
      } else if (
        existsSync((modulePath = join(process.cwd(), 'packages', platform, 'package.json')))
      ) {
        input = JSON.parse(readFileSync(join(modulePath), 'utf8')).main
      } else {
        console.log(`[${platform}]入口文件获取失败~`)
        return
      }
    }
    // 路径
    const mainPath = join(process.cwd(), input)
    if (!existsSync(mainPath)) return
    // src/apps/**/*
    await loadModule(mainPath)
  }
  await run()
  try {
    const bot: {
      default: DefineBotValue
    } = await import(platform)
    if (!bot.default?._name || bot.default?._name != 'platform') {
      throw new Error('The platform name is not correct')
    }
    // 挂在全局
    global.alemonjs = bot?.default.callback()
    const login = typeof cfg.argv?.login == 'string' ? cfg.argv?.login : ''
    // 新增环境变量
    process.env.platform = global.alemonjs?.platform ?? login
  } catch (e) {
    ErrorModule(e)
  }
}

export * from './post.js'
