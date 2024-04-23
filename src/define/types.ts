import { PuppeteerLaunchOptions } from 'puppeteer'
import { LoginOptions, PlatformsItemType } from '../default/types.js'
import { FileOptions } from '../file/types.js'
import {
  ApplicationProcessingOpsion,
  type ApplicationProcessKeyScriptType,
  type ServerOptions
} from '../core/index.js'
import { EmailOptions } from '../email/types.js'
import { type DotenvConfigOptions } from 'dotenv'

/**
 * ******
 * config
 * ******
 */
export interface AlemonOptions {
  /**
   * 平台
   */
  platforms?: PlatformsItemType[]
  /**
   * login配置
   */
  login?: LoginOptions
  /**
   * 指定读取登录ts/js文件
   */
  loginDir?: string
  /**
   * 是否挂载应用
   */
  mount?: false
  /**
   * 个人应用
   */
  app?: {
    /**
     * 是否初始化
     */
    init?: boolean
    /**
     * 执行脚本
     */
    scripts?: string
  }
  /**
   * 插件配置
   */
  plugin?: {
    /**
     * 是否加载插件
     */
    init?: false
    /**
     * 插件目录
     */
    directory?: string
  } & ApplicationProcessingOpsion
  /**
   * 事件屏蔽
   */
  shieldEvent?: string[]
  /**
   * 图片存储函数
   */
  imageStorage?: (val: Buffer) => Promise<string | false>
  /**
   * 服务器
   */
  server?: ServerOptions
  /**
   * 服务配置
   */
  file?: FileOptions
  /**
   * 是否启动pup
   * defaut true
   */
  pupStart?: false
  /**
   * puppeteer配置
   */
  puppeteer?: PuppeteerLaunchOptions
  /**
   * env
   */
  env?: DotenvConfigOptions
  /**
   * 系统状态-邮箱订阅
   */
  email?: EmailOptions
}
