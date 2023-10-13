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
     * 指令预览是否生成
     */
    regJSon?: boolean
    /**
     * 是否不立即解析插件
     */
    mount?: boolean
    /**
     * 独立模块配置
     */
    module?: {
      aInput: string
      aOutput: string
    }
    /**
     * 关闭指定应用
     */
    close?: string[]
  }
  /**
   * 插件配置
   */
  plugin?: {
    /**
     * 插件目录
     */
    directory: string
  }
  /**
   * login配置
   */
  login?: LoginOptions
  /**
   * 附加指令
   */
  command?: string[]
  /**
   * 附加运行脚本
   */
  scripts?: {
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
