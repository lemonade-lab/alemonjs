import { PuppeteerLaunchOptions } from 'puppeteer'
import {
  LoginOptions,
  MysqlOptions,
  RedisOptions,
  ServerOptions
} from '../default/types.js'
/**
 * ******
 * config
 * ******
 */
export interface AlemonOptions {
  app?: {
    /**
     * 应用名称
     */
    name?: string
    /**
     * 可执行的依赖包
     */
    component?: any[]
    /**
     * 指令预览
     */
    regJSon?: {
      /**
       * 是否生成
       * defaukt true
       */
      create?: boolean
      /**
       * 生成地址
       * defaukt /publick/defset
       */
      address?: string
    }
    /**
     * 独立模块配置
     */
    module?: {
      /**
       * 输入规则
       */
      input?: string
      /**
       * 输出规则
       */
      output?: string
    }
    /**
     * 关闭指定应用
     */
    close?: string[]
    /**
     * 重定义消息对象
     * @param args
     * @returns
     */
    redefineMessage?: (...args: any[]) => any
  }
  /**
   * 插件配置
   */
  plugin?: {
    /**
     * 是否加载插件
     */
    init?: boolean
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
  }
  /**
   * login配置
   */
  login?: LoginOptions
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
   * redis配置
   */
  redis?: RedisOptions
  /**
   * mysql配置
   */
  mysql?: MysqlOptions
}
