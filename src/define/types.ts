import { PuppeteerLaunchOptions } from 'puppeteer'
import { LoginOptions } from '../default/types.js'
import { MysqlOptions, RedisOptions } from '../default/types.js'
import { ServerOptions } from '../koa/types.js'
import { type ControllersType } from '../core/index.js'
import { APPS } from '../core/index.js'
import { EmailOptions } from '../email/types.js'

export interface PlatformsItemType {
  /**
   * 机器人名称与login对应
   */
  name: string
  /**
   * 控制器
   */
  controllers: ControllersType
  /**
   * 登录
   */
  login: (
    /**
     * 登录配置
     */
    options: any,
    /**
     * 消息事件
     */
    responseMessage: typeof APPS.responseMessage,
    /**
     * 非消息事件
     */
    responseEventType: typeof APPS.responseEventType
  ) => any
}

/**
 * ******
 * config
 * ******
 */
export interface AlemonOptions {
  /**
   * 配置
   */
  [key: string]: any
  /**
   * 平台
   */
  platforms?: PlatformsItemType[]
  /**
   * login配置
   */
  login?: LoginOptions
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
    /**
     * 插件名匹配规则
     */
    RegexOpen?: RegExp
    /**
     * 插件名关闭规则
     */
    RegexClose?: RegExp
    /**
     * 插件入口
     * 默认index
     * type='ts'
     * 即 index.ts
     */
    main?: string
    /**
     * 入口文件类型
     */
    type?: 'ts' | 'js' | 'stript'
  }
  /**
   * 事件屏蔽
   */
  shieldEvent?: string[]
  /**
   * **********
   * **********
   */

  /**
   * puppeteer配置
   */
  puppeteer?: PuppeteerLaunchOptions
  /**
   * 是否启动pup
   * defaut true
   */
  pupStart?: false
  /**
   * 服务配置
   */
  server?: ServerOptions
  /**
   * redis配置
   */
  redis?: RedisOptions
  /**
   * mysql配置
   */
  mysql?: MysqlOptions
  /**
   * 系统状态-邮箱订阅
   */
  email?: EmailOptions
}
