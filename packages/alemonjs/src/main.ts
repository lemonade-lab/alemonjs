import { getConfig, getConfigValue } from './core/config.js'
import { loadChildren, loadChildrenFile } from './app/load.js'
import { getInputExportPath } from './core/utils.js'
import { useState } from './post.js'
import { join } from 'path'
import { existsSync } from 'fs'
import { ResultCode } from './core/code.js'
import { cbpServer } from './cbp/index.js'
import { cbpClient } from './cbp/connect.js'
import {
  default_platform_common_prefix,
  default_port,
  file_prefix_common
} from './core/variable.js'

const loadState = () => {
  const value = getConfigValue() ?? {}
  const state = value?.core?.state ?? []
  for (const name of state) {
    useState(name, false)
  }
}

const loadApps = () => {
  const cfg = getConfig()
  if (cfg.value && cfg.value?.apps && Array.isArray(cfg.value.apps)) {
    Promise.all(
      cfg.value.apps.map(async app => {
        loadChildrenFile(app)
      })
    )
  }
}

type ServerOptions = {
  /**
   * @description 服务器端口
   */
  port?: number
}

type ClientOptions = {
  /**
   * @description 连接到 CBP 服务器的 URL
   */
  url?: string
}

type StartOptions = ServerOptions &
  ClientOptions & {
    /**
     * @description 入口文件路径
     */
    input?: string
    /**
     * @description 平台名称
     */
    platform?: string
    /**
     * @description 登录名
     */
    login?: string
    /**
     * @description 是否全量接收
     */
    is_full_receive?: boolean
  }

/**
 * @description 运行本地模块
 * @param input
 * @returns
 */
export const run = (input: string) => {
  if (!input || input == '') return
  let mainPath = join(process.cwd(), input)
  // 路径
  if (!existsSync(input)) {
    logger.warn({
      code: ResultCode.Warn,
      message: '未找到主要入口文件',
      data: null
    })
    return
  }
  // 指定运行的，name识别为 'main:res:xxx'
  loadChildren(mainPath, 'main')
}

/**
 * @param input
 */
export const start = async (options: StartOptions | string = {}) => {
  if (typeof options === 'string') {
    // 如果是字符串，则认为是入口文件路径
    options = { input: options }
  }
  // 注入配置。
  loadState()
  const cfg = getConfig()
  const url = options?.url || cfg.argv?.url || cfg.value?.url
  // 连接到 CBP 服务器
  if (url) {
    cbpClient(url)
  } else {
    // 创建 cbp 服务器
    const port = options?.port || cfg.argv?.port || cfg.value?.port || default_port
    // 设置环境变量
    process.env.port = port
    cbpServer(port, async () => {
      console.log(`ws://127.0.0.1:${port}`)
      const url = `ws://127.0.0.1:${port}`
      const isFullReceive =
        options?.is_full_receive || cfg.argv?.is_full_receive || cfg.value?.is_full_receive || true
      cbpClient(url, { isFullReceive })
      // 加载平台服务
      const platform = options?.platform || cfg.argv?.platform || cfg.value?.platform
      const login = options?.login || cfg.argv?.login || cfg.value?.login
      // 不登录平台
      if (!platform && !login) {
        return
      }
      // 如果存在
      if (platform) {
        const reg = file_prefix_common
        if (reg.test(platform)) {
          process.env.platform = platform
          // 剪切
          process.env.login = platform.replace(reg, '')
        } else {
          process.env.platform = platform
          // 不是执行前缀。则platform 和 login 相同。
          process.env.login = platform
        }
      } else {
        // 如果没有指定平台，则使用登录名作为平台
        process.env.platform = `${default_platform_common_prefix}${login}`
        process.env.login = login
      }
      // 设置了 login。强制指定
      if (login) {
        process.env.login = login
      }
      import(process.env.platform).then(res => res?.default())
    })
  }
  // 获取入口文件
  const input = options.input || cfg.argv?.input || cfg.value?.input || getInputExportPath()
  // 运行本地模块
  run(input)
  // load module
  loadApps()
}
