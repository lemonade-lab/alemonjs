import { PuppeteerLaunchOptions } from 'puppeteer'
import { LoginOptions } from '../default/types.js'
import { MysqlOptions, RedisOptions } from '../default/types.js'
import { ServerOptions } from '../koa/types.js'
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
  platforms?: {
    /**
     * 机器人名称与login对应
     */
    name: string
    /**
     * 登录
     */
    call: (options: any) => {
      /**
       * 事件
       * @param event
       * @param func 函数
       * @returns
       */
      event: (event: string, func: any) => void
      /**
       * 消息配置
       */
      message: {
        // 消息类型
        type: string
        // vent构造值
        val: any
      }[]
      controlller: any
    }
  }[]
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
     * 是否执行
     */
    init?: boolean
    /**
     * 指令预览
     */
    regJSON?: {
      /**
       * 是否生成
       * defaukt true
       */
      create?: false
      /**
       * 生成地址
       * defaukt /publick/defset
       */
      address?: string
    }
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
   * 附加运行等待时间
   * defaukt app*1000
   */
  waitingTime?: number
  /**
   * 附加指令
   */
  command?: {
    cess?: 'execSync' | 'exec'
    cmd: string
  }[]
  /**
   * 附加运行脚本
   */
  scripts?: {
    /**
     * 参数
     */
    ars?: string[]
    name?: 'ts-node' | 'node'
    file: string
  }[]
  /**
   * 服务配置
   */
  server?: ServerOptions
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
   * redis配置
   */
  redis?: RedisOptions
  /**
   * mysql配置
   */
  mysql?: MysqlOptions
}
